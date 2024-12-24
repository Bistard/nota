/**
 * # Command Line Interface Documentation (CLI Doc)
 * 
 * This script can be invoked from `package.json`.
 * 
 * The script acts like a central management that can access all the pre-defined
 * scripts. The script configurations can be found at {@link SCRIPT_CONFIG_PATH}.
 */
const path = require("path");
const { Colors, ScriptProcess, log } = require('./utility');

/**
 * @typedef {import('./script.config.js').ScriptConfiguration} ScriptConfigurationType
 */

const SCRIPT_CONFIG_PATH = './script.config.js';
const USAGE = `
Usage: npm run script <command> [--] [options]

    Execute a script command with optional arguments. Available commands include running specific scripts, listing all available scripts, and displaying this help message.

Commands:
    <command>    Execute the specified script with optional arguments.
    list         Display a list of all available scripts.
    help         Show this usage information.

Examples:
    npm run script help               Display this usage information.
    npm run script list               List all available scripts.
    npm run script start -- -a --arg1 Optional arguments can be passed after the '--'.

Note:
    Use '--' before specifying any arguments to ensure they are correctly passed to the script.
`;
const HELP_STRING = `Help Guide:

- To execute a specific script along with any optional arguments, use the following format:
    npm run script <command> [--] [options]

- To view all available scripts and understand their purpose, run:
    npm run script list

- For a summary of usage commands and examples, use:
    npm run script help

Feel free to append '--' before any options to ensure they are passed correctly to the script.
`;
const INVALID_SCRIPT_COMMAND = `Error: The script command you entered is not recognized or improperly formatted.

Quick Tips:
- Ensure the command follows the structure: npm run script <command> [--] [options]
- For a list of available commands, run: npm run script list
- For further assistance, refer to: npm run script help
`;

(async function () {
    
    // Read script configuration
    const scriptConfig = require(SCRIPT_CONFIG_PATH);

    // try interpret CLI
    const cliArgs = process.argv.slice(2);
    const [cmd, args] = validateCLI(cliArgs);

    // actual execution
    if (cmd === 'help') {
        executeHelp();
    } 
    else if (cmd === 'list') {
        executeList(scriptConfig);
    }
    else {
        executeScript(cmd, args, scriptConfig);
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
        log('error', `Invalid Script Command\n${INVALID_SCRIPT_COMMAND}`);
        process.exit(1);
    }
    return [command, args.slice(1)];
}

function executeHelp() {
    console.log(USAGE);
}

/**
 * @param {ScriptConfigurationType} configuration 
 */
function executeList(configuration) {
    console.log(`${'[command]'.padStart(10, ' ')}`);
    
    for (const [cmdName, config] of Object.entries(configuration)) {
        
        const { _command, description, options } = config;
        const coloredName = Colors.green(config.commandDescription ?? cmdName);
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
 * @param {string} script 
 * @param {string[]} args 
 * @param {ScriptConfigurationType} configurations
 */
function executeScript(script, args, configurations) {

    // validate the corresponding script configuration
    const config = configurations[script];
    if (!config) {
        console.log(`Invalid script '${script}'. ${HELP_STRING}.`);
        process.exit(1);
    }

    const proc = new ScriptProcess(script, config.command, args, [], {
        env: process.env,
        cwd: path.resolve(__dirname, '../'), // redirect the cwd to the root directory
        shell: true,

        // inherits the stdin / stdout / stderr
        stdio: "inherit",
    });

    proc.waiting()
    .then(code => {
        process.exit(code);
    })
    .catch(error => {
        log('error', `Executing script "${script}" encounters error: ${JSON.stringify(error)}`);
        process.exit(1);
    })
}

// #endregion