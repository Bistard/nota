import { IService } from "src/platform/instantiation/common/decorator";

export interface IDialogService extends IService {
    showOpenDialog(opts: Electron.OpenDialogOptions, window?: Electron.BrowserWindow): Promise<Electron.OpenDialogReturnValue>;
    showSaveDialog(opts: Electron.SaveDialogOptions, window?: Electron.BrowserWindow): Promise<Electron.SaveDialogReturnValue>;
    showMessageBox(opts: Electron.MessageBoxOptions, window?: Electron.BrowserWindow): Promise<Electron.MessageBoxReturnValue>;

    openFileDialog(opts: IOpenDialogOptions, window?: Electron.BrowserWindow): Promise<string[]>;
    openDirectoryDialog(opts: IOpenDialogOptions, window?: Electron.BrowserWindow): Promise<string[]>;
    openFileOrDirectoryDialog(opts: IOpenDialogOptions, window?: Electron.BrowserWindow): Promise<string[]>;
}

export interface IOpenDialogOptions {
    readonly title: string;
    readonly buttonLabel?: string;
    readonly defaultPath?: string;
    readonly forceNewWindow?: boolean;
}

/**
 * SHOULD NOT BE USED DIRECTLY.
 */
export interface IInternalOpenDialogOptions extends IOpenDialogOptions {
    readonly openFile?: boolean;
    readonly openDirectory?: boolean;
}