const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetSequences() {
    console.log("🔄 Resetting Sequences (Simple Mode)...");

    const tables = ['Recipe', 'Ingredient', 'DayLog', 'User', 'Step', 'RecipeIngredient', 'Tag', 'FoodItem', 'DrinkItem', 'Exercise', 'HabitItem', 'Sleep', 'GutHealth', 'StoolEntry'];

    for (const table of tables) {
        try {
            // 1. Get Max ID
            // Note: On utilise queryRawUnsafe pour pouvoir injecter le nom de la table
            // ATTENTION: C'est safe ici car 'table' vient de notre liste codée en dur ci-dessus.
            const result = await prisma.$queryRawUnsafe(`SELECT MAX(id) as max_id FROM "${table}"`);
            const maxId = result[0].max_id || 0;
            const nextId = Number(maxId) + 1;

            // 2. Set Sequence
            // Le nom de séquence par défaut Prisma/Postgres est "Table_id_seq"
            // Il faut gérer les guillemets pour la casse
            const seqName = `${table}_id_seq`;

            await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${seqName}" RESTART WITH ${nextId}`);
            console.log(`✅ ${table}: Resetted to ${nextId}`);

        } catch (e) {
            console.warn(`⚠️  Could not reset ${table} (maybe no ID or different seq name): ${e.message.split('\n')[0]}`);
        }
    }
    console.log("🏁 Done.");
    await prisma.$disconnect();
}

resetSequences();
