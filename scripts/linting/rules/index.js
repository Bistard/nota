/**
 * Script to dynamically load and export all TypeScript files as rules from the 
 * current directory and its subdirectories.
 * 
 * @example
 * // Example directory structure:
 * // /rules
 * //   ├── rule1.ts
 * //   └── rule2.ts
 * 
 * // Usage:
 * const { rules } = require('./path/to/this/script');
 * console.log(rules.rule1); // Exports from rule1.ts
 * console.log(rules.rule2); // Exports from rule2.ts
 */

const glob = require('glob');
const path = require('path');
require('ts-node').register({ 
    experimentalResolver: true, 
    transpileOnly: true,
    project: path.resolve(__dirname, './tsconfig.json'),
});

const rules = {};

/**
 * Recursively finds all `.ts` files in the current directory and subdirectories,
 * dynamically imports them, and maps them to the `rules` object.
 */
glob.sync(`${__dirname}/**/*.ts`)
    .forEach((file) => {
        const ruleName = path.basename(file, '.ts');
        rules[ruleName] = require(file); // dynamically import
    });

exports.rules = rules;