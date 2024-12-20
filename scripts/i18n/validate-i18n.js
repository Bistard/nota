const path = require('path');
const { localizationGenerator } = require("./i18n");
const { SUPPORT_LOCALIZATION_LIST } = require('./localization');

const cwd = process.cwd();
const sourceCodePath = path.resolve(cwd, './src');
const localeOutputPath = path.resolve(cwd, './assets/locale');
const localizationKeys = [];
const localizationData = {};
let anyError = false;

(function main() {

    const localization = new localizationGenerator({
        sourceCodePath: sourceCodePath,
        localeOutputPath: localeOutputPath,
        localizationFilePath: path.join(localeOutputPath, 'en.json'),
        localizationFileName: path.join(localeOutputPath, 'en_lookup_table.json'),
        otherLocales: SUPPORT_LOCALIZATION_LIST,
        localizationKeys: localizationKeys,
        localizationData: localizationData,
        logError: message => {
            anyError = true;
            console.error('[ERR]', message);
        },
    });

    localization.generateAndValidate();


    if (anyError) {
        process.exit(1);
    } else {
        process.exit(0);
    }
})();