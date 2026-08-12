const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const prisma = new PrismaClient();

router.use(requireAuth);

// GET all recipes
// GET all recipes
router.get('/', async (req, res, next) => {
    try {
        const recipes = await prisma.recipe.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                urlPhoto: true,
                complexity: true,
                prepTime: true,
                cookTime: true,
                servings: true,
                isDraft: true,
                type: true,
                tags: true
            },
            orderBy: { name: 'asc' }
        });
        res.json(recipes);
    } catch (error) {
        next(error);
    }
});

// GET recipe by ID
router.get('/:id', async (req, res, next) => {
    try {
        const recipe = await prisma.recipe.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                steps: { orderBy: { order: 'asc' } },
                ingredients: {
                    include: {
                        ingredient: true,
                        subRecipe: true
                    }
                },
                tags: true
            }
        });
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
        res.json(recipe);
    } catch (error) {
        next(error);
    }
});

// GET all ingredients
router.get('/ingredients/list', async (req, res, next) => {
    try {
        const ingredients = await prisma.ingredient.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { recipeIngredients: true }
                }
            }
        });
        res.json(ingredients);
    } catch (error) {
        next(error);
    }
});

// POST new recipe
router.post('/', async (req, res, next) => {
    const { name, description, urlPhoto, servings, prepTime, cookTime, complexity, steps, ingredients, tags, isDraft, type } = req.body;
    try {
        const newRecipe = await prisma.$transaction(async (tx) => {
            return await tx.recipe.create({
                data: {
                    name,
                    description,
                    urlPhoto,
                    servings: parseInt(servings) || 1,
                    prepTime: parseInt(prepTime) || null,
                    cookTime: parseInt(cookTime) || null,
                    complexity: parseInt(complexity) || null,
                    isDraft: !!isDraft,
                    type: type || "RECIPE",
                    steps: {
                        create: steps?.map((s, index) => ({
                            order: index + 1,
                            description: s.description
                        })) || []
                    },
                    tags: {
                        connectOrCreate: tags?.map(t => ({
                            where: { name: t.name },
                            create: { name: t.name }
                        })) || []
                    },
                    ingredients: {
                        create: ingredients?.map(i => {
                            const ingData = {
                                quantity: parseFloat(i.quantity) || 0,
                                unit: i.unit
                            };
                            if (i.subRecipeId) {
                                ingData.subRecipe = { connect: { id: parseInt(i.subRecipeId) } };
                            } else {
                                ingData.ingredient = {
                                    connectOrCreate: {
                                        where: { name: i.name },
                                        create: {
                                            name: i.name,
                                            uniteMesure: i.unit,
                                            type: i.type,
                                            description: i.description,
                                            calories: parseInt(i.calories) || 0
                                        }
                                    }
                                };
                            }
                            return ingData;
                        }) || []
                    }
                },
                include: {
                    steps: true,
                    ingredients: { include: { ingredient: true, subRecipe: true } },
                    tags: true
                }
            });
        });
        res.status(201).json(newRecipe);
    } catch (error) {
        next(error);
    }
});

