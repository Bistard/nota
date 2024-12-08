const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../../.wisp/locale/en.json');
const OUTPUT_FILE = path.join(__dirname, '../../.wisp/locale/en_flat.json');
const DIRECTORY_PATH = path.join(__dirname, '../../src');
const PACKAGE_JSON_PATH = path.join(__dirname, '../../package.json');

class KeyToIndexTransformPlugin {
    constructor(localeFilePath) {
        this.localeFilePath = localeFilePath;
        this.keyMap = {};
        this.loadKeyMap();
    }

    loadKeyMap() {
        console.log(`[KeyToIndexTransformPlugin] Loading locale file from: ${this.localeFilePath}`);

        if (fs.existsSync(this.localeFilePath)) {
            try {
                const rawData = fs.readFileSync(this.localeFilePath, 'utf-8');
                const jsonData = JSON.parse(rawData);

                if (Array.isArray(jsonData)) {
                    jsonData.forEach((key, index) => {
                        this.keyMap[key] = index;
                    });
                    console.log(`[KeyToIndexTransformPlugin] Loaded key map: ${JSON.stringify(this.keyMap, null, 2)}`);
                } else {
                    throw new Error('Locale file JSON is not an array of keys.');
                }
            } catch (error) {
                console.error(`[KeyToIndexTransformPlugin] Error loading locale file: ${error.message}`);
            }
        } else {
            console.error(`[KeyToIndexTransformPlugin] Locale file not found at: ${this.localeFilePath}`);
        }
    }

    transformSource(source) {
        let transformed = source;
        for (const [key, index] of Object.entries(this.keyMap)) {
            const regex = new RegExp(`'${key}'`, 'g');
            transformed = transformed.replace(regex, index.toString());
        }
        return transformed;
    }

    apply(compiler) {
        compiler.hooks.thisCompilation.tap('KeyToIndexTransformPlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'KeyToIndexTransformPlugin',
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
                },
                (assets) => {
                    Object.keys(assets).forEach((filename) => {
                        if (filename === 'renderer-bundle.js') {
                            console.log(`[KeyToIndexTransformPlugin] Transforming file: ${filename}`);
                            const asset = compilation.getAsset(filename);
                            const source = asset.source.source().toString();
                            const transformed = this.transformSource(source);

                            if (transformed !== source) {
                                compilation.updateAsset(
                                    filename,
                                    new compiler.webpack.sources.RawSource(transformed)
                                );
                                console.log(`[KeyToIndexTransformPlugin] Successfully transformed ${filename}`);
                            } else {
                                console.log(`[KeyToIndexTransformPlugin] No transformations applied to ${filename}`);
                            }
                        }
                    });
                }
            );
        });
    }
}

function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

function removeComments(content) {
    // This function removes multi-line and single-line comments from the given content string
    return content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/\/\/.*$/gm, ''); // Remove single-line comments
}

function getPackageVersion() {
    // Reads the package.json file to extract the current project version
    try {
        const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
        return packageJson.version;
    } catch (error) {
        console.error('Error reading package.json:', error.message);
        process.exit(1);
    }
}

function flattenLocalizationKeys() {
    // This function processes en.json to extract and flatten all localization keys into en_flat.json
    try {
        const inputContent = fs.readFileSync(INPUT_FILE, 'utf-8');
        const cleanedContent = removeComments(inputContent); // Remove comments to ensure clean JSON parsing
        const localizationData = JSON.parse(cleanedContent);

        if (!localizationData.contents || typeof localizationData.contents !== 'object') {
            throw new Error("Invalid input JSON structure: Missing or invalid 'contents' field.");
        }

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

function generateLocalizationJSON() {
    // Generates a complete localization JSON file by parsing source files for localize calls
    const version = getPackageVersion();
    const allFiles = getAllFiles(DIRECTORY_PATH);
    const localizationData = {
        "": [
            "--------------------------------------------------------------------------------------------",
            "Copyright (c) Your Company. All rights reserved.",
            "Licensed under the MIT License. See License.txt in the project root for license information.",
            "--------------------------------------------------------------------------------------------",
            "Do not edit this file. It is machine generated."
        ],
        version,
        contents: {}
    };

    allFiles.forEach((filePath) => {
        const relativePath = path.relative(DIRECTORY_PATH, filePath).replace(/\\/g, '/');
        const localizedEntries = parseFile(filePath);

        if (Object.keys(localizedEntries).length > 0) {
            localizationData.contents[relativePath] = localizedEntries;
        }
    });

    ensureDirectoryExists(INPUT_FILE);
    fs.writeFileSync(INPUT_FILE, JSON.stringify(localizationData, null, 4), 'utf-8');
    console.log(`Localization JSON written to ${INPUT_FILE}`);
}

function getAllFiles(dirPath, arrayOfFiles) {
    // Recursively retrieves all TypeScript files in the given directory
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach((file) => {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
        } else if (file.endsWith('.ts')) {
            arrayOfFiles.push(path.join(dirPath, file));
        }
    });

    return arrayOfFiles;
}

function parseFile(filePath) {
    // Parses a single file to extract localization keys and their default messages
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const cleanedContent = removeComments(fileContent); // Preprocess content to remove comments
    const lines = cleanedContent.split('\n');

    const entries = {};
    lines.forEach((line) => {
        let match;
        while ((match = LOCALIZE_REGEX.exec(line)) !== null) {
            const [_, key, defaultMessage] = match;

            if (!entries[key]) {
                entries[key] = defaultMessage;
            }
        }
    });

    return entries;
}

const LOCALIZE_REGEX = /(?<!\/\/.*)localize\s*\(\s*["'`](.*?)["'`]\s*,\s*["'`](.*?)["'`]/g;

function main() {
    console.log('Generating full localization JSON...');
    generateLocalizationJSON();

    console.log('Flattening localization JSON keys...');
    flattenLocalizationKeys();
}

main();

module.exports = { KeyToIndexTransformPlugin };
