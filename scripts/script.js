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
 * @typedef {import('./script.config.js').ScriptConfiguration} ScriptConfiguration
 */

const SCRIPT_CONFIG_PATH = './script.config.js';

const USAGE = `
usage: npm run script (<command> | list | help) [--] [<argument>...]
    
    Run 'npm run script list' to see all the valid srcipts.

    eg. npm run script help
        npm run script list
        npm run script start -- -a --arg1 --arg2=arg3
`;
const HELP_STRING = `To see a list of valid scripts, run:
    npm run script help
`;
const INVALID_SCRIPT_COMMAND = `Invalid script command format. Please follow: ${USAGE}.`;

(async function () {
    
    // Read script configuration
    const scriptConfiguraion = require(SCRIPT_CONFIG_PATH);

    // try interpret CLI
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
        process.stderr.write(`${utils.getTime(utils.c.FgRed)} ${INVALID_SCRIPT_COMMAND}`);
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
    console.log(`${'[command]'.padStart(10, ' ')}`);
    
    for (const [cmdName, config] of Object.entries(configuration)) {
        
        const { _command, description, options } = config;
        const coloredName = utils.color(utils.c.FgGreen, config.commandDescription ?? cmdName);
        console.log(coloredName);
        console.log(description);
        
        if (!options) {
            continue;
        }
        
        for (const opt of options) {
            console.log(`${''.padEnd(6, ' ')}${opt.flags.join(', ')}`);
            for (const desc of opt.descriptions) {
                console.log(`${''.padEnd(10, ' ')}${desc}`);
            }
        }
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

    console.log(`${utils.getTime()} Executing script: ${command}`);
    console.log(`${utils.getTime()} Executing command: ${actualCommand}`);
    const proc = childProcess.spawn(
        actualCommand, 
        [], 
        {
            env: process.env,
            cwd: path.resolve(__dirname, '../'), // redirect the cwd to the root of nota
            shell: true,

            // inherits the stdin / stdout / stderr
            stdio: "inherit",
        },
    );

    proc.on('close', (code) => {
        if (code) {
            process.stderr.write(`${utils.getTime(utils.c.FgRed)} The script '${command}' exits with error code ${code}.\n`);
            process.exit(code);
        } else {
            process.exit(0);
        }
    });
}

// #endregion