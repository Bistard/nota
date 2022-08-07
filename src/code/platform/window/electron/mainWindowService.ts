import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";
import { IInstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/environment/common/environment";
import { IMainLifeCycleService } from "src/code/platform/lifeCycle/electron/mainLifeCycleService";
import { IOpenWindowOpts, IWindowInstance } from "src/code/platform/window/common/window";

export const IMainWindowService = createDecorator<IMainWindowService>('main-window-service');

/**
 * An interface only for {@link MainWindowService}.
 */
export interface IMainWindowService extends Disposable {
    
    readonly onDidOpenWindow: Register<IWindowInstance>;

    readonly onDidCloseWindow: Register<IWindowInstance>;

    open(options: IOpenWindowOpts): void;
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
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IMainLifeCycleService private readonly lifeCycleService: IMainLifeCycleService,
        @IEnvironmentService private readonly environmentMainService: IMainEnvironmentService,
    ) {
        super();
        this.registerListeners();
    }

    // [public methods]

    public open(options: IOpenWindowOpts): void {
        this.logService.trace('Main#mainWindowService#open()');

        // this.instantiationService.createInstance() // TODO

    }

    // [private methods]

    private registerListeners(): void {
        // noop
    }

    // [private helper methods]

}