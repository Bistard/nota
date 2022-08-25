const childProcess = require("child_process");
const minimist = require("minimist");
const path = require("path");
const { c, getTime, perf, getPerf } = require("./utility");

// Start building...
perf('build');
console.log(`${getTime(c.FgGreen)} Building...`);

// wrap spawn so that we may print message properly
const oldSpawn = childProcess.spawn;
childProcess.spawn = wrapSpawnWithPrintMessage;

// parse CLI arguments
const CLIArgv = minimist(process.argv.slice(2));
console.log(`${getTime()} [Building arguments]`, CLIArgv);
if (CLIArgv.NODE_ENV) {
    process.env.NODE_ENV = CLIArgv.NODE_ENV;
} else {
    process.env.NODE_ENV = 'development';
}

// spawn the child process
const spawn = childProcess.spawn('webpack --config webpack.config.js', [], {
    env: process.env,
    cwd: path.resolve(__dirname, '../'),
    shell: true
});

// register spawn listeners
registerSpawnListeners(spawn);


// #region helper functions
function wrapSpawnWithPrintMessage() {
    for (const arg of arguments) {

        let output = `${getTime()} `;
        if (typeof arg === 'string') {
            output += `[Executing command] ${arg}`;
        } 
        else if (Array.isArray(arg)) {
            if (arg.length === 0) {
                output += `[Command arguments] N/A`;
            } else {
                output += `[Command arguments] ${arg}`;
            }
        } 
        else {
            const stamp = getTime();
            output = `${stamp} [CWD]: ${arg.cwd}\n`;
            output += `${stamp} [NODE_ENV]: ${arg.env.NODE_ENV}`;
        }
        
        console.log(output);
    }

    var result = oldSpawn.apply(this, arguments);
    return result;
}

function registerSpawnListeners(spawn) {

    spawn.stdout.on('data', (output) => {
        process.stdout.write(`${getTime()} ${output}`);
    });
      
    spawn.stderr.on('data', (error) => {
        console.error(`${getTime()} ${error}`);
    });
    
    spawn.on('close', (code) => {
        let fail = false;
        for (let i = 0; i < 3; i++) console.log(); // left some spaces

        if (code) {
            fail = true;
            process.stdout.write(`${getTime(c.FgRed)} child process exited with code ${code}`);
        } else {
            process.stdout.write(`${getTime(c.FgGreen)} Building success`);
        }
        perf('build');

        const [begin, end] = getPerf();
        const spentInSec = (end.time - begin.time) / 1000;
        process.stdout.write(` in ${Math.round(spentInSec * 100) / 100} seconds.\n`);

        if (fail) {
            process.exit(code);
        }
    });
}

//#endregion