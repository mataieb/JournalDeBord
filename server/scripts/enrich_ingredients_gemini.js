require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function getEnrichedData(ingredientsList) {
    const prompt = `
    Je vais te donner une liste d'ingrédients culinaires. Pour chaque ingrédient, j'ai besoin que tu me fournisses :
    1. Une catégorie (choisir parmi : "Légume", "Fruit", "Viande", "Poisson", "Féculent", "Produit Laitier", "Épice/Herbe", "Matière Grasse", "Autre").
    2. Les valeurs nutritionnelles pour 100g : proteines (g), glucides (g), lipides (g), calories (kcal).
    3. La meilleure saison (un chiffre de 1 à 12 représentant le mois, ou null si toute l'année).

    Voici la liste :
    ${JSON.stringify(ingredientsList)}

    Réponds UNIQUEMENT avec un tableau JSON valide respectant cette structure, sans texte avant ni après, pas de markdown :
    [
        {
            "name": "Nom de l'ingrédient tel que fourni",
            "category": "Categorie",
            "protein": 0.0,
            "carbs": 0.0,
            "fat": 0.0,
            "calories": 0,
            "saison": 1
        }
    ]
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // Parsing the response safely
        const jsonText = data.candidates[0].content.parts[0].text;
        return JSON.parse(jsonText);

    } catch (e) {
        console.error("❌ Erreur Appel Gemini:", e.message);
        return null;
    }
}

async function main() {
    console.log("🚀 Démarrage de l'enrichissement via Gemini...");

    // 1. Récupérer les ingrédients à traiter (ceux qui n'ont pas de catégorie ou protéines = 0)
    const ingredients = await prisma.ingredient.findMany({
        where: {
            OR: [
                { category: null },
                { category: "" },
                { protein: 0 } // On assume que si 0, c'est pas encore rempli (ou c'est de l'eau/sucre, tant pis on recheck)
            ]
        }
    });

    console.log(`📋 ${ingredients.length} ingrédients trouvés à enrichir.`);

    // 2. Traiter par lots de 20
    const BATCH_SIZE = 20;

    for (let i = 0; i < ingredients.length; i += BATCH_SIZE) {
        const batch = ingredients.slice(i, i + BATCH_SIZE);
        const batchNames = batch.map(ing => ing.name);

        console.log(`\n🤖 Traitement du lot ${i / BATCH_SIZE + 1} (${batchNames.length} items)...`);

        const enrichedData = await getEnrichedData(batchNames);

        if (enrichedData) {
            for (const item of enrichedData) {
                // Trouver l'ID correspondant
                const original = batch.find(b => b.name === item.name);
                if (original) {
                    await prisma.ingredient.update({
                        where: { id: original.id },
                        data: {
                            category: item.category,
                            protein: item.protein,
                            carbs: item.carbs,
                            fat: item.fat,
                            calories: item.calories,
                            saison: item.saison
                        }
                    });
                    process.stdout.write("."); // Feedback visuel
                }
            }
            console.log(" ✅");
        } else {
            console.log("⚠️ Lot ignoré suite erreur API.");
        }

        // Petite pause pour éviter le rate limit
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("\n🎉 Enrichissement terminé !");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
