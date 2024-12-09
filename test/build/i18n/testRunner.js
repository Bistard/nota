const path = require("path");
const fs = require('fs');
const { Times, Loggers, ScriptProcess, ScriptHelper } = require("../../../scripts/utility");

(async () => {
    const cwd = process.cwd();

    // build with webpack
    const webpack = new ScriptProcess(
        'webpack',
        'webpack',
        ['--config', './test/build/i18n/webpack.config.js'],
        [],
        {
            env: process.env,
            cwd: cwd,
            shell: true,
            logConfiguration: [
                ['ELECTRON_VER', process.versions.electron ?? 'N/A'],
                ['CHROME_VER', process.versions.chrome ?? 'N/A'],
                ['V8_VER', process.versions.v8 ?? 'N/A'],
                ['NODE_VER', process.versions.node ?? 'N/A'],
            ],
            // stdio: "inherit"
            onStdout: (output) => {
                process.stdout.write(`${Times.getTime()} ${output}`);
            },
            onStderr: (error) => {
                Loggers.printRed(`${error}`);
            }
        },
    );

    try {
        await webpack.waiting();
    } catch (err) {
        process.exit(1);
    }

    /**
     * Validates the generated localization JSON files.
     * Ensures that:
     *  1. `en.json` and
     *  2. `en_lookup_table.json` 
     * files exist and are valid.
     */
    await (async function validateLocalizationFiles() {
        const localizationFile = path.resolve(cwd, './test/build/i18n/dist/locale/en.json');
        const lookupTableFile = path.resolve(cwd, './test/build/i18n/dist/locale/en_lookup_table.json');
        
        await fs.promises.stat(localizationFile);
        await fs.promises.stat(lookupTableFile);
    })();

    /**
     * Executes the main bundle script to ensure that it runs without errors.
     * This validates that the build process has correctly integrated i18n features.
     */
    await (async function executeMain() {
        const executable = new ScriptProcess(
            'executable',
            'node ./test/build/i18n/dist/main-bundle.js',
            [],
            [],
            {
                env: process.env,
                cwd: cwd,
                shell: true,
                // stdio: "inherit"
                onStdout: (output) => {
                    process.stdout.write(`${Times.getTime()} ${output}`);
                },
                onStderr: (error) => {
                    Loggers.printRed(`${error}`);
                }
            },
        );
        try {
            await executable.waiting();
        } catch (err) {
            console.error('i18n integration test: encountering error when executing the main-bundle.js', err);
            process.exit(1);
        }
    })();

    /**
     * Cleans up the generated files by removing the `/dist` directory.
     * This ensures that the environment is reset for subsequent test runs.
     */
    await (async function cleanup() {
        await fs.promises.rm(path.resolve(cwd, './test/build/i18n/dist'), { recursive: true, force: true });
    })();
})();