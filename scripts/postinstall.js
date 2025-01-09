const path = require("path");
const fs = require('fs');
const { ScriptProcess, fgColor, log } = require('./utility');

/**
 * Main entrance
 */
(async function main() {

    /**
     * @description Creates a symbolic link for module aliasing.
     * @note This solves the eslint local plugin linking problem (eslint cannot
     *       find local plugin properly).
     */
    await linkModuleAlias();

    /**
     * @description Removes the `@types/glob` directory from the `node_modules` 
     * directory.
     * @note This fix the issue #222
     */
    await removeTypesGlob();
})();

async function linkModuleAlias() {
    const linkAlias = new ScriptProcess('link-module-alias', 'link-module-alias', [], [], {
        env: process.env,
        cwd: path.resolve(__dirname, '../'), // redirect the cwd to the root directory
        shell: true,

        // inherits the stdin / stdout / stderr
        stdio: "inherit",
    });
    await linkAlias.waiting();
}

async function removeTypesGlob() {
    log('info', `\x1B[4m${fgColor.LightGreen}remove-types-glob\x1b[0m`);
    log('info', 'Removing `node_modules/@types/glob`...');

    const globPath = path.join(process.cwd(), 'node_modules', '@types', 'glob')
    await fs.promises.rm(globPath, { recursive: true, force: true, maxRetries: 2, retryDelay: 50, });

    log('info', 'Removed `node_modules/@types/glob`.');
}