import { IS_MAC, IS_WINDOWS } from "src/base/common/platform";
import { GLOBAL } from "src/code/platform/electron/browser/global";

/**
 * This interface is intentionally not identical to node.js process because it 
 * also works in sandboxed environments where the process object is implemented 
 * differently.
 */
export interface INodeProcess {
	platform: string;
	arch: string;
	env: IProcessEnvironment;
	versions?: {
		electron?: string;
	};
	type?: string;
	cwd: () => string;
}

/**
 * The `process.env` property returns an object containing the user environment.
 * See [`environ(7)`](http://man7.org/linux/man-pages/man7/environ.7.html).
 *
 * An example of this object looks like:
 * @example
 * ```js
 * {
 *   TERM: 'xterm-256color',
 *   SHELL: '/usr/local/bin/bash',
 *   USER: 'maciej',
 *   PATH: '~/.bin/:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin',
 *   PWD: '/Users/maciej',
 *   EDITOR: 'vim',
 *   SHLVL: '1',
 *   HOME: '/Users/maciej',
 *   LOGNAME: 'maciej',
 *   _: '/usr/local/bin/node'
 * }
 * ```
 * 
 * @note On Windows operating systems, environment variables are case-insensitive.
 */
export interface IProcessEnvironment {
	[key: string]: string | undefined;
}

declare const process: INodeProcess;
type ISafeProcess = Omit<INodeProcess, 'arch'> & { arch: string | undefined };

const safeProcess = (function () {
    let _process: ISafeProcess;

    // Native sandbox environment
    if (typeof GLOBAL.nota !== 'undefined' && typeof GLOBAL.nota.process !== 'undefined') {
        const sandboxProcess: INodeProcess = GLOBAL.nota.process;
        _process = {
            get platform() { return sandboxProcess.platform; },
            get arch() { return sandboxProcess.arch; },
            get env() { return sandboxProcess.env; },
            cwd() { return sandboxProcess.cwd(); }
        };
    }
    // Native node.js environment
    else if (typeof process !== 'undefined') {
        _process = {
            get platform() { return process.platform; },
            get arch() { return process.arch; },
            get env() { return process.env; },
            cwd() { return process.env['NOTA_CWD'] || process.cwd(); }
        };
    }
    // Web environment
    else {
        _process = {
            // Supported
            get platform() { return IS_WINDOWS ? 'win32' : IS_MAC ? 'darwin' : 'linux'; },
            get arch() { return undefined; /* arch is undefined in web */ },
            // Unsupported
            get env() { return {}; },
            cwd() { return '/'; }
        };
    }

    return process;
})();

/**
 * @namespace SafeProcess A safety way to access data from `process` variable.
 */
export namespace SafeProcess {
    /** @note In web, this property is hardcoded to be `/`. */
    export const cwd = safeProcess.cwd;
    /** @note In web, this property is hardcoded to be `{}`. */
    export const env = safeProcess.env;
    /** @note In web, `arch` is `undefined`. */
    export const arch = safeProcess.arch;
    export const platform = safeProcess.platform;    
}
