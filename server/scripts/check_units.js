const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ingredients = await prisma.ingredient.findMany({
        select: {
            name: true,
            uniteMesure: true
        }
    });

    const groups = {};

    ingredients.forEach(i => {
        const u = i.uniteMesure || 'NULL';
        if (!groups[u]) {
            groups[u] = [];
        }
        groups[u].push(i.name);
    });

    console.log('--- DISTRIBUTION DES UNITÉS ---');
    for (const [unit, names] of Object.entries(groups)) {
        console.log(`\nUnité: "${unit}" (${names.length} ingrédients)`);
        console.log(`Exemples: ${names.slice(0, 5).join(', ')}...`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
