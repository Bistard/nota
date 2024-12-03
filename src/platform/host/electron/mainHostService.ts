import type { IWindowInstance } from "src/platform/window/electron/windowInstance";
import { app, BrowserWindow, shell } from "electron";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { Event, NodeEventEmitter } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { memoize } from "src/base/common/memoization";
import { IOpenDialogOptions } from "src/platform/dialog/common/dialog";
import { IMainDialogService } from "src/platform/dialog/electron/mainDialogService";
import { IHostService } from "src/platform/host/common/hostService";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { StatusKey } from "src/platform/status/common/status";
import { IMainStatusService } from "src/platform/status/electron/mainStatusService";
import { IMainWindowService } from "src/platform/window/electron/mainWindowService";

/**
 * An interface only for {@link MainHostService}.
 */
export interface IMainHostService extends IHostService, IDisposable {
    // noop
}

/** 
 * @class MainHostService is a key class in Electron's main process, designed to 
 * handle window-instance related events, window service tasks, dialog service 
 * tasks, dev-tool operations and application status updates.
 * 
 * In terms of event handling, MainHostService listens for events such as:
 * - Window maximization
 * - Window minimization
 * - Window focus
 * - Window blur
 * - Window opening
 * 
 * Additionally, this class provides methods to manipulate window instances 
 * including focusing, maximizing, minimizing, unMaximizing, toggling fullscreen 
 * mode, closing the window, and even manipulating the DevTools.
 * 
 * The class also facilitates dialog services, enabling functionalities such as 
 * showing open, save, or message box dialogs.
 * 
 * Finally, MainHostService can also handle the application status by setting, 
 * bulk setting, and deleting status keys and values.
 */
export class MainHostService extends Disposable implements IMainHostService {

    declare _serviceMarker: undefined;

    // [event]

    private readonly _onDidMaximizeWindow = this.__register(new NodeEventEmitter(app, IpcChannel.WindowMaximized, (_e, window: BrowserWindow) => window.id));
    public readonly onDidMaximizeWindow = this._onDidMaximizeWindow.registerListener;

    private readonly _onDidUnMaximizeWindow = this.__register(new NodeEventEmitter(app, IpcChannel.WindowUnMaximized, (_e, window: BrowserWindow) => window.id));
    public readonly onDidUnMaximizeWindow = this._onDidUnMaximizeWindow.registerListener;

    private readonly _onDidFocusWindow = this.__register(new NodeEventEmitter(app, IpcChannel.WindowFocused, (_e, window: BrowserWindow) => window.id));
    public readonly onDidFocusWindow = this._onDidFocusWindow.registerListener;

    private readonly _onDidBlurWindow = this.__register(new NodeEventEmitter(app, IpcChannel.WindowBlurred, (_e, window: BrowserWindow) => window.id));
    public readonly onDidBlurWindow = this._onDidBlurWindow.registerListener;
    
    private readonly _onDidEnterFullScreenWindow = this.__register(new NodeEventEmitter(app, IpcChannel.WindowEnterFullScreen, (_e, window: BrowserWindow) => window.id));
    public readonly onDidEnterFullScreenWindow = this._onDidEnterFullScreenWindow.registerListener;
    
    private readonly _onDidLeaveFullScreenWindow = this.__register(new NodeEventEmitter(app, IpcChannel.WindowLeaveFullScreen, (_e, window: BrowserWindow) => window.id));
    public readonly onDidLeaveFullScreenWindow = this._onDidLeaveFullScreenWindow.registerListener;

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

    public async setWindowAsRendererReady(id?: number): Promise<void> {
        const window = this.__tryGetWindow(id);
        window?.setAsRendererReady();
    }

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

    public async unMaximizeWindow(id?: number): Promise<void> {
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
        window?.close();
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

    public async openFileDialogAndOpen(opts: IOpenDialogOptions, windowID?: number): Promise<void> {
        return this.__openDialogAndOpen(opts, windowID);
    }

    public async openDirectoryDialogAndOpen(opts: IOpenDialogOptions, windowID?: number): Promise<void> {
        return this.__openDialogAndOpen(opts, windowID);
    }

    public async openFileOrDirectoryDialogAndOpen(opts: IOpenDialogOptions, windowID?: number): Promise<void> {
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

    public async toggleInspectorWindow(id?: number): Promise<void> {
        const window = this.__tryGetWindow(id);
        if (!window) {
            return;
        }
        const inspectorWindow = this.windowService.getInspectorWindowByOwnerID(window.id);
        if (inspectorWindow) {
            inspectorWindow.close();
        } else {
            this.windowService.openInspector(window.id);
        }
    }

    public setApplicationStatus(key: StatusKey, val: any): Promise<void> {
        return this.statusService.set(key, val).unwrap();
    }

    public setApplicationStatusLot(items: readonly { key: StatusKey, val: any; }[]): Promise<void> {
        return this.statusService.setLot(items).unwrap();
    }

    public deleteApplicationStatus(key: StatusKey): Promise<boolean> {
        return this.statusService.delete(key).unwrap();
    }

    public async showItemInFolder(path: string): Promise<void> {
        shell.showItemInFolder(path);
    }

    // [private helper methods]

    private __tryGetWindow(id?: number): IWindowInstance | undefined {
        if (typeof id === 'undefined') {
            return undefined;
        }
        return this.windowService.getWindowByID(id);
    }

    private async __openDialogAndOpen(opts: IOpenDialogOptions, windowID?: number): Promise<void> {
        const browserWindow = this.__tryGetWindow(windowID)?.browserWindow;
        const picked = await this.dialogService.openFileDialog(opts, browserWindow);
        const uriToOpen = picked.map(path => URI.fromFile(path));

        this.windowService.open({
            uriToOpen: uriToOpen,
            forceNewWindow: opts.forceNewWindow,
            hostWindow: windowID ?? -1,
        });
    }
}