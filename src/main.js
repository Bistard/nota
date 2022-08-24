const { app } = require('electron');
const minimist = require('minimist');
const { perf } = require('src/base/common/performance');
const { parseCLIArgv } = require('src/code/platform/environment/common/argument');

/**
 * The real first entry of the main process. It does not responsible for any 
 * business handling of the application, instead of just doing some preparation.
 * 
 * @typedef {import("./code/platform/environment/common/argument").ICLIArguments} ICLIArguments
 */

/** @type ICLIArguments */
const CLIArgv = minimist(parseCLIArgv(app.isPackaged));

app.whenReady().then(() => run());

function run() {
    perf('main bundle loading start');
    const nota = require('./code/electron/main');
    perf('main bundle loading end');
    nota.default.start(CLIArgv);
}
