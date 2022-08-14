import { IpcRenderer } from "electron";
import { Mutable } from "src/base/common/util/type";
import { ISandboxProcess } from "src/code/platform/electron/common/electronType";

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
 * their global object. It may be undefined once the Node.js is not accessable
 * in the current envrioment.
 */

/**
 * An alias for {@link window} or {@link global} if window is undefined.
 */
export const GLOBAL: any = (
    typeof window === 'object' ? 
        window : 
        (typeof global === 'object' ? 
            global : 
            {}
        )
);

export const ipcRenderer: IpcRenderer = <any>{};
export const process: Mutable<ISandboxProcess> = <any>{};

/**
 * @description Once renderer process starts, we need to retrieve the APIs that
 * are exposed through the `preload.js`.
 */
export function initExposedElectronAPIs(): void {
    if (typeof window === 'object') {
        GLOBAL.nota = (<any>window).nota;
    }

    (<Mutable<IpcRenderer>>ipcRenderer) = GLOBAL.nota.ipcRenderer;
    (<Mutable<ISandboxProcess>>process) = GLOBAL.nota.process;
}
