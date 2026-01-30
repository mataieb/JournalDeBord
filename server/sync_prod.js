
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const PROD_URL = process.env.PROD_URL || "https://journaldebord-production.up.railway.app";
const SYNC_SECRET = process.env.SYNC_SECRET;

if (!SYNC_SECRET) {
    console.error("❌ Error: SYNC_SECRET env var is missing in .env");
    process.exit(1);
}

async function sync() {
    console.log("🚀 STARTING SYNC (CORRECTED NAMES): PROD -> LOCAL");

    try {
        // 1. Fetch
        const response = await fetch(`${PROD_URL}/api/admin/export`, {
            headers: { 'x-sync-secret': SYNC_SECRET }
        });
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        const data = await response.json();
        const backupFile = path.join(__dirname, 'prod_backup_latest.json');
        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
        console.log(`✅ Downloaded data to ${backupFile}`);

        // 2. Clear DB
        console.log("🧹 Clearing DB...");

        // Delete leaves first (Correct Model Names from Schema)
        await prisma.foodItem.deleteMany();
        await prisma.drinkItem.deleteMany();
        await prisma.habitItem.deleteMany();
        await prisma.exercise.deleteMany();
        await prisma.sleep.deleteMany();
        await prisma.stoolEntry.deleteMany();
        await prisma.gutHealth.deleteMany();
        await prisma.dayLog.deleteMany();

        await prisma.step.deleteMany();
        await prisma.recipeIngredient.deleteMany();

        // Clear Tag relations
        const recipes = await prisma.recipe.findMany();
        for (const r of recipes) await prisma.recipe.update({ where: { id: r.id }, data: { tags: { set: [] } } });

        await prisma.recipe.deleteMany();

        const ingredients = await prisma.ingredient.findMany();
        for (const i of ingredients) await prisma.ingredient.update({ where: { id: i.id }, data: { tags: { set: [] } } });

        await prisma.ingredient.deleteMany();

        await prisma.tag.deleteMany();
        // await prisma.session.deleteMany(); // Not in Prisma Schema
        await prisma.user.deleteMany();
        console.log("✨ DB Cleared");

        // 3. Import
        // A. Users
        console.log(`📥 Users (${data.users.length})...`);
        for (const u of data.users) await prisma.user.create({ data: u });

        // B. Tags 
        console.log("📥 Tags...");
        const allTags = new Set();
        data.recipes.forEach(r => r.tags.forEach(t => allTags.add(t.name)));
        data.ingredients.forEach(i => (i.tags || []).forEach(t => allTags.add(t.name)));
        for (const tagName of allTags) {
            await prisma.tag.create({ data: { name: tagName } }).catch(() => null);
        }

        // C. Ingredients 
        console.log(`📥 Ingredients (${data.ingredients.length})...`);
        for (const i of data.ingredients) {
            const { tags, recipeIngredients, ...cleanI } = i;
            await prisma.ingredient.create({
                data: {
                    ...cleanI,
                    tags: { connect: (tags || []).map(t => ({ name: t.name })) }
                }
            });
        }

        // D. Recipes
        console.log(`📥 Recipes (${data.recipes.length})...`);
        for (const r of data.recipes) {
            const { steps, ingredients, tags, ...cleanR } = r;
            await prisma.recipe.create({
                data: {
                    ...cleanR,
                    tags: { connect: (tags || []).map(t => ({ name: t.name })) }
                }
            });
        }

        // E. Recipe Details
        console.log("📥 Recipe Details...");
        for (const r of data.recipes) {
            if (r.steps) {
                for (const s of r.steps) {
                    const { id, recipeId, ...cleanS } = s;
                    await prisma.step.create({ data: { ...cleanS, recipeId: r.id } });
                }
            }
            if (r.ingredients) {
                for (const ri of r.ingredients) {
                    const { id, recipeId, ingredientId, subRecipeId, ...cleanRI } = ri;
                    const relation = {};
                    if (ingredientId) relation.ingredientId = ingredientId; // Direct FK set
                    if (subRecipeId) relation.subRecipeId = subRecipeId;

                    await prisma.recipeIngredient.create({
                        data: {
                            ...cleanRI,
                            recipeId: r.id,
                            ...relation
                        }
                    });
                }
            }
        }

        // F. DayLogs 
        console.log(`📥 DayLogs (${data.dayLogs.length})...`);
        for (const l of data.dayLogs) {
            const {
                foods, drinks, habits, exercises, sleep, gutHealth,
                user, ...cleanL
            } = l;
            await prisma.dayLog.create({ data: cleanL });

            // Sub-Logs (Using Correct Model Names)

            // One-to-Many Arrays
            if (foods && Array.isArray(foods)) {
                for (const f of foods) {
                    const { id, dayLogId, recipe, ...rest } = f; // recipe relation in foodItem?
                    await prisma.foodItem.create({ data: { ...rest, dayLogId: l.id } });
                }
            }
            if (drinks && Array.isArray(drinks)) {
                for (const d of drinks) {
                    const { id, dayLogId, ...rest } = d;
                    await prisma.drinkItem.create({ data: { ...rest, dayLogId: l.id } });
                }
            }
            if (habits && Array.isArray(habits)) {
                for (const h of habits) {
                    const { id, dayLogId, ...rest } = h;
                    await prisma.habitItem.create({ data: { ...rest, dayLogId: l.id } });
                }
            }
            if (exercises && Array.isArray(exercises)) {
                for (const e of exercises) {
                    const { id, dayLogId, ...rest } = e;
                    await prisma.exercise.create({ data: { ...rest, dayLogId: l.id } });
                }
            }

            // One-to-One Objects (Not Arrays!)
            if (sleep) {
                const { id, dayLogId, ...restS } = sleep;
                await prisma.sleep.create({ data: { ...restS, dayLogId: l.id } });
            }

            if (gutHealth) {
                const { id, dayLogId, stools, ...restG } = gutHealth;
                const newG = await prisma.gutHealth.create({ data: { ...restG, dayLogId: l.id } });

                if (stools && Array.isArray(stools)) {
                    for (const s of stools) {
                        const { id, gutHealthId, ...restStool } = s;
                        await prisma.stoolEntry.create({ data: { ...restStool, gutHealthId: newG.id } });
                    }
                }
            }
        }

        console.log("✅ SYNC COMPLETE AND SUCCESSFUL!");

    } catch (e) {
        console.error("❌ ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

sync();
