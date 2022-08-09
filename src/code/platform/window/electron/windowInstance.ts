import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { join, resolve } from "src/base/common/file/path";
import { ILogService } from "src/base/common/logger";
import { IS_MAC } from "src/base/common/platform";
import { IGlobalConfigService, IUserConfigService } from "src/code/common/service/configService/configService";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/environment/common/environment";
import { IMainLifeCycleService } from "src/code/platform/lifeCycle/electron/mainLifeCycleService";
import { defaultDisplayState, IWindowDisplayState, WindowDisplayMode, WindowMinimumState } from "src/code/platform/window/common/window";
import { IWindowInstance } from "src/code/platform/window/electron/window";

/**
 * @class // TODO
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

    // [constructor]

    constructor(
        displayState: IWindowDisplayState | undefined,
        @ILogService private readonly logService: ILogService,
		@IEnvironmentService private readonly environmentService: IMainEnvironmentService,
        @IFileService private readonly fileService: IFileService,
        @IUserConfigService private readonly userConfigService: IUserConfigService,
        @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
        @IMainLifeCycleService private readonly lifecycleService: IMainLifeCycleService,
    ) {
        super();

        const state = displayState || defaultDisplayState();
        this._window = this.doCreateWindow(state);
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

    get window(): BrowserWindow {
        return this._window;
    }

    // [public methods]

    public load(): void {
        this.logService.trace(`Main#WindowInstance#ID-${this._id}#loading...`);
        this._window.loadFile('./index.html');
    }

    public close(): void {
        this._window.close();
    }

    public override dispose(): void {
        super.dispose();
        (this._window as any) = undefined;
    }

    // [private methods]

    private doCreateWindow(displayState: Readonly<IWindowDisplayState>): BrowserWindow {
        this.logService.trace('Main#WindowInstance#creating window...');

        const ifMaxOrFullscreen = (displayState.mode === WindowDisplayMode.Fullscreen) || (displayState.mode === WindowDisplayMode.Maximized);
        const browserOption: BrowserWindowConstructorOptions = {
            title: 'nota',
            height: displayState.height,
            width: displayState.width,
            x: displayState.x,
            y: displayState.y,
            minHeight: WindowMinimumState.height,
            minWidth: WindowMinimumState.wdith,
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
        };

        // frame
        if (!IS_MAC) {
            browserOption.frame = false;
        }

        const window = new BrowserWindow(browserOption);

        if (ifMaxOrFullscreen) {
            window.maximize();
            if (displayState.mode === WindowDisplayMode.Fullscreen) {
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
    }

    // [private helper methods]

}
