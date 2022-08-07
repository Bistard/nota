import { app } from "electron";
import { Disposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { Event } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { IGlobalConfigService, IUserConfigService } from "src/code/common/service/configService/configService";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IInstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { ServiceCollection } from "src/code/common/service/instantiationService/serviceCollection";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/environment/common/environment";
import { IMainLifeCycleService, LifeCyclePhase } from "src/code/platform/lifeCycle/electron/mainLifeCycleService";
import { IWindowInstance } from "src/code/platform/window/common/window";
import { IMainWindowService, MainWindowService } from "src/code/platform/window/electron/mainWindowService";

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

    // [constructor]

    constructor(
        @IInstantiationService private readonly mainInstantiationService: IInstantiationService,
        @IEnvironmentService private readonly environmentService: IMainEnvironmentService,
        @IMainLifeCycleService private readonly lifeCycleService: IMainLifeCycleService,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
        @IUserConfigService private readonly userConfigService: IUserConfigService
    ) {
        super();
        this.registerListeners();
    }

    // [public methods]

    public async run(): Promise<void> {
        this.logService.debug('nota starting...');
        this.logService.debug(`${this.environmentService.appRootPath}`);

        // application service initialization
        const appInstantiationService = await this.registerServices();

        // IPC channels initialization
        // TODO

        // open first window
        const window = this.openFirstWindow(appInstantiationService);

        // post work
        this.afterFirstWindow(appInstantiationService);
    }

    // [private methods]

    private registerListeners(): void {

        Event.once(this.lifeCycleService.onWillQuit)(() => this.dispose());

        // interept unexpected errors so that the error will not go back to `main.ts`
        process.on('uncaughtException', err => ErrorHandler.onUnexpectedError(err));
		process.on('unhandledRejection', reason => ErrorHandler.onUnexpectedError(reason));
        ErrorHandler.setUnexpectedErrorExternalCallback(err => this.__onUnexpectedError(err));
        
        app.on('open-file', (event, path) => {
            this.logService.trace('main#app.on("open-file"): ', path);
            // REVIEW
        });
    }

    private async registerServices(): Promise<IInstantiationService> {
        
        const appInstantiationService = this.mainInstantiationService.createChild(new ServiceCollection());

        // REVIEW: update-service

        // TODO: window-service
        appInstantiationService.register(IMainWindowService, new ServiceDescriptor(MainWindowService));

        // REVIEW: dialog-service
        
        // REVIEW: keyboard-shortcut-service

        // REVIEW: keyboard-screen-cast-service

        // REVIEW: i18n-service

        // REVIEW: notebook-group-service

        return appInstantiationService;
    }

    private openFirstWindow(instantiationService: IInstantiationService): IWindowInstance {
        const mainWindowService = instantiationService.getOrCreateService(IMainWindowService);
        this.lifeCycleService.setPhase(LifeCyclePhase.Ready);

        // open the first window
        let window: IWindowInstance;
        return false as unknown as any;
    }

    private afterFirstWindow(instantiationService: IInstantiationService): void {
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
