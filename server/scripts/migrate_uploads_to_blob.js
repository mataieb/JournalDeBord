// One-off migration: re-uploads existing recipe photos to Vercel Blob and
// rewrites Recipe.urlPhoto to point at the new Blob URL.
//
// Run this AFTER the Neon database has real data (post sync-prod) and BEFORE
// shutting down the old Railway deployment (it needs to still serve the old
// /uploads/* files so we can fetch and re-upload them).
//
// Required env vars: DATABASE_URL (Neon), BLOB_READ_WRITE_TOKEN

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { put } = require('@vercel/blob');

const prisma = new PrismaClient();

const OLD_PROD_URL = process.env.OLD_PROD_URL || 'https://journaldebord-production.up.railway.app';

async function migrate() {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('Missing BLOB_READ_WRITE_TOKEN env var. Get it from Vercel dashboard > Storage > Blob.');
        process.exit(1);
    }

    const recipes = await prisma.recipe.findMany({
        where: { urlPhoto: { not: null } }
    });

    console.log(`Found ${recipes.length} recipes with a photo.`);

    let migrated = 0;
    let skipped = 0;

    for (const recipe of recipes) {
        const oldUrl = recipe.urlPhoto;

        if (!oldUrl || oldUrl.includes('.public.blob.vercel-storage.com')) {
            skipped++;
            continue; // already migrated or empty
        }

        // Support both absolute old-prod URLs and relative "/uploads/xxx" paths
        const fetchUrl = oldUrl.startsWith('http') ? oldUrl : `${OLD_PROD_URL}${oldUrl}`;

        try {
            const response = await fetch(fetchUrl);
            if (!response.ok) {
                console.warn(`  [skip] ${recipe.name}: fetch failed (${response.status}) for ${fetchUrl}`);
                skipped++;
                continue;
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const filename = `uploads/${Date.now()}-${Math.round(Math.random() * 1e9)}`;

            const blob = await put(filename, buffer, { access: 'public', contentType });

            await prisma.recipe.update({
                where: { id: recipe.id },
                data: { urlPhoto: blob.url }
            });

            console.log(`  [ok] ${recipe.name}: ${fetchUrl} -> ${blob.url}`);
            migrated++;
        } catch (e) {
            console.warn(`  [error] ${recipe.name}: ${e.message}`);
            skipped++;
        }
    }

    console.log(`\nDone. Migrated: ${migrated}, skipped: ${skipped}.`);
    await prisma.$disconnect();
}

migrate();
