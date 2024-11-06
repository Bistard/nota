import type { IpcRenderer } from "electron";
import type { Mutable } from "src/base/common/utilities/type";
import type { ISandboxProcess, IWebFrame } from "src/platform/electron/common/electronType";
import type { IWindowConfiguration } from "src/platform/window/common/window";
import { executeOnce } from "src/base/common/utilities/function";

/**
 * Expose APIs from the main process at `preload.js`.
 * 
 * // REVIEW: perf - we may load all the files that renderer required at later time.
 * Since we are loading every files in the beginning of the application, thus
 * we cannot access the properties of `globalThis.nota` since `preload.js` have not
 * been loaded and expose the APIs yet.
 * 
 * The trick to fix this is by using a init function.
 */

export const ipcRenderer: IpcRenderer = <any>{};
export const process: ISandboxProcess = <any>{};
export const webFrame: IWebFrame = <any>{};
export const WIN_CONFIGURATION: IWindowConfiguration = <any>{};

/**
 * @description Once renderer process starts, we need to retrieve the APIs that
 * are exposed through the `preload.js`.
 */
export const initExposedElectronAPIs = executeOnce(function () {
    (<Mutable<IpcRenderer>>ipcRenderer) = globalThis.nota.ipcRenderer;
    (<Mutable<ISandboxProcess>>process) = globalThis.nota.process;
    (<Mutable<IWebFrame>>webFrame) = globalThis.nota.webFrame;
    (<Mutable<IWindowConfiguration>>WIN_CONFIGURATION) = globalThis.nota.WIN_CONFIGURATION;
});