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
     * @param {'warn' | 'error'} options.logLevel 
     * @param {string} options.sourceCodePath Path to the source code directory to scan for localization keys.
     * @param {string} options.localeOutputPath Path to output the localization files.
     * @param {string} options.localizationFileName Name of the localization file to generate.
     * @param {string} options.lookupFileName Name of the lookup table file to generate.
     * @param {string[]} options.otherLocales Array of other locales that need to validate.
     */
    constructor({ 
        logLevel,
        sourceCodePath,
        localeOutputPath,
        localizationFileName = 'en.json', 
        lookupFileName = 'en_lookup_table.json',
        otherLocales = []
    }) {
        console.log(`[KeyToIndexTransformPlugin] logLevel: ${logLevel}`);
        this.logLevel = logLevel;
        this.sourceCodePath = sourceCodePath;
        this.localizationFilePath = path.join(localeOutputPath, localizationFileName);
        this.lookupTableFilePath = path.join(localeOutputPath, lookupFileName);
        this.localeOutputPath = localeOutputPath;
        /** 
         * Mapping from 'relative file path' to an object with key-value pairs. 
         * @note This is en-version
         */
        this.localizationData = {};
        /** Stores all the keys in unique way: `relativePath|key` */
        this.localizationKeys = [];
        this.otherLocales = otherLocales;
        this.localizationFileName = localizationFileName;

        // collects all errors
        this.errors = [];
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
                     * Iterates through the source code directory and extracts 
                     * localization keys using the `localize(key, message)` 
                     * pattern. The results are stored in `this.localizationData` 
                     * (grouped by file path) and `this.localizationKeys` 
                     * (a unique array of all keys with paths).
                     */
                    this.#buildLocalizationData();

                    /**
                     * Writes the localization data (`this.localizationData`) 
                     * into a JSON file (`en.json`) in a standardized format.
                     * @note This step creates only the English (`en`) version.
                     */
                    this.#writeLocalizationFile();

                    /**
                     * Handles other localization files by validating or 
                     * creating them.
                     * 
                     * Ensures all additional locale files specified in 
                     * `this.otherLocales` exist and contain all keys defined in 
                     * `en.json`. 
                     *      - If a locale file is missing, it is created with 
                     *        placeholder translations for all keys. 
                     *      - If a locale file exists but is missing keys, those 
                     *        keys are added with placeholder values.
                     */
                    this.#validateOtherLocalizationFiles();

                    /**
                     * Generates lookup table files for all supported locales 
                     * (including English). The lookup tables map numeric 
                     * indices to translations and are stored in separate JSON 
                     * files (e.g., `en_lookup_table.json`, `zh-cn_lookup_table.json`).
                     */
                    this.#writeAllLookupTables();

                    /**
                     * Replaces localization keys with corresponding indices in 
                     * the source code (Webpack assets).
                     * 
                     * Iterates through all JavaScript assets generated by 
                     * Webpack, identifies occurrences of `localize(key, message)` 
                     * calls, and replaces the `key` parameter with its 
                     * corresponding numeric index. This transformation reduces 
                     * the bundle size and improves runtime performance.
                     */
                    this.#replaceKeysWithIndexes(compilation, assets);

                    // notify Webpack of any errors/warnings
                    if (this.errors.length > 0) {
                        const resolvedArr = this.logLevel === 'error' ? compilation.errors : compilation.warnings;
                        this.errors.forEach(error => resolvedArr.push(new Error(error)));
                    }
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

    #writeAllLookupTables() {
        // en_lookup_table.json
        this.#createLocaleLookupTable(this.localizationData, 'en');

        // others
        this.otherLocales.forEach((locale) => {
            const localeFileName = `${locale}.json`;
            const localeFilePath = path.join(this.localeOutputPath, localeFileName);
            if (!fs.existsSync(localeFilePath)) {
                this.#logError(`[KeyToIndexTransformPlugin] Cannot create lookup table for ${locale}, file not found.`);
                return;
            }

            const localeFileData = JSON.parse(fs.readFileSync(localeFilePath, 'utf-8'));
            const localeContents = localeFileData.contents || {};
            this.#createLocaleLookupTable(localeContents, locale);
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

    #writeLocalizationFile() {
        this.#ensureDirectoryExists(this.localizationFilePath);
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
        console.log(`[KeyToIndexTransformPlugin] Localization JSON written to ${this.localizationFilePath}`);

        this.#createLocaleLookupTable(this.localizationData, 'en');
    }

    #validateOtherLocalizationFiles() {
        const enFilePath = this.localizationFilePath;
        if (!fs.existsSync(enFilePath)) {
            this.#logError(`[KeyToIndexTransformPlugin] EN localization file not found at ${enFilePath}. Skipping other locales processing.`);
            return;
        }
    
        const enData = JSON.parse(fs.readFileSync(enFilePath, 'utf-8'));
        const enContents = enData.contents || {};
    
        this.otherLocales.forEach((locale) => {
            const localeFileName = `${locale}.json`;
            const localeFilePath = path.join(this.localeOutputPath, localeFileName);
    
            let localeData;
    
            if (!fs.existsSync(localeFilePath)) {
                // Locale file doesn't exist; create it with placeholders
                localeData = this.#createLocaleFileWithPlaceholders(enData, enContents, localeFileName, localeFilePath);
            } else {
                // Locale file exists; validate and update it
                localeData = this.#validateAndUpdateLocaleFile(enData, enContents, localeFileName, localeFilePath);
            }
    
            if (localeData) {
                // Check and remove extra keys
                const extraFound = this.#removeExtraKeys(localeData, enContents, localeFileName);
                if (extraFound) {
                    fs.writeFileSync(localeFilePath, JSON.stringify(localeData, null, 4), 'utf-8');
                    this.#logError(`[KeyToIndexTransformPlugin] Updated ${localeFileName} by removing extra keys.`);
                }
            }
        });
    }
    
    #createLocaleFileWithPlaceholders(enData, enContents, localeFileName, localeFilePath) {
        const localeData = JSON.parse(JSON.stringify(enData));
        this.#fillDataWithPlaceholders(localeData, enContents, localeFileName, "file does not exist.");
        fs.writeFileSync(localeFilePath, JSON.stringify(localeData, null, 4), 'utf-8');
        this.#logError(`[KeyToIndexTransformPlugin] Created ${localeFileName} with placeholder translations because it did not exist.`);
        return localeData;
    }
    
    #validateAndUpdateLocaleFile(enData, enContents, localeFileName, localeFilePath) {
        let localeData;
    
        try {
            localeData = JSON.parse(fs.readFileSync(localeFilePath, 'utf-8'));
        } catch (e) {
            return this.#createLocaleFileWithPlaceholders(enData, enContents, localeFileName, localeFilePath);
        }
    
        localeData.contents ??= {};
    
        let missingFound = false;
        for (const [filePath, enKeys] of Object.entries(enContents)) {
            localeData.contents[filePath] ??= {};
            for (const [key, enValue] of Object.entries(enKeys)) {
                if (!localeData.contents[filePath].hasOwnProperty(key) // missing key
                    || localeData.contents[filePath][key] === ''       // empty value
                ) {
                    localeData.contents[filePath][key] = "";
                    this.#logError(`[KeyToIndexTransformPlugin] In ${localeFileName}, missing translation for key: "${key}" under "${filePath}". Placeholder inserted.`);
                    missingFound = true;
                }
            }
        }
    
        if (missingFound) {
            fs.writeFileSync(localeFilePath, JSON.stringify(localeData, null, 4), 'utf-8');
            console.log(`[KeyToIndexTransformPlugin] Updated ${localeFileName} with missing keys placeholders.`);
        } else {
            console.log(`[KeyToIndexTransformPlugin] Validated ${localeFileName} localization file.`);
        }
    
        return localeData;
    }
    
    #removeExtraKeys(localeData, enContents, localeFileName) {
        let extraFound = false;
    
        for (const [localeFilePathKey, localeKeys] of Object.entries(localeData.contents)) {
            // If the filePath doesn't exist in enContents, remove entire block
            if (!enContents.hasOwnProperty(localeFilePathKey)) {
                delete localeData.contents[localeFilePathKey];
                this.#logError(`[KeyToIndexTransformPlugin] In ${localeFileName}, found extra filePath "${localeFilePathKey}" not present in EN. Removed entire block.`);
                extraFound = true;
                continue;
            }
    
            // Otherwise, check individual keys
            for (const localeKey of Object.keys(localeKeys)) {
                if (!enContents[localeFilePathKey].hasOwnProperty(localeKey)) {
                    delete localeData.contents[localeFilePathKey][localeKey];
                    this.#logError(`[KeyToIndexTransformPlugin] In ${localeFileName}, found extra key "${localeKey}" under "${localeFilePathKey}" not present in EN. Removed this key.`);
                    extraFound = true;
                }
            }
        }
    
        return extraFound;
    }

    /**
     * This method will generate a lookup_table json file for the given locale.
     * 1. Iterate over this.localizationKeys (which defines the key order).
     * 2. For each uniqueKey (relativePath|key), find the corresponding translation in localeData.contents.
     * 3. Write out an array file named <locale>_lookup_table.json.
     */
    #createLocaleLookupTable(localeData, locale) {
        const lookupTable = this.localizationKeys.map((uniqueKey) => {
            const [relativePath, key] = uniqueKey.split('|');
            const translation = localeData[relativePath]?.[key] ?? '';
            return translation;
        });

        const localeLookupTableFilePath = path.join(this.localeOutputPath, `${locale}_lookup_table.json`);
        this.#ensureDirectoryExists(localeLookupTableFilePath);
        fs.writeFileSync(localeLookupTableFilePath, JSON.stringify(lookupTable, null, 4), 'utf-8');
        console.log(`[KeyToIndexTransformPlugin] Lookup table written to ${localeLookupTableFilePath}`);
    }

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
                this.#logError(`[KeyToIndexTransformPlugin] In ${localeFileName}, ${warningReason} Inserted placeholder for key: "${key}" under "${filePath}".`);
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

    #logError(err) {
        console.error(err);
        this.errors.push(err);
    }
}

function removeComments(content) {
    return content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
}

module.exports = { KeyToIndexTransformPlugin };
