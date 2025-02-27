import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { DeepPartial, Dictionary } from "src/base/common/utilities/type";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { StatusKey } from "src/platform/status/common/status";
import { IWindowCreationOptions } from "src/platform/window/common/window";

export const IHostService = createService<IHostService>('host-service');

/**
 * @description {@link IHostService} exists in the following processes:
 *      1. main process
 *      2. renderer process
 * @note If you are calling the methods from the renderer-side, you do not need
 *       to provide the last parameter `id: string`. It will be provided 
 *       automatically.
 */
export interface IHostService extends IService {

    // [window-instance]
    readonly onDidMaximizeWindow: Register<number>;
    readonly onDidUnMaximizeWindow: Register<number>;
    readonly onDidFocusWindow: Register<number>;
    readonly onDidBlurWindow: Register<number>;
    readonly onDidOpenWindow: Register<number>;
    readonly onDidEnterFullScreenWindow: Register<number>;
    readonly onDidLeaveFullScreenWindow: Register<number>;

    // [window-service]
    setWindowAsRendererReady(id?: number): Promise<void>;
    focusWindow(id?: number): Promise<void>;
    maximizeWindow(id?: number): Promise<void>;
    minimizeWindow(id?: number): Promise<void>;
    unMaximizeWindow(id?: number): Promise<void>;
    toggleMaximizeWindow(id?: number): Promise<void>;
    toggleFullScreenWindow(id?: number): Promise<void>;
    /**
     * @description Call this function to close the window (renderer proc) with
     * the given ID.
     */
    closeWindow(id?: number): Promise<void>;
    /**
     * @description Call this function if you want to only reload the web 
     * content of the window. This will not destroy the window.
     * @param optionalConfiguration An optional configuration that overrides
     *                              the initial window configuration when 
     *                              constructing the window.
     */
    reloadWindow(optionalConfiguration: DeepPartial<IWindowCreationOptions>, id?: number): Promise<void>;

    // [dialog-service]
    showOpenDialog(opts: Electron.OpenDialogOptions, id?: number): Promise<Electron.OpenDialogReturnValue>;
    showSaveDialog(opts: Electron.SaveDialogOptions, id?: number): Promise<Electron.SaveDialogReturnValue>;
    showMessageBox(opts: Electron.MessageBoxOptions, id?: number): Promise<Electron.MessageBoxReturnValue>;
    openFileDialogAndOpen(opts: Electron.OpenDialogOptions, id?: number): Promise<void>;
    openDirectoryDialogAndOpen(opts: Electron.OpenDialogOptions, id?: number): Promise<void>;
    openFileOrDirectoryDialogAndOpen(opts: Electron.OpenDialogOptions, id?: number): Promise<void>;

    // [dev-tools]
    openDevTools(options?: Electron.OpenDevToolsOptions, id?: number): Promise<void>;
    closeDevTools(id?: number): Promise<void>;
    toggleDevTools(id?: number): Promise<void>;
    reloadWebPage(id?: number): Promise<void>;
    toggleInspectorWindow(id?: number): Promise<void>;

    // [status-service (THOSE FUNCTIONS MIGHT THROW WHEN FAILED)]
    getApplicationStatus<T>(key: StatusKey): Promise<T | undefined>;
    setApplicationStatus(key: StatusKey, val: any): Promise<void>;
    setApplicationStatusLot(items: readonly { key: StatusKey, val: any; }[]): Promise<void>;
    deleteApplicationStatus(key: StatusKey): Promise<boolean>;
    getAllApplicationStatus(): Promise<Dictionary<string, any>>;

    // [OS]
    /**
     * @description Reveals the target (file or folder) with given path in the 
     * File Explorer/Finder.
     * @param path The path of the target.
     */
    showItemInFolder(path: string): Promise<void>;
}

export interface IIpcAccessible<T> extends IDisposable {
    /**
     * A string that a renderer process can use it to access the object in main 
     * process via `ipcRenderer.invoke(resource)`.
     */
    readonly resource: string;

    /**
     * A method used in main process to update the data to be returned after a
     * {@link IIpcAccessible} has been created.
     */
    updateData(data: T): void;

    /**
     * Make the resource unaccessible.
     */
    dispose(): void;
}