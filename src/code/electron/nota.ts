import { app } from "electron";
import { Disposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { Event } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { IGlobalConfigService, IUserConfigService } from "src/code/common/service/configService/configService";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IInstantiationService, IServiceProvider } from "src/code/common/service/instantiationService/instantiation";
import { ServiceCollection } from "src/code/common/service/instantiationService/serviceCollection";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/environment/common/environment";
import { IMainLifeCycleService, LifeCyclePhase } from "src/code/platform/lifeCycle/electron/mainLifeCycleService";
import { IMainStatusService } from "src/code/platform/status/electron/mainStatusService";
import { IMainWindowService, MainWindowService } from "src/code/platform/window/electron/mainWindowService";
import { IWindowInstance } from "src/code/platform/window/electron/window";

/**
 * An interface only for {@link NotaInstance}
 */
export interface INotaInstance {
    run(): Promise<void>;
}

/**
 * @class // TODO
 */
export class NotaInstance extends Disposable implements INotaInstance {

    // [fields]

    private readonly mainWindowService?: IMainWindowService;

    // [constructor]

    constructor(
        @IInstantiationService private readonly mainInstantiationService: IInstantiationService,
        @IEnvironmentService private readonly environmentService: IMainEnvironmentService,
        @IMainLifeCycleService private readonly lifeCycleService: IMainLifeCycleService,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
        @IUserConfigService private readonly userConfigService: IUserConfigService,
        @IMainStatusService private readonly statusService: IMainStatusService,
    ) {
        super();
        this.registerListeners();
    }

    // [public methods]

    public async run(): Promise<void> {
        this.logService.debug(`nota starting at ${this.environmentService.appRootPath}...`);

        // application service initialization
        const appInstantiationService = await this.registerServices();

        // IPC channels initialization
        // TODO

        // open first window
        app.whenReady().then(() => {
            this.openFirstWindow(appInstantiationService);
        });

        // post work
        this.afterFirstWindow(appInstantiationService);
    }

    // [private methods]

    private registerListeners(): void {
        this.logService.trace(`Main#Nota#registerListeners()`);

        Event.once(this.lifeCycleService.onWillQuit)(() => this.dispose());

        // interept unexpected errors so that the error will not go back to `main.ts`
        process.on('uncaughtException', err => ErrorHandler.onUnexpectedError(err));
		process.on('unhandledRejection', reason => ErrorHandler.onUnexpectedError(reason));
        ErrorHandler.setUnexpectedErrorExternalCallback(err => this.__onUnexpectedError(err));
        
        app.on('open-file', (event, path) => {
            this.logService.trace('main#app#open-file#', path);
            // REVIEW
        });

        app.on('new-window-for-tab', () => {
            // REVIEW
			// this.mainWindowService?.open();
		});
    }

    private async registerServices(): Promise<IInstantiationService> {
        this.logService.trace('Main#NotaInstance#registerSerices');

        const appInstantiationService = this.mainInstantiationService.createChild(new ServiceCollection());

        // TODO: update-service

        appInstantiationService.register(IMainWindowService, new ServiceDescriptor(MainWindowService));

        // TODO: dialog-service
        
        // TODO: keyboard-shortcut-service

        // TODO: keyboard-screen-cast-service

        // TODO: i18n-service

        // TODO: notebook-group-service

        return appInstantiationService;
    }

    private openFirstWindow(instantiationService: IServiceProvider): IWindowInstance {
        const mainWindowService = instantiationService.getOrCreateService(IMainWindowService);
        
        // life-cycle-service: READY
        this.lifeCycleService.setPhase(LifeCyclePhase.Ready);
        
        // open the first window
        const window: IWindowInstance = mainWindowService.open({
            CLIArgv: this.environmentService.CLIArguments,
        });

        return window;
    }

    private afterFirstWindow(instantiationService: IServiceProvider): void {
        // TODO
    }

    // [private helper methods]

    private __onUnexpectedError(error: any): void {
        this.logService.error(`[uncought exception]: ${error}`);
        if (error.stack) {
            this.logService.error(error.stack);
        }
    }

}