// PUT update recipe
router.put('/:id', async (req, res, next) => {
    const { id } = req.params;
    const { name, description, urlPhoto, servings, prepTime, cookTime, complexity, steps, ingredients, tags, isDraft, type } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Delete existing relations
            await tx.step.deleteMany({ where: { recipeId: parseInt(id) } });
            await tx.recipeIngredient.deleteMany({ where: { recipeId: parseInt(id) } });

            // Update the recipe and create new relations
            return await tx.recipe.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                    description,
                    urlPhoto,
                    servings: parseInt(servings) || 1,
                    prepTime: parseInt(prepTime) || null,
                    cookTime: parseInt(cookTime) || null,
                    complexity: parseInt(complexity) || null,
                    isDraft: !!isDraft,
                    type: type || "RECIPE",
                    steps: {
                        create: steps?.map((s, index) => ({
                            order: index + 1,
                            description: s.description
                        })) || []
                    },
                    ingredients: {
                        create: ingredients?.map(i => {
                            const ingData = {
                                quantity: parseFloat(i.quantity) || 0,
                                unit: i.unit
                            };
                            if (i.subRecipeId) {
                                ingData.subRecipe = { connect: { id: parseInt(i.subRecipeId) } };
                            } else {
                                ingData.ingredient = {
                                    connectOrCreate: {
                                        where: { name: i.name },
                                        create: { name: i.name, uniteMesure: i.unit }
                                    }
                                };
                            }
                            return ingData;
                        }) || []
                    },
                    tags: {
                        set: [],
                        connectOrCreate: tags?.map(t => ({
                            where: { name: t.name },
                            create: { name: t.name }
                        })) || []
                    }
                }
            });
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// DELETE recipe
router.delete('/:id', async (req, res, next) => {
    try {
        await prisma.recipe.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// PUT update ingredient
router.put('/ingredients/:id', async (req, res, next) => {
    const { id } = req.params;
    const { name, uniteMesure, calories, description } = req.body;

    try {
        const result = await prisma.ingredient.update({
            where: { id: parseInt(id) },
            data: {
                name,
                uniteMesure,
                calories: parseInt(calories) || 0,
                description
            }
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// DELETE ingredient
router.delete('/ingredients/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);

        // Optionnel : vérifier si utilisé avant (ou laisser le catch gérer)
        // On tente la suppression directe
        await prisma.ingredient.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        // P2003 est l'erreur Prisma pour contrainte de clé étrangère
        if (error.code === 'P2003') {
            return res.status(400).json({
                message: "Impossible de supprimer cet ingrédient car il est utilisé dans une ou plusieurs recettes."
            });
        }
        next(error);
    }
});

// POST merge ingredients
router.post('/ingredients/merge', async (req, res, next) => {
    const { sourceId, targetId } = req.body;

    if (!sourceId || !targetId || sourceId === targetId) {
        return res.status(400).json({ message: 'Invalid source or target ID' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Move all RecipeIngredients from source to target
            await tx.recipeIngredient.updateMany({
                where: { ingredientId: parseInt(sourceId) },
                data: { ingredientId: parseInt(targetId) }
            });

            // 2. Delete the source ingredient
            await tx.ingredient.delete({
                where: { id: parseInt(sourceId) }
            });

            return { success: true };
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// POST Assemble items from Log
router.post('/assemble', async (req, res, next) => {
    const { name, foodItemIds, date } = req.body;

    if (!foodItemIds || foodItemIds.length === 0 || !name) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch original items to get data
            const items = await tx.foodItem.findMany({
                where: { id: { in: foodItemIds } }
            });

            if (items.length === 0) throw new Error("No items found");

            // 2. Create the Assembly Recipe
            const recipe = await tx.recipe.create({
                data: {
                    name: name,
                    type: "ASSEMBLY",
                    isDraft: false, // Ready to use
                    servings: 1,
                    ingredients: {
                        create: items.map(item => ({
                            ingredient: {
                                connectOrCreate: {
                                    where: { name: item.name },
                                    create: { name: item.name, uniteMesure: 'portion' }
                                }
                            },
                            quantity: 1, // Defaulting complexity here, ideally we parse quantity string but let's keep it simple K.I.S.S
                            unit: 'portion'
                        }))
                    }
                }
            });

            // 3. Delete old log items
            await tx.foodItem.deleteMany({
                where: { id: { in: foodItemIds } }
            });

            // 4. Create new single log item pointing to the assembly
            // We need a DayLog ID. We can take it from one of the items or query it.
            // Items must belong to a dayLog.
            const dayLogId = items[0].dayLogId;

            const newLogItem = await tx.foodItem.create({
                data: {
                    name: recipe.name,
                    category: 'dej', // Default or derived?
                    dayLogId: dayLogId,
                    recipeId: recipe.id
                }
            });

            return { recipe, newLogItem };
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
