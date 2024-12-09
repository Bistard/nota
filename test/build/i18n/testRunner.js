const path = require("path");
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
})();