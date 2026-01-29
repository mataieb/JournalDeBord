const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ADMIN: Get full DB export
router.get('/export', async (req, res) => {
    try {
        const data = {
            users: await prisma.user.findMany(),
            recipes: await prisma.recipe.findMany({ include: { steps: true, ingredients: true, tags: true } }),
            ingredients: await prisma.ingredient.findMany({ include: { tags: true } }),
            dayLogs: await prisma.dayLog.findMany({
                include: {
                    foods: true,
                    drinks: true,
                    habits: true,
                    exercises: true,
                    sleep: true,
                    gutHealth: { include: { stools: true } }
                }
            })
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=db_backup.json');
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ADMIN: Import full DB (This is destructive/additive)
router.post('/import', async (req, res) => {
    const data = req.body;
    if (!data || !data.recipes) return res.status(400).json({ message: "Invalid data" });

    try {
        let stats = { recipesConfigured: 0, ingredientsConfigured: 0 };

        // 1. Ingredients
        if (data.ingredients) {
            for (const i of data.ingredients) {
                await prisma.ingredient.upsert({
                    where: { name: i.name },
                    update: {},
                    create: {
                        name: i.name,
                        uniteMesure: i.uniteMesure,
                        type: i.type,
                        description: i.description,
                        calories: i.calories,
                        tags: {
                            connectOrCreate: i.tags?.map(t => ({ where: { name: t.name }, create: { name: t.name } })) || []
                        }
                    }
                });
                stats.ingredientsConfigured++;
            }
        }

        // 2. Recipes
        if (data.recipes) {
            for (const r of data.recipes) {
                const existing = await prisma.recipe.findFirst({ where: { name: r.name } });
                if (!existing) {
                    await prisma.recipe.create({
                        data: {
                            name: r.name,
                            description: r.description,
                            urlPhoto: r.urlPhoto,
                            servings: r.servings,
                            prepTime: r.prepTime,
                            cookTime: r.cookTime,
                            complexity: r.complexity,
                            isDraft: !!r.isDraft,
                            type: r.type || "RECIPE",
                            steps: {
                                create: r.steps?.map(s => ({ order: s.order, description: s.description })) || []
                            },
                            tags: {
                                connectOrCreate: r.tags?.map(t => ({ where: { name: t.name }, create: { name: t.name } })) || []
                            },
                            ingredients: {
                                create: r.ingredients?.map(ri => {
                                    // Try to find the ingredient name from the ID in the backup
                                    // Or assume the backup 'ri' has the ingredient name populated if it was a deep fetch. 
                                    // The export_db script does include: ingredients: await prisma.recipe.findMany({ include: { ingredients: true } }) 
                                    // BUT ingredients on RecipeIngredient is a relation. The simple JSON export might just have ingredientId.
                                    // We'll try to find by ID in our list of ingredients imported in Step 1

                                    // Actually, export_db.js does: recipes: await prisma.recipe.findMany({ include: { ..., ingredients: true } })
                                    // Prisms includes relations objects if requested. The export_db script did NOT include 'ingredient' relations inside 'ingredients'.
                                    // It only did: ingredients: await prisma.ingredient.findMany(...) separately.
                                    // So 'ri' in 'r.ingredients' ONLY has 'ingredientId'.
                                    // We need to look up the Name of that ingredient ID from the backup data.ingredients list.

                                    const ingDef = data.ingredients.find(i => i.id === ri.ingredientId);
                                    if (!ingDef) return null; // Skip if source ingredient missing

                                    return {
                                        quantity: ri.quantity,
                                        unit: ri.unit,
                                        ingredient: { connect: { name: ingDef.name } }
                                    };
                                }).filter(x => x !== null) || []
                            }
                        }
                    });
                    stats.recipesConfigured++;
                }
            }
        }

        // 3. Import Day Logs (Journal)
        // Pre-fetch all recipes to build a map. Needed because 'name' is not unique in prisma schema for 'connect'.
        // We will map BackupID -> Name -> NewID
        const allRecipes = await prisma.recipe.findMany({ select: { id: true, name: true } });
        const recipeNameMap = new Map();
        allRecipes.forEach(r => recipeNameMap.set(r.name, r.id));

        // 3. Import Day Logs (Journal)
        if (data.dayLogs) {
            // We need a user to attach logs to. For now, take the first one or create default
            let user = await prisma.user.findFirst();
            if (!user && data.users && data.users.length > 0) {
                user = await prisma.user.create({ data: { email: data.users[0].email, name: data.users[0].name || 'User' } });
            }

            if (user) {
                for (const log of data.dayLogs) {
                    // Create or update log for that date
                    const dateStr = new Date(log.date).toISOString(); // Ensure format

                    const existingLog = await prisma.dayLog.findFirst({
                        where: { userId: user.id, date: dateStr }
                    });

                    // If log exists, we might want to skip or merge. Let's skip to be safe against dups
                    if (existingLog) continue;

                    await prisma.dayLog.create({
                        data: {
                            date: dateStr,
                            userId: user.id,
                            foods: {
                                create: log.foods?.map(f => {
                                    let recipeConnect = undefined;
                                    if (f.recipeId) {
                                        // Try to find the recipe in backup to get its name
                                        const rDef = data.recipes?.find(r => r.id === f.recipeId);
                                        if (rDef) {
                                            // Find the NEW id based on name
                                            const newId = recipeNameMap.get(rDef.name);
                                            if (newId) {
                                                recipeConnect = { connect: { id: newId } };
                                            }
                                        }
                                    }
                                    return {
                                        name: f.name,
                                        category: f.category,
                                        calories: f.calories,
                                        recipe: recipeConnect
                                    };
                                })
                            },
                            drinks: {
                                create: log.drinks?.map(d => ({ name: d.name, type: d.type, period: d.period }))
                            },
                            habits: {
                                create: log.habits?.map(h => ({ name: h.name, category: h.category }))
                            },
                            exercises: {
                                create: log.exercises?.map(e => ({ name: e.name, type: e.type, durationMin: e.durationMin }))
                            },
                            sleep: log.sleep ? {
                                create: {
                                    bedtime: log.sleep.bedtime,
                                    waketime: log.sleep.waketime,
                                    durationMin: log.sleep.durationMin,
                                    score: log.sleep.score,
                                    quality: log.sleep.quality
                                }
                            } : undefined,
                            gutHealth: log.gutHealth ? {
                                create: {
                                    dailyScore: log.gutHealth.dailyScore,
                                    symptoms: log.gutHealth.symptoms,
                                    stools: {
                                        create: log.gutHealth.stools?.map(s => ({
                                            time: s.time,
                                            bristolType: s.bristolType,
                                            notes: s.notes
                                        }))
                                    }
                                }
                            } : undefined
                        }
                    });
                }
            }
        }


        res.json({ message: "Import successful", stats });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// DEBUG: List files to find lost database
router.get('/debug-files', (req, res) => {
    const fs = require('fs');
    const path = require('path');

    let output = "=== DEBUG FILE LISTING ===\n\n";

    const listDir = (dir) => {
        try {
            output += `\n--- Directory: ${dir} ---\n`;
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const fullPath = path.join(dir, file);
                    try {
                        const stats = fs.statSync(fullPath);
                        output += `${file.padEnd(30)} | Size: ${(stats.size / 1024).toFixed(2)} KB | Date: ${stats.mtime.toISOString()}\n`;
                    } catch (e) { output += `${file} (Error reading stats)\n`; }
                });
            } else {
                output += "(Directory does not exist)\n";
            }
        } catch (err) {
            output += `Error listing dir: ${err.message}\n`;
        }
    };

    listDir('./prisma');
    listDir('.');
    listDir('/data');
    listDir('/data/uploads'); // Check inside uploads
    listDir('/app/data'); // Sometimes mounted here

    output += `\n\nENV DATABASE_URL: ${process.env.DATABASE_URL}`;
    output += `\nENV STORAGE_ROOT: ${process.env.STORAGE_ROOT}`;

    res.set('Content-Type', 'text/plain');
    res.send(output);
});

// DEBUG: Download the suspicious backup file
router.get('/download-backup', (req, res) => {
    const file = path.join(__dirname, '../prisma/dev.db.pre_nested_backup');
    if (fs.existsSync(file)) {
        res.download(file, 'restored_backup.db');
    } else {
        res.status(404).send('Backup file not found');
    }
});

module.exports = router;
