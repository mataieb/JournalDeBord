const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Script to import DB from JSON
const importData = async () => {
    try {
        const inFile = path.join(__dirname, 'db_export.json');
        if (!fs.existsSync(inFile)) {
            console.error("No export file found!");
            return;
        }
        const data = JSON.parse(fs.readFileSync(inFile, 'utf-8'));

        console.log("Importing Users...");
        for (const u of data.users) {
            await prisma.user.upsert({
                where: { email: u.email },
                update: {},
                create: { ...u, id: undefined, createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt) }
            });
        }

        console.log("Importing Ingredients...");
        for (const i of data.ingredients) {
            await prisma.ingredient.upsert({
                where: { name: i.name },
                update: {},
                create: {
                    ...i,
                    id: undefined,
                    createdAt: new Date(i.createdAt),
                    updatedAt: new Date(i.updatedAt),
                    tags: {
                        connectOrCreate: i.tags.map(t => ({ where: { name: t.name }, create: { name: t.name } }))
                    },
                    recipeIngredients: undefined // Don't try to create relations here
                }
            });
        }

        console.log("Importing Recipes...");
        for (const r of data.recipes) {
            // We need to handle relations carefully. Simplest is create if not exists
            const existing = await prisma.recipe.findFirst({ where: { name: r.name } });
            if (!existing) {
                await prisma.recipe.create({
                    data: {
                        ...r,
                        id: undefined,
                        createdAt: new Date(r.createdAt),
                        updatedAt: new Date(r.updatedAt),
                        steps: {
                            create: r.steps.map(s => ({ ...s, id: undefined, recipeId: undefined }))
                        },
                        tags: {
                            connectOrCreate: r.tags.map(t => ({ where: { name: t.name }, create: { name: t.name } }))
                        },
                        ingredients: {
                            create: r.ingredients.map(ri => ({
                                quantity: ri.quantity,
                                unit: ri.unit,
                                ingredient: ri.ingredientId ? { connect: { name: data.ingredients.find(i => i.id === ri.ingredientId)?.name } } : undefined
                                // Note: Subrecipes are complex to import in specific order, skipping for simplicity in this rescue script
                            }))
                        },
                        type: r.type || "RECIPE",
                        isDraft: r.isDraft || false
                    }
                });
            }
        }

        // Importing Logs is tricky due to relations. 
        // For now, let's just confirm recipes and ingredients are there.
        console.log("Recipes and Ingredients imported.");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
};

importData();
