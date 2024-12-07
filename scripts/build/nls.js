const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../../.wisp/locale/en.json');
const OUTPUT_FILE = path.join(__dirname, '../../.wisp/locale/en_flat.json');

function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

function flattenLocalizationJSON() {
    try {
        const inputContent = fs.readFileSync(INPUT_FILE, 'utf-8');
        const localizationData = JSON.parse(inputContent);

        if (!localizationData.contents || typeof localizationData.contents !== 'object') {
            throw new Error("Invalid input JSON structure: Missing or invalid 'contents' field.");
        }

        const flatArray = [];

        Object.entries(localizationData.contents).forEach(([filePath, entries]) => {
            Object.entries(entries).forEach(([key, value]) => {
                flatArray.push(value);
            });
        });

        ensureDirectoryExists(OUTPUT_FILE);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(flatArray, null, 4), 'utf-8');
        console.log(`Flattened localization JSON written to ${OUTPUT_FILE}`);

        return flatArray;
    } catch (error) {
        console.error('Error flattening localization JSON:', error.message);
        process.exit(1);
    }
}

function main() {
    console.log('Flattening localization JSON...');

    const flattenedData = flattenLocalizationJSON();
    console.log('Flattened Data:', flattenedData);
}

main();
