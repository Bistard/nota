import { app, BrowserWindow } from "electron";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { Event, NodeEventEmitter } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { memoize } from "src/base/common/memoization";
import { OpenDialogOptions } from "src/code/platform/dialog/common/dialog";
import { IMainDialogService } from "src/code/platform/dialog/electron/mainDialogService";
import { IHostService } from "src/code/platform/host/common/hostService";
import { IpcChannel } from "src/code/platform/ipc/common/channel";
import { StatusKey } from "src/code/platform/status/common/status";
import { IMainStatusService } from "src/code/platform/status/electron/mainStatusService";
import { IMainWindowService } from "src/code/platform/window/electron/mainWindowService";
import { IWindowInstance } from "src/code/platform/window/electron/windowInstance";

/**
 * An interface only for {@link MainHostService}.
 */
export interface IMainHostService extends IHostService, IDisposable {}

/**
 * @class // TODO
 */
export class MainHostService extends Disposable implements IMainHostService {

    // [event]
    
    private readonly _onDidMaximizeWindow = this.__register(new NodeEventEmitter(app, IpcChannel.WindowMaximized, (_e, window: BrowserWindow) => window.id));
    public readonly onDidMaximizeWindow = this._onDidMaximizeWindow.registerListener;

    private readonly _onDidUnmaximizeWindow = this.__register(new NodeEventEmitter(app, IpcChannel.WindowUnmaximized, (_e, window: BrowserWindow) => window.id));
    public readonly onDidUnmaximizeWindow = this._onDidUnmaximizeWindow.registerListener;

    private readonly _onDidFocusWindow = this.__register(new NodeEventEmitter(app, IpcChannel.WindowFocused, (_e, window: BrowserWindow) => window.id));
	public readonly onDidFocusWindow = this._onDidFocusWindow.registerListener;
	
    private readonly _onDidBlurWindow = this.__register(new NodeEventEmitter(app, IpcChannel.WindowBlured, (_e, window: BrowserWindow) => window.id));
	public readonly onDidBlurWindow = this._onDidBlurWindow.registerListener;

    @memoize
    public get onDidOpenWindow() { return Event.map(this.windowService.onDidOpenWindow, (window: IWindowInstance) => window.id); }

    // [constructor]

    constructor(
        @IMainWindowService private readonly windowService: IMainWindowService,
        @IMainDialogService private readonly dialogService: IMainDialogService,
        @IMainStatusService private readonly statusService: IMainStatusService,
    ) {
        super();
    }

    // [public methods]

    public async focusWindow(id?: number): Promise<void> {
		const window = this.__tryGetWindow(id);
		window?.browserWindow.focus();
	}

    public async maximizeWindow(id?: number): Promise<void> {
        const window = this.__tryGetWindow(id);
        window?.browserWindow.maximize();
    }

    public async minimizeWindow(id?: number): Promise<void> {
        const window = this.__tryGetWindow(id);
        window?.browserWindow.minimize();
    }

    public async unmaximizeWindow(id?: number): Promise<void> {
        const window = this.__tryGetWindow(id);
        window?.browserWindow.unmaximize();
    }

    public async toggleMaximizeWindow(id?: number): Promise<void> {
        const window = this.__tryGetWindow(id);
        if (window) {
            if (window.browserWindow.isMaximized()) {
                window.browserWindow.unmaximize();
            } else {
                window.browserWindow.maximize();
            }
        }
    }

    public async toggleFullScreenWindow(id?: number): Promise<void> {
        const window = this.__tryGetWindow(id);
        window?.toggleFullScreen();
    }

    public async closeWindow(id?: number): Promise<void> {
        const window = this.__tryGetWindow(id);
        window?.browserWindow.close();
    }

    public async showOpenDialog(opts: Electron.OpenDialogOptions, windowID?: number): Promise<Electron.OpenDialogReturnValue> {
        const browserWindow = this.__tryGetWindow(windowID)?.browserWindow;
        return this.dialogService.showOpenDialog(opts, browserWindow);
    }
    
    public async showSaveDialog(opts: Electron.SaveDialogOptions, windowID?: number): Promise<Electron.SaveDialogReturnValue> {
        const browserWindow = this.__tryGetWindow(windowID)?.browserWindow;
        return this.dialogService.showSaveDialog(opts, browserWindow);
    }
    
    public async showMessageBox(opts: Electron.MessageBoxOptions, windowID?: number): Promise<Electron.MessageBoxReturnValue> {
        const browserWindow = this.__tryGetWindow(windowID)?.browserWindow;
        return this.dialogService.showMessageBox(opts, browserWindow);
    }

    public async openFileDialogAndOpen(opts: OpenDialogOptions, windowID?: number): Promise<void> {
        return this.__openDialogAndOpen(opts, windowID);
    }
    
    public async openDirectoryDialogAndOpen(opts: OpenDialogOptions, windowID?: number): Promise<void> {
        return this.__openDialogAndOpen(opts, windowID);
    }
    
    public async openFileOrDirectoryDialogAndOpen(opts: OpenDialogOptions, windowID?: number): Promise<void> {
        return this.__openDialogAndOpen(opts, windowID);
    }

    public async openDevTools(opts?: Electron.OpenDevToolsOptions, id?: number): Promise<void> {
        const window = this.__tryGetWindow(id);
        window?.browserWindow.webContents.openDevTools(opts);
    }

    public async closeDevTools(id?: number): Promise<void> {
        const window = this.__tryGetWindow(id);
        window?.browserWindow.webContents.closeDevTools();
    }
    
    public async toggleDevTools(id?: number): Promise<void> {
        const window = this.__tryGetWindow(id);
        window?.browserWindow.webContents.toggleDevTools();
    }

    public async reloadWebPage(id?: number): Promise<void> {
        const window = this.__tryGetWindow(id);
        window?.browserWindow.webContents.reload();
    }

    public async setApplicationStatus(key: StatusKey, val: any): Promise<void> {
        return this.statusService.set(key, val);
    }

    public async setApplicationStatusLot(items: readonly { key: StatusKey, val: any }[]): Promise<void> {
        return this.statusService.setLot(items);
    }

    public async deleteApplicationStatus(key: StatusKey): Promise<boolean> {
        return this.statusService.delete(key);
    }

    // [private helper methods]

    private __tryGetWindow(id?: number): IWindowInstance | undefined {
        if (typeof id === 'undefined') {
            return undefined;
        }
        return this.windowService.getWindowByID(id);
    }

    private async __openDialogAndOpen(opts: OpenDialogOptions, windowID?: number): Promise<void> {
        const browserWindow = this.__tryGetWindow(windowID)?.browserWindow;
        const picked = await this.dialogService.openFileDialog(opts, browserWindow);
        const uriToOpen = picked.map(path => URI.fromFile(path));
        this.__openPicked(uriToOpen, windowID, opts);
    }

    private __openPicked(uriToOpen: URI[], windowID: number | undefined, opts: OpenDialogOptions): void {
        this.windowService.open({
            uriToOpen: uriToOpen,
            forceNewWindow: opts.forceNewWindow,
            hostWindowID: windowID,
        });
    }
}