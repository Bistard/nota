const fs = require('fs');
const path = require('path');

/**
 * {@link KeyToIndexTransformPlugin}
 * 
 * This Webpack plugin streamlines the internationalization (i18n) process 
 * by transforming human-readable localization keys in source code into numeric 
 * indices, reducing bundle size and improving runtime performance.
 * 
 * Key Features:
 * 1. Categorized Localization Data Extraction:
 *    - Scans the source code for calls to `localize(key, message)`.
 *    - Extracts localization keys (`key`) and their associated default messages (`message`).
 *    - Groups extracted localization keys by file paths, maintaining a hierarchical structure.
 * 
 * 2. Key-to-Index Transformation:
 *    - Replaces the `key` parameter in `localize` calls with numeric indices.
 *    - Ensures consistent mapping between keys and indices across all source files.
 * 
 * 3. Output of Localization:
 *    - Generates two files:
 *        - `*.json`: A JSON file categorizing all extracted localization keys 
 *                    and their default messages under file paths.
 *        - `*_lookup_table.json`: A JSON array mapping numeric indices to the 
 *                    corresponding default messages.
 * 
 * 4. Webpack Integration:
 *    - Hooks into Webpack's asset optimization stage (`PROCESS_ASSETS_STAGE_OPTIMIZE`).
 * 
 * ## Example
 * ```ts
 * // src/dir1/file1.ts
 * const name    = localize('displayName', 'default english name');
 * const content = localize('content', 'default english content');
 * 
 * // Generated en.json
 * {
 *     "contents": {
 *         "src/dir1/file1": {
 *             "displayName": "default english name",
 *             "content": "default english content"
 *         }
 *     }
 * }
 * 
 * // Generated en_lookup_table.json
 * [
 *     "default english name",
 *     "default english content"
 * ]
 * 
 * // Transformed source
 * const name    = localize(0, 'default english name');
 * const content = localize(1, 'default english content');
 * ```
 */
class KeyToIndexTransformPlugin {
    /**
     * @param {string} options.sourceCodePath Path to the source code directory to scan for localization keys.
     * @param {string} options.localeOutputPath Path to output the localization files.
     * @param {string} options.localizationFileName Name of the localization file to generate.
     * @param {string} options.lookupFileName Name of the lookup table file to generate.
     * @param {string[]} options.otherLocales Array of other locales that need to validate.
     */
    constructor({ 
        sourceCodePath,
        localeOutputPath,
        localizationFileName = 'en.json', 
        lookupFileName = 'en_lookup_table.json',
        otherLocales = []
    }) {
        this.sourceCodePath = sourceCodePath;
        this.localizationFilePath = path.join(localeOutputPath, localizationFileName);
        this.lookupTableFilePath = path.join(localeOutputPath, lookupFileName);
        this.localeOutputPath = localeOutputPath;
        this.localizationData = {};
        this.localizationKeys = [];
        this.otherLocales = otherLocales;
        this.localizationFileName = localizationFileName;
    }

