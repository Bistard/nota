const path = require("path");
const { Times, Loggers, ScriptProcess, ScriptHelper } = require("../utility");

(async () => {
    const cwd     = process.cwd();
    const CLIArgv = ScriptHelper.init('build');
    const envPair = ScriptHelper.setEnv({
        CIRCULAR: { 
            value: CLIArgv.circular ?? CLIArgv.c, 
            defaultValue: 'false' 
        },
        WATCH_MODE: {
            value: CLIArgv.watch ?? CLIArgv.w,
            defaultValue: 'false',
        },
        BUILD_MODE: {
            value: CLIArgv.mode,
            defaultValue: 'development',
        }
    });

    // compile codicon
    const codicon = new ScriptProcess(
        'codicon',
        `node ${path.join(cwd, './scripts/icons/codicon.js')}`,
        [],
        [],
        {
            env: process.env,
            cwd: cwd,
            shell: true,
            stdio: "inherit",
        }
    );
    
    try {
        await codicon.waiting();
    } catch (err) {
        process.exit(1);
    }

    // output raw i18n locale JSON file
    const i18n = new ScriptProcess(
        'i18n',
        'node',
        ['scripts/build/i18n.js'],
        [],
        {
            env: process.env,
            cwd: cwd,
            shell: true,
            stdio: "inherit",
        }
    );

    try {
        await i18n.waiting();
    } catch (err) {
        process.exit(1);
    }

    // convert raw JSON locale file into 1D array and write into compiled file
    const nls = new ScriptProcess(
        'nls',
        'node',
        ['scripts/build/nls.js'],
        [],
        {
            env: process.env,
            cwd: cwd,
            shell: true,
            stdio: "inherit",
        }
    );

    try {
        await nls.waiting();
    } catch (err) {
        process.exit(1);
    }

    // build with webpack
    const webpack = new ScriptProcess(
        'webpack',
        'webpack',
        ['--config', './scripts/build/webpack.config.js'],
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
                ...envPair,
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