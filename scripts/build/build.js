const path = require("path");
const { utils, Colors, Times, Loggers, ScriptProcess, ScriptHelper } = require("../utility");

(async () => {
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

    // compile necessary binary files before actual building
    // TODO: replace with new 'icon2' script
    await compileFontIcons(process.cwd());

    // build with webpack
    const proc = new ScriptProcess(
        'webpack',
        'webpack',
        ['--config', './scripts/build/webpack.config.js'],
        [],
        {
            env: process.env,
            cwd: process.cwd(),
            shell: true,
            logConfiguration: [
                ['ELECTRON_VER', process.versions.electron ?? 'N/A'],
                ['CHROME_VER', process.versions.chrome ?? 'N/A'],
                ['V8_VER', process.versions.v8 ?? 'N/A'],
                ['NODE_VER', process.versions.node ?? 'N/A'],
                ...envPair,
            ],
            // stdio: "inherit"
        },
    );

    registerSpawnListeners(proc.proc);

    // #region helper functions
    async function compileFontIcons(rootDir) {
        Loggers.print('Compiling font icons...');
        
        try {
            const iconScriptPath = path.join(rootDir, './scripts/icons/icon.js');
            await utils.spawnChildProcess(`node ${iconScriptPath}`, [], {
                env: process.env,
                cwd: rootDir,
                shell: true,
                stdio: "inherit",
            });
        } 
        catch (code) {
            Loggers.printRed(`Font icons compile failed with exit code ${code}.`);
            process.exit(code);
        }
        Loggers.printGreen('Font icons completed.');
    }

    function registerSpawnListeners(spawn) {

        spawn.stdout.on('data', (output) => {
            process.stdout.write(`${Times.getTime()} ${output}`);
        });
        
        spawn.stderr.on('data', (error) => {
            Loggers.printRed(`${error}`);
        });
        
        spawn.on('close', (code) => {
            let fail = false;
            for (let i = 0; i < 3; i++) console.log(); // left some spaces

            if (code) {
                fail = true;
                process.stdout.write(`${Times.getTime()} ${Colors.red(`child process exited with error code ${code}`)}\n`);
            } else {
                process.stdout.write(`${Times.getTime()} ${Colors.green('Building success')}\n`);
            }
            
            if (fail) {
                process.exit(code);
            }
        });
    }

    //#endregion
})();