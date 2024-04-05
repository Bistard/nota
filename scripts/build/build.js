const path = require("path");
const { Colors, Times, Loggers, ScriptProcess, ScriptHelper } = require("../utility");

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
    const codiconProc = new ScriptProcess(
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
    await codiconProc.waiting();

    // build with webpack
    const proc = new ScriptProcess(
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
        },
    );

    registerSpawnListeners(proc.proc);
    function registerSpawnListeners(spawn) {

        spawn.stdout.on('data', (output) => {
            process.stdout.write(`${Times.getTime()} ${output}`);
        });
        
        spawn.stderr.on('data', (error) => {
            Loggers.printRed(`${error}`);
        });
        
        spawn.on('close', (code) => {
            // TODO: remove this piece of code
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
})();