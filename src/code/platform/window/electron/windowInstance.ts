import { app, BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { join, resolve } from "src/base/common/file/path";
import { ILogService } from "src/base/common/logger";
import { IS_MAC } from "src/base/common/platform";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/environment/common/environment";
import { IMainLifeCycleService } from "src/code/platform/lifeCycle/electron/mainLifeCycleService";
import { defaultDisplayState, IWindowConfiguration, IWindowDisplayOpts, WindowDisplayMode, WindowMinimumState, IWindowCreationOptions, ArgumentKey } from "src/code/platform/window/common/window";
import { IpcChannel } from "src/code/platform/ipc/common/channel";
import { createIpcAccessible, IIpcAccessible } from "src/code/platform/host/common/hostService";

/**
 * An interface only for {@link WindowInstance}.
 */
export interface IWindowInstance extends Disposable {
    
    readonly id: number;

    readonly browserWindow: BrowserWindow;

    readonly onDidLoad: Register<void>;
    
    readonly onDidClose: Register<void>;

    load(configuration: IWindowConfiguration): Promise<void>;

    // TODO: complete
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

    private readonly _window: BrowserWindow;
    private readonly _id: number;

    private readonly _configurationIpcAccessible: IIpcAccessible<IWindowConfiguration> = createIpcAccessible();

    // [constructor]

    constructor(
        private readonly configuration: IWindowConfiguration,
        private readonly creationConfig: IWindowCreationOptions,
        @ILogService private readonly logService: ILogService,
		@IEnvironmentService private readonly environmentService: IMainEnvironmentService,
        @IFileService private readonly fileService: IFileService,
        @IMainLifeCycleService private readonly lifecycleService: IMainLifeCycleService,
    ) {
        super();

        const displayOptions = creationConfig.displayOptions || defaultDisplayState();
        this._window = this.doCreateWindow(displayOptions);
        this._id = this._window.id;

        if (this.environmentService.CLIArguments['open-devtools'] === true) {
            this._window!.webContents.openDevTools({ mode: 'detach', activate: true });
        }

        this.registerListeners();
    }

    // [getter / setter]

    get id(): number { 
        return this._id;
    }

    get browserWindow(): BrowserWindow {
        return this._window;
    }

    // [public methods]

    public load(configuration: IWindowConfiguration): Promise<void> {
        this.logService.trace(`Main#WindowInstance#ID-${this._id}#loading...`);
        
        this._configurationIpcAccessible.updateData(configuration);

        return this._window.loadFile(this.creationConfig.loadFile ?? './index.html');
    }

    public toggleFullScreen(force?: boolean): void {
        
    }

    public close(): void {
        this._window.close();
    }

    public override dispose(): void {
        super.dispose();
        (<any>this._window) = undefined;
    }

    // [private methods]

    private doCreateWindow(displayOpts: IWindowDisplayOpts): BrowserWindow {
        this.logService.trace('Main#WindowInstance#creating window...');

        const ifMaxOrFullscreen = (displayOpts.mode === WindowDisplayMode.Fullscreen) || (displayOpts.mode === WindowDisplayMode.Maximized);
        
        const browserOption: BrowserWindowConstructorOptions = {
            title: 'nota',
            height: displayOpts.height,
            width: displayOpts.width,
            x: displayOpts.x,
            y: displayOpts.y,
            minHeight:  displayOpts.minHeight ?? WindowMinimumState.height,
            minWidth: displayOpts.minWidth ?? WindowMinimumState.wdith,
            webPreferences: {
                /**
                 * Node.js is only available in main / preload process.
                 * Node.js us also be available in the renderer process.
                 * Thus a preload.js is needed.
                 * 
                 * Absolute path needed.
                 */
                nodeIntegration: true,
                preload: resolve(join(__dirname, 'preload.js')),
                /**
                 * Pass any arguments use the following pattern:
                 *      --ArgName=argInString
                 */
                additionalArguments: [`--${ArgumentKey.configuration}=${this._configurationIpcAccessible.resource}`],
                
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
                contextIsolation: false,
                spellcheck: false,
                enableWebSQL: false,
                backgroundThrottling: false,
            },
            show: false, // to prevent flicker, we will show it later.
            resizable: displayOpts.resizable ?? true,
        };

        // frame
        if (!IS_MAC) {
            browserOption.frame = false;
        }

        const window = new BrowserWindow(browserOption);

        if (ifMaxOrFullscreen) {
            window.maximize();
            if (displayOpts.mode === WindowDisplayMode.Fullscreen) {
                window.setSimpleFullScreen(true);
		        window.webContents.focus();
            }
            window.show();
        }

        this.logService.trace('Main#WindowInstance#window created with id:', window.id);
        return window;
    }

    private registerListeners(): void {
        this.logService.trace(`Main#WindowInstance#ID-${this._id}#registerListeners()`);

        this._window.webContents.on('did-finish-load', () => {
            this.logService.trace(`Main#WindowInstance#ID-${this._id}#load successed.`);
            this._window.show();
        });

        // window closed
        this._window.on('closed', () => {
			this._onDidClose.fire();
			this.dispose();
		});
        
        this._window.on('focus', (e: Event) => {
            app.emit(IpcChannel.WindowFocused, e, this._window);
        });

        this._window.on('blur', (e: Event) => {
            app.emit(IpcChannel.WindowBlured, e, this._window);
        });

        this._window.on('maximize', (e: Event) => {
			app.emit(IpcChannel.WindowMaximized, e, this._window);
		});

		this._window.on('unmaximize', (e: Event) => {
			app.emit(IpcChannel.WindowUnmaximized, e, this._window);
		});

        this._window.webContents.on('did-finish-load', () => {
            /**
             * Once the updated configuration has sent to renderer process, no 
             * need to keep listen to IPC anymore.
             */
            this._configurationIpcAccessible.dispose();
            this._onDidLoad.fire();
		});
    }

    // [private helper methods]

}
