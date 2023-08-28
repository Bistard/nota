const childProcess = require("child_process");
const fs = require('fs');
const path = require('path');

(async function () {

    const cliArgs = process.argv.slice(2);
    const configurationPath = './scripts/tests/mochapack.json';
    const command = await buildCommandFromConfiguration('mochapack', cliArgs, configurationPath);

    console.log(`Executing command: ${command}`);

    const proc = childProcess.spawn(
        command, 
        [], 
        {
            env: process.env,
            cwd: process.cwd(), // redirect the cwd to the root of the program
            shell: true,

            // inherits the stdin / stdout / stderr
            stdio: "inherit",
        },
    );
})();

async function buildCommandFromConfiguration(rawCommand, cliArgs, configurationPath) {

    // read configuration
    let configuration;
    try {
        configuration = await fs.promises.readFile(configurationPath);
    } catch (err) {
        throw new Error(`[MochaRunner] cannot read mochapack configuration at '${configurationPath}'.`);
    }

    try {
        configuration = JSON.parse(configuration);
    } catch (err) {
        throw new Error(`[MochaRunner] cannot parse mochapack configuration properly: ${err}.`);
    }

    for (const [key, value] of Object.entries(configuration)) {
        if (typeof value === 'boolean') {
            if (value === true) {
                rawCommand += ` --${key}`;
            }
        } else {
            rawCommand += ` --${key} ${value}`;
        }
    }

    rawCommand += ' ' + cliArgs.join(' ');
    return rawCommand;
}