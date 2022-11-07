/**
 * @description This is a configuration file for generating a series of built-in 
 * font icons using `fantasticon`.
 */

console.log(process.env.outputDir);

const configuration = {
    inputDir: process.env.inputDir,     // (required) eg. 'assets/svg'
    outputDir: process.env.outputDir,   // (required) eg. 'src/base/browser/icon'
    fontTypes: [/* 'ttf', 'woff', */ 'woff2'],
    assetTypes: ['ts', 'css', /* 'json', 'html' */],
    // fontsUrl: 'src/base/browser/icon',
    
    formatOptions: {
        // Pass options directly to `svgicons2svgfont`
        woff: {
            // Woff Extended Metadata Block - see https://www.w3.org/TR/WOFF/#Metadata
            metadata: '...'
        },
        json: {
            // render the JSON human readable with two spaces indentation (default is none, so minified)
            indent: 2
        },
        ts: {
            // select what kind of types you want to generate (default `['enum', 'constant', 'literalId', 'literalKey']`)
            types: ['enum'],
            // render the types with `'` instead of `"` (default is `"`)
            singleQuotes: true
        }
    },
};

module.exports = configuration;