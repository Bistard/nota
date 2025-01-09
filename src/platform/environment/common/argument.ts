
/*******************************************************************************
 * This file contains helper functions for parsing command line arguments that 
 * passed by CLI (Command Line Interface). Such as `process.argv` and so on.
 ******************************************************************************/

/**
 * An interface that represents the argument that is passed through CLI.
 * @example
 * ```bash
 * electron . "--log=trace" "--mode=dev"
 * // This will be parse as `{ log: 'trace', mode: 'dev' }`.
 * ```
 * @note The parsing process is done by `minimist`.
 */
export interface ICLIArguments {

    /**
     * Contains all the arguments that didn't have an option associated with them.
     */
    _: string[];

    /**
     * The log level when the application is on development mode.
     * @default log 'info'
     */
    log?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

    /**
     * If open development tools when creating a window.
     */
    'open-devtools'?: boolean;

    /**
     * Enable debug inspector will pop up a new window that tracks variable
     * changes.
     */
    inspector?: true | 'true';

    /**
     * Print warnings whenever a listener is GC'ed without having been disposed. 
     * It means a memory LEAK.
     */
    listenerGCedWarning?: boolean;

    /**
     * Print warnings (after the first 5 seconds) whenever a `IDisposable` is 
     * either:
     *  - not disposed
     *  - not bound to a parent IDisposable
     * we log the original stack trace to indicate a possible leaking disposable.
     * 
     * It only means **POTENTIAL** memory leak.
     */
    disposableLeakWarning?: boolean;
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

