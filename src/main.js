const { app } = require('electron');
const minimist = require('minimist');
const { parseCLIArgv } = require('src/code/platform/environment/common/argument');

/**
 * @typedef {import("./code/platform/environment/common/argument").ICLIArguments} ICLIArguments
 */

/** @type ICLIArguments */
const CLIArgv = minimist(parseCLIArgv(app.isPackaged));

// we wait for electron initialization
app.once('ready', () => {
    run();
});

function run() {
    const nota = require('./code/electron/main');
    nota.default.start(CLIArgv);
}
