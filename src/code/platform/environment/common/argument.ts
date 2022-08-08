
/*******************************************************************************
 * This file contains helper functions for parsing command line arguments that 
 * passed by CLI (Command Line Interface). Such as `process.argv` and so on.
 ******************************************************************************/

export interface ICLIArguments {
    [key: string]: any;
}

/**
 * @description Handling process.argv when running code through electron.
 */
export function parseCLIArgv(isPackaged: boolean): string[] {
    /**
     * process.argv:
     * The first element is {@link process.execPath}:
     *      process.argv[0] == "/usr/local/bin/node"
     * The second element is the path to the js file being executed.
     *      process.argv[1] == "/Users/mjr/work/node/process-args.js"
     */
    if (isPackaged) {
        return process.argv.slice(1);
    } else {
        return process.argv.slice(2);
    }
}

