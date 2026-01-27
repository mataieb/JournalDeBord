const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sqlFiles = [
    'C:/Dev Env/Booky/Booky/src/main/resources/db/migration/repeatable/R__import_epices_herbs_data.sql',
    'C:/Dev Env/Booky/Booky/src/main/resources/db/migration/repeatable/R__import_fish_seafood_data.sql',
    'C:/Dev Env/Booky/Booky/src/main/resources/db/migration/repeatable/R__import_fruits_data.sql',
    'C:/Dev Env/Booky/Booky/src/main/resources/db/migration/repeatable/R__import_meats_data.sql',
    'C:/Dev Env/Booky/Booky/src/main/resources/db/migration/repeatable/R__import_pantry_data.sql',
    'C:/Dev Env/Booky/Booky/src/main/resources/db/migration/repeatable/R__insert_vegetables_data.sql'
];

const jsonIngredientsFile = 'C:/Dev Env/Booky/Booky/src/main/resources/ingredients.json';

async function main() {
    console.log('Starting ingredient import...');

    for (const filePath of sqlFiles) {
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            continue;
        }

        console.log(`Processing ${path.basename(filePath)}...`);
        const content = fs.readFileSync(filePath, 'utf8');

        // Match the entire VALUES block between VALUES and the final semicolon
        const valuesMatch = content.match(/INSERT INTO ingredient [^)]*\) VALUES\s*([\s\S]+?);/i);

        if (valuesMatch) {
            const valuesStr = valuesMatch[1].trim();

            // Regex to split rows, handling potential commas inside strings
            // This is a more robust way than splitting by "), ("
            const rows = [];
            let currentRow = "";
            let inString = false;
            let parenDepth = 0;

            for (let i = 0; i < valuesStr.length; i++) {
                const char = valuesStr[i];
                if (char === "'" && valuesStr[i - 1] !== "\\") {
                    inString = !inString;
                }

                if (!inString) {
                    if (char === "(") parenDepth++;
                    if (char === ")") parenDepth--;
                }

                currentRow += char;

                if (!inString && parenDepth === 0 && char === ",") {
                    rows.push(currentRow.trim().replace(/,$/, '').trim());
                    currentRow = "";
                }
            }
            if (currentRow.trim()) {
                rows.push(currentRow.trim());
            }

            console.log(`Found ${rows.length} rows in ${path.basename(filePath)}`);

            for (let row of rows) {
                row = row.trim();
                if (!row.startsWith('(')) continue;

                const contentStr = row.slice(1, -1);
                // Split by comma, but not inside quotes
                const parts = contentStr.match(/'(?:[^']|'')*'|[^,]+/g).map(p => p.trim());

                if (parts.length >= 4) {
                    const name = parts[0].replace(/^'|'$/g, '').replace(/''/g, "'");
                    const description = parts[1].replace(/^'|'$/g, '').replace(/''/g, "'");
                    const type = parseInt(parts[2]);
                    const unit = parts[3].replace(/^'|'$/g, '');
                    const calories = parts[4] ? parseInt(parts[4]) : 0;
                    const saison = parts[5] ? parseInt(parts[5]) : null;

                    try {
                        await prisma.ingredient.upsert({
                            where: { name },
                            update: {
                                description,
                                type,
                                uniteMesure: unit,
                                calories: isNaN(calories) ? 0 : calories,
                                saison: isNaN(saison) ? null : (isNaN(parseInt(saison)) ? null : parseInt(saison))
                            },
                            create: {
                                name,
                                description,
                                type,
                                uniteMesure: unit,
                                calories: isNaN(calories) ? 0 : calories,
                                saison: isNaN(saison) ? null : (isNaN(parseInt(saison)) ? null : parseInt(saison))
                            }
                        });
                    } catch (e) {
                        // Suppress unique constraint errors silently
                    }
                }
            }
        }
    }

    if (fs.existsSync(jsonIngredientsFile)) {
        console.log(`Processing ${path.basename(jsonIngredientsFile)}...`);
        const jsonContent = JSON.parse(fs.readFileSync(jsonIngredientsFile, 'utf8'));
        console.log(`Found ${jsonContent.length} items in JSON`);
        for (const item of jsonContent) {
            try {
                await prisma.ingredient.upsert({
                    where: { name: item.name },
                    update: {
                        description: item.description,
                        type: item.typeIngredient?.id,
                        uniteMesure: item.uniteMesure,
                        calories: item.calories || 0,
                    },
                    create: {
                        name: item.name,
                        description: item.description,
                        type: item.typeIngredient?.id,
                        uniteMesure: item.uniteMesure,
                        calories: item.calories || 0,
                    }
                });
            } catch (e) { }
        }
    }

    console.log('Import finished.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
