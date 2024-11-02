import type { IpcRenderer } from "electron";
import type { Mutable } from "src/base/common/utilities/type";
import type { ISandboxProcess } from "src/platform/electron/common/electronType";
import type { IWindowConfiguration } from "src/platform/window/common/window";
import { executeOnce } from "src/base/common/utilities/function";
import { panic } from "src/base/common/utilities/panic";

/**
 * Expose APIs from the main process at `preload.js`.
 * 
 * // REVIEW: perf - we may load all the files that renderer required at later time.
 * Since we are loading every files in the beginning of the application, thus
 * we cannot access the properties of `GLOBAL.nota` since `preload.js` have not
 * been loaded and expose the APIs yet.
 * 
 * The trick to fix this is by using a init function.
 */

/**
 * {@link window}: The object represents an open window in a browser. It may be
 * undefined once the code is not running within a browser, such as, via command
 * line script.
 * 
 * {@link global} Scripts running under Node.js have an object called global as 
 * their global object. It may be undefined once the Node.js is not accessible
 * in the current environment.
 */

/**
 * An alias for {@link self} or {@link global} if window is undefined.
 */
export const GLOBAL: any = (
    typeof self === 'object' ?
        self :
        (typeof global === 'object' ?
            global :
            {}
        )
);

export const ipcRenderer: IpcRenderer = <any>{};
export const process: Mutable<ISandboxProcess> = <any>{};
export const WIN_CONFIGURATION: IWindowConfiguration = <any>{};

/**
 * @description Once renderer process starts, we need to retrieve the APIs that
 * are exposed through the `preload.js`.
 */
export const initExposedElectronAPIs = executeOnce(function () {
    if (typeof GLOBAL === 'object') {
        (<Mutable<IpcRenderer>>ipcRenderer) = GLOBAL.nota.ipcRenderer;
        (<Mutable<ISandboxProcess>>process) = GLOBAL.nota.process;
        (<Mutable<IWindowConfiguration>>WIN_CONFIGURATION) = GLOBAL.nota.WIN_CONFIGURATION;
    } else {
        panic('Cannot init exposed electron APIs');
    }
});