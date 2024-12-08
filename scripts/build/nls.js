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

function removeComments(content) {
    // 移除多行注释 /* ... */ 和单行注释 //
    return content
        .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
        .replace(/\/\/.*$/gm, ''); // 移除单行注释
}

function flattenLocalizationKeys() {
    try {
        const inputContent = fs.readFileSync(INPUT_FILE, 'utf-8');
        const cleanedContent = removeComments(inputContent); // 清理注释
        const localizationData = JSON.parse(cleanedContent);

        if (!localizationData.contents || typeof localizationData.contents !== 'object') {
            throw new Error("Invalid input JSON structure: Missing or invalid 'contents' field.");
        }

        // 提取所有 keys
        const flatKeys = [];

        Object.entries(localizationData.contents).forEach(([filePath, entries]) => {
            Object.keys(entries).forEach(key => {
                flatKeys.push(key);
            });
        });

        ensureDirectoryExists(OUTPUT_FILE);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(flatKeys, null, 4), 'utf-8');
        console.log(`Flattened localization keys written to ${OUTPUT_FILE}`);

        return flatKeys;
    } catch (error) {
        console.error('Error flattening localization JSON:', error.message);
        process.exit(1);
    }
}

function main() {
    console.log('Flattening localization JSON keys...');

    const flattenedKeys = flattenLocalizationKeys();
    console.log('Flattened Keys:', flattenedKeys);
}

main();
