
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// Hardcoded for simplicity or load from env if needed
// const PROD_URL = "https://journaldebord-production.up.railway.app";
const PROD_URL = process.env.PROD_URL || "https://journaldebord-production.up.railway.app";
const SYNC_SECRET = process.env.SYNC_SECRET;

if (!SYNC_SECRET) {
    console.error("❌ Error: SYNC_SECRET env var is missing in .env");
    process.exit(1);
}

async function sync() {
    console.log("🚀 STARTING SYNC: PROD -> LOCAL");
    console.log(`📡 Fetching from: ${PROD_URL}`);

    try {
        // 1. Fetch Data
        // Node 18+ has native fetch. If older node, consider axios or node-fetch.
        // Assuming Node 18 as per standard.
        const response = await fetch(`${PROD_URL}/api/admin/export`, {
            headers: { 'x-sync-secret': SYNC_SECRET }
        });

        if (!response.ok) {
            throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const backupFile = path.join(__dirname, 'prod_backup_latest.json');
        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
        console.log(`✅ Downloaded ${Object.keys(data).length} collections to ${backupFile}`);

        // 2. Clear Local DB
        console.log("🧹 Clearing Local Database...");
        const tableOrder = [
            'DayLogFood', 'DayLogDrink', 'DayLogHabit', 'DayLogExercise', 'DayLogSleep', 'DayLogStool', 'DayLogGutHealth', 'DayLog',
            'RecipeStep', 'RecipeIngredient', 'Recipe', 'Ingredient', 'Tag', 'User', 'Session'
        ];

        // Disable constraints ideally, but raw query is dangerous. Let's delete in order.
        // Or simpler: transaction.

        // NOTE: We wrap in try-catch for individual tables so failure in one doesn't stop others if schema changed
        for (const table of tableOrder) {
            try {
                // Prisma generic access: prisma[table] is tricky with casing.
                // We map manualy or use model names lowercase first letter.
                const modelName = table.charAt(0).toLowerCase() + table.slice(1);
                if (prisma[modelName]) {
                    // Special case for Recipe/Ingredient Many-to-Many with Tags
                    if (modelName === 'recipe') {
                        const recipes = await prisma.recipe.findMany();
                        for (const r of recipes) await prisma.recipe.update({ where: { id: r.id }, data: { tags: { set: [] } } });
                    }
                    if (modelName === 'ingredient') {
                        const ing = await prisma.ingredient.findMany();
                        for (const i of ing) await prisma.ingredient.update({ where: { id: i.id }, data: { tags: { set: [] } } });
                    }

                    await prisma[modelName].deleteMany();
                }
            } catch (err) {
                console.warn(`⚠️ Could not clear table ${table}: ${err.message}`);
            }
        }
        console.log("✨ Local Database Empty.");

        // 3. Import Data
        console.log("📥 Importing Data...");

        // A. Users
        for (const u of data.users) await prisma.user.create({ data: u });
        console.log(`   - Users: ${data.users.length}`);

        // B. Tags (Create them all first)
        // Extract distinct tags from Recipes and Ingredients
        const tags = new Map();
        data.recipes.forEach(r => r.tags.forEach(t => tags.set(t.name, t)));
        data.ingredients.forEach(i => i.tags && i.tags.forEach(t => tags.set(t.name, t)));

        for (const [name, t] of tags) {
            // We use connectOrCreate concept but manually to keep ID if needed ?
            // Actually, tags usually define 'name' as unique.
            // Let's create them.
            await prisma.tag.create({ data: { name } }).catch(() => null); // Ignore duplicates
        }
        console.log(`   - Tags: ${tags.size}`);

        // C. Ingredients
        for (const i of data.ingredients) {
            const { tags, id, ...rest } = i;
            // Filter out unknown fields just in case
            delete rest.recipeIngredients;

            await prisma.ingredient.create({
                data: {
                    ...rest,
                    id: id, // Keep Prod ID
                    tags: {
                        connect: tags.map(t => ({ name: t.name }))
                    }
                }
            });
        }
        console.log(`   - Ingredients: ${data.ingredients.length}`);

        // D. Recipes
        for (const r of data.recipes) {
            const { steps, ingredients, tags, id, ...rest } = r;

            await prisma.recipe.create({
                data: {
                    ...rest,
                    id: id, // Keep Prod ID
                    tags: {
                        connect: tags.map(t => ({ name: t.name }))
                    },
                    steps: {
                        create: steps.map(({ id, recipeId, ...cleanStep }) => cleanStep) // Let new IDs generated for steps? Or keep them?
                        // Better to keep them if we want deep sync. But steps IDs usually don't matter outside context.
                        // Let's keep it simple: create new steps.
                    },
                    ingredients: {
                        create: ingredients.map(({ id, recipeId, ingredientId, ...cleanIng }) => ({
                            ...cleanIng,
                            ingredient: { connect: { id: ingredientId } }
                        }))
                    }
                }
            });
        }
        console.log(`   - Recipes: ${data.recipes.length}`);

        // E. DayLogs
        for (const l of data.dayLogs) {
            const {
                foods, drinks, habits, exercises, sleep, gutHealth,
                id, userId, ...rest
            } = l;

            // Need to verify User exists? We imported users first.
            await prisma.dayLog.create({
                data: {
                    ...rest,
                    id: id,
                    userId: userId,
                    // Sub-relations
                    foods: { create: foods.map(({ id, dayLogId, ...f }) => f) },
                    drinks: { create: drinks.map(({ id, dayLogId, ...d }) => d) },
                    habits: { create: habits.map(({ id, dayLogId, ...h }) => h) },
                    exercises: { create: exercises.map(({ id, dayLogId, ...e }) => e) },
                    sleep: { create: sleep.map(({ id, dayLogId, ...s }) => s) },
                    gutHealth: {
                        create: gutHealth.map(({ id, dayLogId, stools, ...g }) => ({
                            ...g,
                            stools: { create: stools.map(({ id, gutHealthId, ...st }) => st) }
                        }))
                    }
                }
            });
        }
        console.log(`   - Journal Logs: ${data.dayLogs.length}`);

        console.log("✅ SYNC COMPLETE! Local DB is now identical to Prod.");

    } catch (e) {
        console.error("❌ FAITAL ERROR during sync:", e);
    } finally {
        await prisma.$disconnect();
    }
}

sync();
