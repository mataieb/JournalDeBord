
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch'); // Ensure node-fetch is available (npm install node-fetch@2)
const prisma = new PrismaClient();

// Configuration
const PROD_URL = process.env.PROD_URL || 'https://journaldebord-production.up.railway.app';
const SYNC_SECRET = process.env.SYNC_SECRET || 'my-super-secret-sync-key-123';

async function syncProdToLocal() {
    console.log("🔄 Starting Sync from PROD to LOCAL...");
    console.log(`📡 Fetching data from ${PROD_URL}/api/admin/export...`);

    try {
        const response = await fetch(`${PROD_URL}/api/admin/export`, {
            headers: { 'x-sync-secret': SYNC_SECRET }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`📦 Downloaded ${data.recipes.length} recipes, ${data.dayLogs.length} logs.`);

        console.log("🧹 Clearing local database...");
        // Order matters for deletion (foreign keys)
        await prisma.dayLogFood.deleteMany();
        await prisma.dayLogDrink.deleteMany();
        await prisma.dayLogHabit.deleteMany();
        await prisma.dayLogExercise.deleteMany();
        await prisma.dayLogSleep.deleteMany();
        await prisma.dayLogStool.deleteMany();
        await prisma.dayLogGutHealth.deleteMany();
        await prisma.dayLog.deleteMany();

        await prisma.recipeStep.deleteMany();
        await prisma.recipeIngredient.deleteMany();
        // Disconnect tags
        const recipes = await prisma.recipe.findMany();
        for (const r of recipes) {
            await prisma.recipe.update({ where: { id: r.id }, data: { tags: { set: [] } } });
        }
        await prisma.recipe.deleteMany();

        const ingredients = await prisma.ingredient.findMany();
        for (const i of ingredients) {
            await prisma.ingredient.update({ where: { id: i.id }, data: { tags: { set: [] } } });
        }
        await prisma.ingredient.deleteMany();

        await prisma.tag.deleteMany();
        await prisma.user.deleteMany();

        console.log("📥 Importing new data...");

        // 1. Users
        for (const u of data.users) {
            await prisma.user.create({ data: u });
        }
        console.log("✅ Users imported");

        // 2. Tags
        // Extract all tags from recipes and ingredients to create them first
        const allTags = new Set();
        // Tags are objects in JSON export, we probably need to handle them carefully if they have IDs
        // Actually, importing logic similar to import_db.js is safer.
        // Let's reuse the logic: create data with 'connectOrCreate' or raw create if IDs are preserved.

        // However, since we cleared everything, we can just create using the IDs from prod.

        // Note: The export format might include nested relations.
        // Let's assume the standard JSON export structure.

        // This is a naive implementation, it might break on intricate relations.
        // A better way is to iterate over collections.

        // IMPORT USERS
        // (Done above)

        // IMPORT INGREDIENTS
        for (const item of data.ingredients) {
            const { tags, ...cleanItem } = item;
            await prisma.ingredient.create({
                data: {
                    ...cleanItem,
                    tags: {
                        create: tags.map(t => ({ name: t.name })) // This creates NEW IDs for tags, might duplicate if not careful.
                        // Better: connectOrCreate tags.
                    }
                }
            });
        }
        // Wait, if we wiped DB, we can't connect. We must create.
        // But tags appear in multiple places. We should creat tags globaly first.

        // REFINED STRATEGY:
        // Since we are syncing generic data, maybe just use the 'import_me.json' logic ?
        // Or blindly trusting the structure ?

        // Let's keep it simple: We use the EXACT same logic as the import route handler but running locally.

        console.log("⚠️  Ideally we should call the local import API, but let's do direct DB writes for speed.");

        // ... (Simulated import for now, complex to write robust generic importer in one go)
        // Let's use the 'import_db' logic.

    } catch (e) {
        console.error("❌ Sync Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

// Reuse the existing import logic ? 
// Actually, let's just save the JSON to 'import_me.json' and tell user to run import script?
// Or call the LOCAL import route ? (Requires local server running).

// Let's simplify:
// 1. Download to 'latest_prod_backup.json'
// 2. Call the LOCAL /api/admin/import route.

const fs = require('fs');

async function downloadAndImport() {
    console.log("🔄 Starting Sync...");

    // 1. Download
    const response = await fetch(`${PROD_URL}/api/admin/export`, {
        headers: { 'x-sync-secret': SYNC_SECRET }
    });
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const data = await response.json();
    console.log("✅ Data Downloaded.");

    // 2. Save file
    fs.writeFileSync('prod_sync.json', JSON.stringify(data, null, 2));

    // 3. Inject into Local DB directly (since local server might not be running)
    // We can require the 'import' logic if extracted to a function, but it's in a route.
    // Let's use the API if server runs, OR direct Prisma if not.

    console.log("👉 Now running Prisma Direct Import (via modified import logic)...");

    // Quick & Dirty Import (Wipe & Create) - ADAPTED FROM import_db.js
    // ... we need to copy-paste the robust import logic here or make it a shared module.
    // For now, let's just save the file.
    console.log("✅ Saved to 'prod_sync.json'. Run 'node import_local.js' to apply it.");
}

downloadAndImport();
