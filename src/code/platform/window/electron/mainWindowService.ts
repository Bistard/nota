import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { Mutable } from "src/base/common/util/type";
import { UUID } from "src/base/node/uuid";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/environment/common/environment";
import { IMainLifeCycleService } from "src/code/platform/lifeCycle/electron/mainLifeCycleService";
import { IWindowConfiguration, IWindowCreationOptions, IWindowInstance } from "src/code/platform/window/common/window";
import { WindowInstance } from "src/code/platform/window/electron/windowInstance";
import { ILookupPaletteService } from "src/code/platform/lookup/electron/lookupPaletteService";

export const IMainWindowService = createDecorator<IMainWindowService>('main-window-service');

/**
 * An interface only for {@link MainWindowService}.
 */
export interface IMainWindowService extends Disposable {
    
    readonly windows: ReadonlyArray<IWindowInstance>;

    readonly onDidOpenWindow: Register<IWindowInstance>;

    readonly onDidCloseWindow: Register<IWindowInstance>;

    /**
     * @description Returns the number of running window.
     */
    windowCount(): number;

    open(options: IWindowCreationOptions): IWindowInstance;
}

/**
 * // TODO
 */
export class MainWindowService extends Disposable implements IMainWindowService {

    // [fields]

    private readonly _windows: IWindowInstance[] = [];

    // [event]

    private readonly _onDidOpenWindow = this.__register(new Emitter<IWindowInstance>());
    public readonly onDidOpenWindow = this._onDidOpenWindow.registerListener;

    private readonly _onDidCloseWindow = this.__register(new Emitter<IWindowInstance>());
    public readonly onDidCloseWindow = this._onDidCloseWindow.registerListener;

    // [constructor]

    constructor(
        private readonly machineID: UUID,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IMainLifeCycleService private readonly lifeCycleService: IMainLifeCycleService,
        @IEnvironmentService private readonly environmentMainService: IMainEnvironmentService,
    ) {
        super();
        this.registerListeners();
    }

    // [getter / setter]

    get windows(): readonly IWindowInstance[] {
        return this._windows;
    }

    // [public methods]

    public windowCount(): number {
        return this._windows.length;
    }

    public open(options: IWindowCreationOptions): IWindowInstance {
        this.logService.trace('Main#mainWindowService#trying to open a window...');

        const newWindow = this.doOpen(options);
        
        // load the window in browser
        newWindow.load();

        this.logService.trace('Main#mainWindowService#window opened');
        return newWindow;
    }

    // [private methods]

    private registerListeners(): void {
        this.logService.trace(`Main#MainWindowService#registerListeners()`);
        // noop
    }

    private doOpen(opts: IWindowCreationOptions): IWindowInstance {

        let window: IWindowInstance;

        /**
         * Important window configuration that relies on previous state of the 
         * application (provided opts, app config, environment and so on). This
         * configuration will be passed as an additional argument when creating
         * a `BrowserWindow`.
         */
        const configuration: IWindowConfiguration = {
            // additional configuration
            machineID: this.machineID,
            windowID: -1, // will be update once window is loaded
            
            // {@link ICLIArguments}
            _:               opts._                ?? this.environmentMainService.CLIArguments._,
            log:             opts.log              ?? this.environmentMainService.CLIArguments.log,
            'open-devtools': opts['open-devtools'] ?? this.environmentMainService.CLIArguments['open-devtools'],
            
            // {@link IEnvironmentOpts}
            isPackaged:   opts.isPackaged   ?? this.environmentMainService.isPackaged,
            appRootPath:  opts.appRootPath  ?? this.environmentMainService.appRootPath,
            tmpDirPath:   opts.tmpDirPath   ?? this.environmentMainService.tmpDirPath,
            userDataPath: opts.userDataPath ?? this.environmentMainService.userDataPath,
            userHomePath: opts.userHomePath ?? this.environmentMainService.userHomePath,
        };
        
        // open a new window instance
        window = this.__openInNewWindow(opts, configuration);

        (<Mutable<typeof configuration>>configuration).windowID = window.id;
        
        return window;
    }

    // [private helper methods]

    private __openInNewWindow(options: IWindowCreationOptions, configuration: IWindowConfiguration): IWindowInstance {
        this.logService.trace('Main#MainWindowService#openInNewWindow');
        
        const newWindow = this.instantiationService.createInstance(
            WindowInstance,
            configuration,
            options,
        );
        
        this._windows.push(newWindow);
        this._onDidOpenWindow.fire(newWindow);

        return newWindow;
    }

}