    apply(compiler) {
        compiler.hooks.thisCompilation.tap('KeyToIndexTransformPlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'KeyToIndexTransformPlugin',
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
                },
                (assets) => {
                    /**
                     * Scans all the source files for localization keys and 
                     * builds the localization data.
                     */
                    this.#buildLocalizationData();

                    /**
                     * Writes the localization data and lookup table to files.
                     */
                    this.#writeLocalizationFiles();

                    /**
                     * // TODO: doc
                     */
                    this.#handleOtherLocales();

                    /**
                     * Replaces localization keys with corresponding indices in 
                     * the source code (Webpack assets).
                     */
                    this.#replaceKeysWithIndexes(compilation, assets);
                }
            );
        });
    }

    #buildLocalizationData() {
        const files = this.#getAllFiles(this.sourceCodePath);

        files.forEach((filePath) => {
            const relativePath = path.relative(this.sourceCodePath, filePath)
                .replace(/\\/g, '/')       // standardize forward slash
                .replace(/\.[^/.]+$/, ''); // remove file extension
            /**
             * Parse the entire file and try to find `localize`.
             */
            const localizedEntries = this.#parseFile(filePath);

            // Only include files with localize calls
            const hasAnyLocalize = Object.keys(localizedEntries).length > 0;
            if (!hasAnyLocalize) {
                return;
            }
            
            this.localizationData[relativePath] = localizedEntries;
            Object.entries(localizedEntries).forEach(([key]) => {
                const uniqueKey = `${relativePath}|${key}`;
                if (!this.localizationKeys.includes(uniqueKey)) {
                    this.localizationKeys.push(uniqueKey);
                }
            });
        });
    }

    #replaceKeysWithIndexes(compilation, assets) {
        const keyToIndexMap = this.localizationKeys.reduce((map, key, index) => {
            const originalKey = key.split('|')[1];
            map[originalKey] = index;
            return map;
        }, {});

        Object.keys(assets).forEach((filename) => {
            if (filename.endsWith('.js')) {
                const asset = compilation.getAsset(filename);
                const source = asset.source.source().toString();
                const transformed = this.#transformSource(source, keyToIndexMap);

                compilation.updateAsset(
                    filename,
                    new compilation.compiler.webpack.sources.RawSource(transformed)
                );
            }
        });
    }

    #transformSource(source, keyToIndexMap) {
        let transformed = source;
        for (const [key, index] of Object.entries(keyToIndexMap)) {
            const regex = new RegExp(`localize\\s*\\(\\s*["'\`]${key}["'\`]`, 'g');
            transformed = transformed.replace(regex, `localize(${index}`);
        }
        return transformed;
    }

    #writeLocalizationFiles() {
        const lookupTable = this.localizationKeys.map((key) => {
            const [relativePath, realKey] = key.split('|');
            return this.localizationData[relativePath][realKey];
        });

        this.#ensureDirectoryExists(this.localizationFilePath);
        this.#ensureDirectoryExists(this.localeOutputPath);

        const enData = {
            "": [
                "--------------------------------------------------------------------------------------------",
                "Copyright (c) Nota. All rights reserved.",
                "--------------------------------------------------------------------------------------------",
                "Do not edit this file. It is machine generated."
            ],
            version: this.#getPackageVersion(),
            contents: this.localizationData,
        };
        
        fs.writeFileSync(this.localizationFilePath, JSON.stringify(enData, null, 4), 'utf-8');
        console.log(`Localization JSON written to ${this.localizationFilePath}`);

        fs.writeFileSync(this.lookupTableFilePath, JSON.stringify(lookupTable, null, 4), 'utf-8');
        console.log(`Lookup table written to ${this.lookupTableFilePath}`);
    }

    #handleOtherLocales() {
        const enFilePath = this.localizationFilePath;
        if (!fs.existsSync(enFilePath)) {
            console.warn(`EN localization file not found at ${enFilePath}. Skipping other locales processing.`);
            return;
        }

        const enData = JSON.parse(fs.readFileSync(enFilePath, 'utf-8'));
        const enContents = enData.contents || {};

        this.otherLocales.forEach((locale) => {
            const localeFileName = locale + '.json';
            const localeFilePath = path.join(this.localeOutputPath, localeFileName);

            /**
             * If locale file doesn't exist, create it based on en.json,
             * but replace all values with empty string "".
             */
            if (!fs.existsSync(localeFilePath)) {
                const newLocaleData = JSON.parse(JSON.stringify(enData));
                this.#fillDataWithPlaceholders(newLocaleData, enContents, localeFileName, "file does not exist.");
                fs.writeFileSync(localeFilePath, JSON.stringify(newLocaleData, null, 4), 'utf-8');
                console.log(`Created ${localeFileName} with placeholder translations because it did not exist.`);
                return;
            } 

            // If exists, check for missing keys.
            let localeData;
            try {
                localeData = JSON.parse(fs.readFileSync(localeFilePath, 'utf-8'));
            } catch (e) {
                console.warn(`Failed to read or parse ${localeFileName}. Recreating from en.json with placeholders.`);
                const newLocaleData = JSON.parse(JSON.stringify(enData));
                this.#fillDataWithPlaceholders(newLocaleData, enContents, localeFileName, "failed to parse existing file.");
                fs.writeFileSync(localeFilePath, JSON.stringify(newLocaleData, null, 4), 'utf-8');
                return;
            }

            localeData.contents ??= {};

            // Compare keys
            let missingFound = false;
            for (const [filePath, enKeys] of Object.entries(enContents)) {
                localeData.contents[filePath] ??= {};
                for (const [key, enValue] of Object.entries(enKeys)) {
                    if (!localeData.contents[filePath].hasOwnProperty(key) // missing key
                        || localeData.contents[filePath][key] === ''       // empty value
                    ) {
                        localeData.contents[filePath][key] = "";
                        console.warn(`[KeyToIndexTransformPlugin] In ${localeFileName}, missing translation for key: "${key}" under "${filePath}". Placeholder inserted.`);
                        missingFound = true;
                    }
                }
            }

            if (missingFound) {
                fs.writeFileSync(localeFilePath, JSON.stringify(localeData, null, 4), 'utf-8');
                console.log(`Updated ${localeFileName} with missing keys placeholders.`);
            } 
            // successful case
            else {
                console.log(`[KeyToIndexTransformPlugin] Validated ${localeFileName} localization file.`);
            }
        });
    }

    /**
     * Helper method to fill localeData with placeholders for all keys found in enContents.
     * @param {object} localeData 
     * @param {object} enContents 
     * @param {string} localeFileName 
     * @param {string} warningReason - a short reason phrase to include in the warning messages
     */
    #fillDataWithPlaceholders(localeData, enContents, localeFileName, warningReason) {
        if (!localeData.contents) {
            localeData.contents = {};
        }

        for (const [filePath, enKeys] of Object.entries(enContents)) {
            if (!localeData.contents[filePath]) {
                localeData.contents[filePath] = {};
            }
            for (const [key] of Object.entries(enKeys)) {
                localeData.contents[filePath][key] = "";
                console.warn(`[KeyToIndexTransformPlugin] In ${localeFileName}, ${warningReason} Inserted placeholder for key: "${key}" under "${filePath}".`);
            }
        }
    }

    #getAllFiles(dirPath, arrayOfFiles = []) {
        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
            const filePath = path.join(dirPath, file);
            if (fs.statSync(filePath).isDirectory()) {
                arrayOfFiles = this.#getAllFiles(filePath, arrayOfFiles);
            } else if (file.endsWith('.ts')) {
                arrayOfFiles.push(filePath);
            }
        });

        return arrayOfFiles;
    }

    #parseFile(filePath) {
        const LOCALIZE_REGEX = /localize\s*\(\s*["'`](.*?)["'`]\s*,\s*["'`](.*?)["'`]/g;
        let fileContent = fs.readFileSync(filePath, 'utf-8');
        fileContent = removeComments(fileContent);

        const entries = {};
        let match;
        while ((match = LOCALIZE_REGEX.exec(fileContent)) !== null) {
            const [_, key, defaultMessage] = match;
            if (!entries[key]) {
                entries[key] = defaultMessage;
            }
        }
        return entries;
    }

    #ensureDirectoryExists(filePath) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    #getPackageVersion() {
        try {
            const rootPath = path.resolve(this.sourceCodePath, '../package.json');
            const packageJson = JSON.parse(fs.readFileSync(rootPath, 'utf-8'));
            return packageJson.version;
        } catch (error) {
            console.warn('Error reading package.json:', error.message);
            return '0.0.0';
        }
    }
}

function removeComments(content) {
    return content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
}

module.exports = { KeyToIndexTransformPlugin };
