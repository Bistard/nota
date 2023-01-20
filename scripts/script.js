/**
 * # Command Line Interface Documentation (CLI Doc)
 * 
 * This script can be invoked from `package.json`.
 * 
 * The script acts like a central management that can access all the pre-defined
 * scripts. The script configurations can be found at {@link SCRIPT_CONFIG_PATH}.
 */

const childProcess = require("child_process");
const path = require("path");
const utils = require('./utility');

/**
 * @typedef {Record<string, { command: string, description: string }>} ScriptConfiguration
 */

const SCRIPT_CONFIG_PATH = './configuration.js';

const USAGE = `
usage: npm run script (<command> | list | help) [--] [<argument>...]
    eg. npm run script help
        npm run script list
        npm run script start -- -arg1 --arg2=arg3
`;
const HELP_STRING = `To see a list of valid scripts, run:
    npm run script help
`;
const INVALID_SCRIPT_COMMAND = `Invalid script command format. Please follow: ${USAGE}.`;

(async function () {
    
    // Read script configuration
    const scriptConfiguraion = require(SCRIPT_CONFIG_PATH);

    // try interpret CLI
    console.log(process.argv);
    const cliArgs = process.argv.slice(2);
    const [cmd, args] = validateCLI(cliArgs);

    // actual execution
    if (cmd === 'help') {
        executeHelp();
    } 
    else if (cmd === 'list') {
        executeList(scriptConfiguraion);
    }
    else {
        executeScript(cmd, args, scriptConfiguraion);
    }
})();

// #region Helper Functions

/**
 * @param {string[]} args 
 * @returns {[string, string[]]}
 */
function validateCLI(args) {
    const command = args[0];
    if (!command) {
        console.log(INVALID_SCRIPT_COMMAND);
        process.exit(1);
    }
    return [command, args.slice(1)];
}

function executeHelp() {
    console.log(USAGE);
}

/**
 * @param {ScriptConfiguration} configuration 
 */
function executeList(configuration) {
    for (const key of Object.getOwnPropertyNames(configuration)) {
        const { _command, description } = configuration[key];
            console.log(`${key}   ${description}`);
    }
}

/**
 * @param {string} command 
 * @param {string[]} args 
 * @param {ScriptConfiguration} configuration
 */
function executeScript(command, args, configuration) {

    let scriptConfiguration = configuration[command];
    if (!scriptConfiguration) {
        console.log(`Invalid script command '${command}'. ${HELP_STRING}.`);
        process.exit(1);
    }

    let actualCommand = scriptConfiguration.command;
    const argsInString = args.join(' ');
    actualCommand += ' ' + argsInString;

    console.log(`${utils.getTime()} Executing script: ${command}.`);
    console.log(`${utils.getTime()} Executing command: ${actualCommand}`);
    const proc = childProcess.spawn(
        actualCommand, 
        [], 
        {
            env: process.env,
            cwd: path.resolve(__dirname, '../'), // redirect the cwd to the root of nota
            shell: true,
        },
    );

    proc.stdout.on('data', (output) => {
        process.stdout.write(output);
    });
      
    proc.stderr.on('error', (error) => {
        process.stderr.write(error);
    });
    
    proc.on('close', (code) => {
        if (code) {
            process.stderr.write(`${utils.getTime(utils.c.FgRed)} script exits with error code ${code}.\n`);
            process.exit(code);
        } else {
            process.exit(0);
        }
    });
}

// #endregion