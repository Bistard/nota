import { BrowserWindow } from "electron";

export interface IDialogService {
    showOpenDialog(opts: Electron.OpenDialogOptions, window?: BrowserWindow): Promise<Electron.OpenDialogReturnValue>;
    showSaveDialog(opts: Electron.SaveDialogOptions, window?: BrowserWindow): Promise<Electron.SaveDialogReturnValue>;
    showMessageBox(opts: Electron.MessageBoxOptions, window?: BrowserWindow): Promise<Electron.MessageBoxReturnValue>;

    openFileDialog(opts: OpenDialogOptions, window?: BrowserWindow): Promise<string[]>;
    openDirectoryDialog(opts: OpenDialogOptions, window?: BrowserWindow): Promise<string[]>;
    openFileOrDirectoryDialog(opts: OpenDialogOptions, window?: BrowserWindow): Promise<string[]>;
}

export interface OpenDialogOptions {
    readonly title: string;
    readonly buttonLabel?: string;
    readonly defaultPath?: string;
    readonly forceNewWindow?: boolean;
}

/**
 * SHOULD NOT BE USED DIRECTLY.
 */
export interface InternalOpenDialogOptions extends OpenDialogOptions {
    readonly openFile?: boolean;
    readonly openDirectory?: boolean;
}