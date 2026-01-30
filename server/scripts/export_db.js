const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Script to export entire DB to JSON
const exportData = async () => {
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

        const outFile = path.join(__dirname, 'db_export.json');
        fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
        console.log(`Exported data to ${outFile}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
};

exportData();
