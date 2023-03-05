const childProcess = require("child_process");
const path = require("path");
const utils = require("./utility");

// Start building...
utils.perf('build');
console.log(`${utils.getTime(utils.c.FgGreen)} Building...`);

// wrap spawn so that we may print message properly
const oldSpawn = childProcess.spawn;
childProcess.spawn = wrapSpawn;

// parse CLI arguments
parsingCLI();

// spawn the child process
const spawn = childProcess.spawn(
    'webpack --config ./scripts/webpack.config.js', 
    [], 
    {
        env: process.env,
        cwd: path.resolve(__dirname, '../'),
        shell: true,
    },
);

// register spawn listeners
registerSpawnListeners(spawn);


// #region helper functions

function parsingCLI() {
    const CLIArgv = utils.parseCLI();
    console.log(`${utils.getTime()} [Building arguments]`, CLIArgv);
    process.env.NODE_ENV = CLIArgv.NODE_ENV ?? 'development';
    process.env.CIRCULAR = CLIArgv.circular ?? CLIArgv.c ?? 'true';
    process.env.WATCH_MODE = CLIArgv.watch ?? CLIArgv.w ?? 'false';
}

function wrapSpawn() {
    for (const arg of arguments) {

        let output = `${utils.getTime()} `;
        if (typeof arg === 'string') {
            output += `[Executing command] ${arg}\n`;
        } 
        else if (Array.isArray(arg)) {
            if (arg.length === 0) {
                output += `[Command arguments] N/A\n`;
            } else {
                output += `[Command arguments] ${arg}\n`;
            }
        } 
        else {
            const stamp = utils.getTime();
            output = `${stamp} [CWD]: ${arg.cwd}\n`;
            output += `${stamp} [NODE_ENV]: ${arg.env.NODE_ENV ?? 'N/A'}\n`;
            output += `${stamp} [ELECTRON_VER]: ${process.versions.electron ?? 'N/A'}\n`;
            output += `${stamp} [CHROME_VER]: ${process.versions.chrome ?? 'N/A'}\n`;
            output += `${stamp} [V8_VER]: ${process.versions.v8 ?? 'N/A'}\n`;
            output += `${stamp} [NODE_VER]: ${process.versions.node ?? 'N/A'}\n`;
            output += `${stamp} [WATCH_MODE]: ${process.env.WATCH_MODE ?? 'false'}\n`;
            output += `${stamp} [CIRCULAR_CHECK]: ${process.env.CIRCULAR ?? 'true'}\n`;
        }
        
        process.stdout.write(output);
    }

    var result = oldSpawn.apply(this, arguments);
    return result;
}

function registerSpawnListeners(spawn) {

    spawn.stdout.on('data', (output) => {
        process.stdout.write(`${utils.getTime()} ${output}`);
    });
      
    spawn.stderr.on('data', (error) => {
        console.error(`${utils.getTime()} ${error}`);
    });
    
    spawn.on('close', (code) => {
        let fail = false;
        for (let i = 0; i < 3; i++) console.log(); // left some spaces

        if (code) {
            fail = true;
            process.stdout.write(`${utils.getTime(utils.c.FgRed)} child process exited with error code ${code}`);
        } else {
            process.stdout.write(`${utils.getTime(utils.c.FgGreen)} Building success`);
        }
        utils.perf('build');

        const [begin, end] = utils.getPerf();
        const spentInSec = (end.time - begin.time) / 1000;
        process.stdout.write(` in ${Math.round(spentInSec * 100) / 100} seconds.\n`);

        if (fail) {
            process.exit(code);
        }
    });
}

//#endregion