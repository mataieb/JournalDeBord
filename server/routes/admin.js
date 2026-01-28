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
                                    // Since our export was shallow on some levels, let's rely on name matching if possible, 
                                    // or ingredientId mapping from the just-imported ingredients.
                                    // Simpler approach: Assume export data structure from export_db.js

                                    // Wait, the export_db.js does not include 'ingredient' object inside RecipeIngredient, only ingredientId.
                                    // We need to look it up in data.ingredients list.
                                    const ingName = data.ingredients.find(i => i.id === ri.ingredientId)?.name;

                                    if (!ingName) return null; // Skip broken links

                                    return {
                                        quantity: ri.quantity,
                                        unit: ri.unit,
                                        ingredient: { connect: { name: ingName } }
                                    };
                                }).filter(x => x !== null) || []
                            }
                        }
                    });
                    stats.recipesConfigured++;
                }
            }
        }

        res.json({ message: "Import successful", stats });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
