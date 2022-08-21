import { OpenDialogOptions } from "electron";
import { Register } from "src/base/common/event";

export interface IHostService {
    
    readonly onDidMaximizeWindow: Register<number>;
    readonly onDidUnmaximizeWindow: Register<number>;
    readonly onDidFocusWindow: Register<number>;
    readonly onDidBlurWindow: Register<number>;

    focusWindow(id: number): Promise<void>;
    maximizeWindow(id: number): Promise<void>;
    minimizeWindow(id: number): Promise<void>;
    unmaximizeWindow(id: number): Promise<void>;
    toggleFullScreenWindow(id: number): Promise<void>;

    showOpenDialog(opts: Electron.OpenDialogOptions, windowID?: number): Promise<Electron.OpenDialogReturnValue>;
    showSaveDialog(opts: Electron.SaveDialogOptions, windowID?: number): Promise<Electron.SaveDialogReturnValue>;
    showMessageBox(opts: Electron.MessageBoxOptions, windowID?: number): Promise<Electron.MessageBoxReturnValue>;
    openFileDialogAndOpen(opts: OpenDialogOptions, windowID: number): Promise<void>;
    openDirectoryDialogAndOpen(opts: OpenDialogOptions, windowID: number): Promise<void>;
    openFileOrDirectoryDialogAndOpen(opts: OpenDialogOptions, windowID: number): Promise<void>;
}