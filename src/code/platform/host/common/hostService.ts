import { OpenDialogOptions } from "electron";
import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { getUUID } from "src/base/node/uuid";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";
import { SafeIpcMain } from "src/code/platform/ipc/electron/safeIpcMain";

export const IHostService = createDecorator<IHostService>('host-service');

export interface IHostService {
    
    readonly onDidMaximizeWindow: Register<number>;
    readonly onDidUnmaximizeWindow: Register<number>;
    readonly onDidFocusWindow: Register<number>;
    readonly onDidBlurWindow: Register<number>;
    readonly onDidOpenWindow: Register<number>;

    focusWindow(id?: number): Promise<void>;
    maximizeWindow(id?: number): Promise<void>;
    minimizeWindow(id?: number): Promise<void>;
    unmaximizeWindow(id?: number): Promise<void>;
    toggleFullScreenWindow(id?: number): Promise<void>;
    closeWindow(id?: number): Promise<void>;

    showOpenDialog(opts: Electron.OpenDialogOptions, id?: number): Promise<Electron.OpenDialogReturnValue>;
    showSaveDialog(opts: Electron.SaveDialogOptions, id?: number): Promise<Electron.SaveDialogReturnValue>;
    showMessageBox(opts: Electron.MessageBoxOptions, id?: number): Promise<Electron.MessageBoxReturnValue>;
    openFileDialogAndOpen(opts: OpenDialogOptions, id?: number): Promise<void>;
    openDirectoryDialogAndOpen(opts: OpenDialogOptions, id?: number): Promise<void>;
    openFileOrDirectoryDialogAndOpen(opts: OpenDialogOptions, id?: number): Promise<void>;

    openDevTools(options?: Electron.OpenDevToolsOptions, id?: number): Promise<void>;
	toggleDevTools(id?: number): Promise<void>;
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

/**
 * @description A helper function to help renderer process can have access to
 * and only to the specified data.
 * @returns a {@link IIpcAccessible} object.
 */
export function createIpcAccessible<T>(): IIpcAccessible<T> {
    let data: T;
    let disposed = false;
    const resource = `nota:${getUUID()}`;
    SafeIpcMain.instance.handle(resource, async () => data);

    return {
        resource: resource,
        updateData: (newData: T) => data = newData,
        dispose: () => {
            if (disposed) {
                return;
            }
            SafeIpcMain.instance.removeHandler(resource);
            disposed = true;
        },
    };
}