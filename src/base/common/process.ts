import { GLOBAL, INodeProcess, IS_MAC, IS_WINDOWS } from "src/base/common/platform";

declare const process: INodeProcess;
type ISafeProcess = Omit<INodeProcess, 'arch'> & { arch: string | undefined };

const safeProcess = function () {
    let _process: ISafeProcess;

    // Native sandbox environment
    if (typeof GLOBAL.vscode !== 'undefined' && typeof GLOBAL.vscode.process !== 'undefined') {
        const sandboxProcess: INodeProcess = GLOBAL.vscode.process;
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
            cwd() { return process.env['VSCODE_CWD'] || process.cwd(); }
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
}();

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
