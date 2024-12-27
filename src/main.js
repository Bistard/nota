const { app, Menu } = require('electron');
const minimist = require('minimist');
const { perf } = require('src/base/common/performance');
const { parseCLIArgv } = require('src/platform/environment/common/argument');

/**
 * The real first entry of the main process. It does not responsible for any 
 * business handling of the application, instead of just doing some preparation.
 */

(async function main() {
    /**
     * @typedef {import("./platform/environment/common/argument").ICLIArguments} ICLIArguments
     */

    /** 
     * Parse command arguments.
     * @type ICLIArguments 
     */
    const CLIArgv = minimist(parseCLIArgv(app.isPackaged));

    /**
     * Enables full sandbox mode on the app. This means that all renderers will 
     * be launched sandboxed, regardless of the value of the sandbox flag in 
     * WebPreferences.
     * @note This method can only be called before app is ready.
     */
    app.enableSandbox();

    /**
     * Disable default menu for performance issue (save around 10ms).
     * @see https://github.com/electron/electron/issues/35512
     */
    Menu.setApplicationMenu(null);

    /**
     * Runs the program when ready.
     */
    await app.whenReady();
    
    try {
        perf('main bundle loading start');
        const application = require('./code/electron/main');
        perf('main bundle loading end');
        
        // run program
        application.default.start(CLIArgv);
    } 
    catch (error) {
        console.error(error);
    }
})();