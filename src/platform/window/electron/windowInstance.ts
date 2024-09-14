import * as electron from "electron";
import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { join, resolve } from "src/base/common/files/path";
import { ILogService } from "src/base/common/logger";
import { IFileService } from "src/platform/files/common/fileService";
import { IEnvironmentService, IMainEnvironmentService } from "src/platform/environment/common/environment";
import { IMainLifecycleService } from "src/platform/lifecycle/electron/mainLifecycleService";
import { IWindowConfiguration, IWindowDisplayOpts, WindowDisplayMode, WINDOW_MINIMUM_STATE, IWindowCreationOptions, ArgumentKey } from "src/platform/window/common/window";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { IIpcAccessible } from "src/platform/host/common/hostService";
import { getUUID } from "src/base/node/uuid";
import { SafeIpcMain } from "src/platform/ipc/electron/safeIpcMain";
import { IProductService } from "src/platform/product/common/productService";

/**
 * @description A helper function to help renderer process can have access to
 * and only to the specified data by invoking `ipcRenderer.invoke(resource)`.
 * @returns a {@link IIpcAccessible} object.
 * @note Can only be invoked in main process and pass the resource to the 
 * renderer process.
 */
function createIpcAccessible<T>(): IIpcAccessible<T> {
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

/**
 * An interface only for {@link WindowInstance}.
 */
export interface IWindowInstance extends Disposable {

    readonly id: number;

    readonly browserWindow: electron.BrowserWindow;

    readonly onDidLoad: Register<void>;

    readonly onDidClose: Register<void>;

    load(configuration: IWindowConfiguration): Promise<void>;

    toggleFullScreen(force?: boolean): void;

    close(): void;
}

/**
 * @class A window instance is a wrapper class of {@link BrowserWindow} that
 * will be used in the main process.
 */
export class WindowInstance extends Disposable implements IWindowInstance {

    // [event]

    private readonly _onDidLoad = this.__register(new Emitter<void>());
    public readonly onDidLoad = this._onDidLoad.registerListener;

    private readonly _onDidClose = this.__register(new Emitter<void>());
    public readonly onDidClose = this._onDidClose.registerListener;

    // [field]

    private readonly _window: electron.BrowserWindow;
    private readonly _id: number;

    /**
     * It is still required for potential reloading request so that it cannot
     * be disposed after loading.
     */
    private readonly _configurationIpcAccessible = createIpcAccessible<IWindowConfiguration>();

    // [constructor]

    constructor(
        private readonly configuration: IWindowCreationOptions,
        @IProductService private readonly productService: IProductService,
        @ILogService private readonly logService: ILogService,
        @IEnvironmentService private readonly environmentService: IMainEnvironmentService,
        @IFileService private readonly fileService: IFileService,
        @IMainLifecycleService private readonly lifecycleService: IMainLifecycleService,
    ) {
        super();
        logService.debug('WindowInstance', 'Constructing a window with the configuration...', { configuration });
        
        const displayOptions = configuration.displayOptions;
        this._window = this.doCreateWindow(displayOptions);
        this._id = this._window.id;
        
        if (configuration["open-devtools"] === true) {
            this._window.webContents.openDevTools({ mode: 'detach', activate: true });
        }
        
        this.registerListeners();
        logService.debug('WindowInstance', 'Window constructed.');
    }

    // [getter / setter]

    get id(): number {
        return this._id;
    }

    get browserWindow(): electron.BrowserWindow {
        return this._window;
    }

    // [public methods]

    public async load(configuration: IWindowConfiguration): Promise<void> {
        this.logService.debug('WindowInstance', `Loading window (ID: ${this._id})...`);

        this._configurationIpcAccessible.updateData(configuration);

        // loading page
        const htmlFile = this.configuration.loadFile;
        this.logService.debug('WindowInstance', `Loading HTML file (${htmlFile})...`);

        this._window.webContents.once('did-fail-load', (e, errCode, errMsg) => {
            this.logService.error('WindowInstance', `Loading page failed.`, new Error(), { errCode, errMsg });
        });
        
        this._window.webContents.once('did-finish-load', () => {
            this.logService.debug('WindowInstance', `Page loaded successfully.`);
        });

        await this._window.loadFile(htmlFile);
    }

    public toggleFullScreen(force?: boolean): void {
        // TODO: complete
    }

    public close(): void {
        this._window.close();
    }

    public override dispose(): void {
        super.dispose();
        // issue: https://stackoverflow.com/questions/38309240/object-has-been-destroyed-when-open-secondary-child-window-in-electron-js
        (<any>this._window) = null;
    }

    // [private methods]

    private doCreateWindow(displayOpts: IWindowDisplayOpts): electron.BrowserWindow {
        this.logService.debug('WindowInstance', 'creating window...');

        const ifMaxOrFullscreen = (displayOpts.mode === WindowDisplayMode.Fullscreen) || (displayOpts.mode === WindowDisplayMode.Maximized);
        const browserOption: electron.BrowserWindowConstructorOptions = {
            title: this.productService.profile.applicationName,
            height: displayOpts.height,
            width: displayOpts.width,
            x: displayOpts.x,
            y: displayOpts.y,
            minHeight: displayOpts.minHeight ?? WINDOW_MINIMUM_STATE.height,
            minWidth: displayOpts.minWidth ?? WINDOW_MINIMUM_STATE.width,
            webPreferences: {
                preload: resolve(join(__dirname, 'preload.js')),

                /**
                 * false: Node.js is only available in main / preload process.
                 * true:  Node.js will also be available in the renderer process.
                 *          Thus a preload.js is needed.
                 */
                nodeIntegration: false,

                /**
                 * Context Isolation is a feature that ensures that both 
                 * your preload scripts and Electron's internal logic run in 
                 * a separate context to the website you load in 
                 * a webContents. This is important for security purposes as 
                 * it helps prevent the website from accessing Electron 
                 * internals or the powerful APIs your preload script has 
                 * access to.
                 * 
                 * This means that the (eg. window / document) object the 
                 * preload script has access to is actually a different 
                 * object than the website would have access to.
                 */
                contextIsolation: true,

                /**
                 * Pass any arguments use the following pattern:
                 *      --ArgName=argInString
                 */
                additionalArguments: [`--${ArgumentKey.configuration}=${this._configurationIpcAccessible.resource}`],

                spellcheck: false,
                enableWebSQL: false,
                backgroundThrottling: false,
            },
            show: false, // to prevent flicker, we will show it later.
            resizable: displayOpts.resizable ?? true,
        };

        // frame
        if (displayOpts.frameless) {
            browserOption.frame = false;
        }

        // window construction
        const window = new electron.BrowserWindow(browserOption);

        // removes default menu and shortcuts like reload and developer-tool.
        window.setMenu(null);

        if (ifMaxOrFullscreen) {
            window.maximize();
            if (displayOpts.mode === WindowDisplayMode.Fullscreen) {
                window.setSimpleFullScreen(true);
                window.webContents.focus();
            }
            window.show();
        }

        this.logService.debug('WindowInstance', `window created (ID: ${window.id}).`);
        return window;
    }

    private registerListeners(): void {

        this._window.webContents.on('did-finish-load', () => {
            this.logService.debug('WindowInstance', `load succeeded (ID: ${this._id}).`);
            this._window.show();
        });

        // window closed
        this._window.on('closed', () => {
            this._onDidClose.fire();
            this.dispose();
        });

        this._window.on('focus', (e: Event) => {
            electron.app.emit(IpcChannel.WindowFocused, e, this._window);
        });

        this._window.on('blur', (e: Event) => {
            electron.app.emit(IpcChannel.WindowBlurred, e, this._window);
        });

        this._window.on('maximize', (e: Event) => {
            electron.app.emit(IpcChannel.WindowMaximized, e, this._window);
        });

        this._window.on('unmaximize', (e: Event) => {
            electron.app.emit(IpcChannel.WindowUnmaximized, e, this._window);
        });

        this._window.webContents.on('did-finish-load', () => {
            this._onDidLoad.fire();
        });
    }

    // [private helper methods]

}
