const path = require('path');
const { localizationGenerator } = require('./i18n');
const { log } = require('../utility');

/**
 * {@link KeyToIndexTransformPlugin}
 * 
 * @description This Webpack plugin builds upon the capabilities of the 
 * {@link localizationGenerator}. then performing an additional step:
 *      - it replaces human-readable localization keys with numeric indices to
 *        the webpack compilation result.
 * 
 * @see {localizationGenerator}
 * @example
 * ```ts
 * // src/dir1/file1.ts (done by `localizationGenerator`)
 * const name    = localize('displayName', 'default english name');
 * const content = localize('content', 'default english content');
 * 
 * // Generated en.json (done by `localizationGenerator`)
 * {
 *     "contents": {
 *         "src/dir1/file1": {
 *             "displayName": "default english name",
 *             "content": "default english content"
 *         }
 *     }
 * }
 * 
 * // Generated en_lookup_table.json (done by `localizationGenerator`)
 * [
 *     "default english name",
 *     "default english content"
 * ]
 * 
 * // Transformed source code of `renderer-bundle.js` (job done by the plugin)
 * const name    = localize(0, 'default english name');
 * const content = localize(1, 'default english content');
 * ```
 */
class KeyToIndexTransformPlugin {
    constructor({ 
        logLevel,
        sourceCodePath,
        localeOutputPath,
        localizationFileName = 'en.json', 
        lookupFileName = 'en_lookup_table.json',
        otherLocales = []
    }) {
        log('info', `[KeyToIndexTransformPlugin] logLevel: ${logLevel}`);
        this.logLevel = logLevel;
        this.sourceCodePath = sourceCodePath;
        this.localizationFilePath = path.join(localeOutputPath, localizationFileName);
        this.lookupTableFilePath = path.join(localeOutputPath, lookupFileName);
        this.localeOutputPath = localeOutputPath;
        this.localizationData = {};
        this.localizationKeys = [];
        this.otherLocales = otherLocales;
        this.localizationFileName = localizationFileName;
        this.errors = [];

        this.i18nManager = new localizationGenerator({
            sourceCodePath: this.sourceCodePath,
            localeOutputPath: this.localeOutputPath,
            localizationFilePath: this.localizationFilePath,
            localizationFileName: this.localizationFileName,
            otherLocales: this.otherLocales,
            localizationKeys: this.localizationKeys,
            localizationData: this.localizationData,
            logError: this.#logError.bind(this),
        });
    }

    // main entry
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('KeyToIndexTransformPlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'KeyToIndexTransformPlugin',
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
                },
                (assets) => {
                    // step 1
                    this.i18nManager.generateAndValidate();
                    // step 2
                    this.#replaceKeysWithIndexes(compilation, assets);
                    // log
                    if (this.errors.length > 0) {
                        const resolvedArr = this.logLevel === 'error' ? compilation.errors : compilation.warnings;
                        this.errors.forEach(error => resolvedArr.push(new Error(error)));
                    }
                }
            );
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

    #logError(err) {
        console.error(err);
        this.errors.push(err);
    }
}

module.exports = { KeyToIndexTransformPlugin };
