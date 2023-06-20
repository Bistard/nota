import { IMicroService } from "src/code/platform/instantiation/common/decorator";

export interface IDialogService extends IMicroService {
    showOpenDialog(opts: Electron.OpenDialogOptions, window?: Electron.BrowserWindow): Promise<Electron.OpenDialogReturnValue>;
    showSaveDialog(opts: Electron.SaveDialogOptions, window?: Electron.BrowserWindow): Promise<Electron.SaveDialogReturnValue>;
    showMessageBox(opts: Electron.MessageBoxOptions, window?: Electron.BrowserWindow): Promise<Electron.MessageBoxReturnValue>;

    openFileDialog(opts: OpenDialogOptions, window?: Electron.BrowserWindow): Promise<string[]>;
    openDirectoryDialog(opts: OpenDialogOptions, window?: Electron.BrowserWindow): Promise<string[]>;
    openFileOrDirectoryDialog(opts: OpenDialogOptions, window?: Electron.BrowserWindow): Promise<string[]>;
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