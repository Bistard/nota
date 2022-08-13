import { app } from "electron";
import { Disposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { Event } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { getUUID, UUID } from "src/base/node/uuid";
import { IGlobalConfigService, IUserConfigService } from "src/code/platform/configuration/electron/configService";
import { IFileService } from "src/code/platform/files/common/fileService";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IInstantiationService, IServiceProvider } from "src/code/common/service/instantiationService/instantiation";
import { ServiceCollection } from "src/code/common/service/instantiationService/serviceCollection";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/environment/common/environment";
import { IpcServer } from "src/code/platform/ipc/browser/ipc";
import { IpcChannel } from "src/code/platform/ipc/common/channel";
import { ProxyChannel } from "src/code/platform/ipc/common/proxy";
import { SafeIpcMain } from "src/code/platform/ipc/electron/safeIpcMain";
import { IMainLifeCycleService, LifeCyclePhase, QuitReason } from "src/code/platform/lifeCycle/electron/mainLifeCycleService";
import { StatusKey } from "src/code/platform/status/common/status";
import { IMainStatusService } from "src/code/platform/status/electron/mainStatusService";
import { IWindowInstance } from "src/code/platform/window/common/window";
import { IMainWindowService, MainWindowService } from "src/code/platform/window/electron/mainWindowService";

/**
 * An interface only for {@link NotaInstance}
 */
export interface INotaInstance {
    run(): Promise<void>;
}

/**
 * @class The main class of the application. It handles the core business of the 
 * application.
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

        // machine ID
        const machineID = this.__getMachineID();
        this.logService.debug(`Resolved machine ID: ${machineID}`);

        // application service initialization
        const appInstantiationService = await this.registerServices(machineID);

        // IPC main process server
        const ipcServer = new IpcServer();
        this.lifeCycleService.onWillQuit(() => ipcServer.dispose());

        // IPC channel initialization
        this.registerChannels(ipcServer);

        // open first window
        this.openFirstWindow(appInstantiationService);
        
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

        // Register basic ipcMain channel listeners.
        SafeIpcMain.instance
        .on(IpcChannel.ToggleDevTools, event => event.sender.toggleDevTools())
        .on(IpcChannel.OpenDevTools, event => event.sender.openDevTools())
        .on(IpcChannel.CloseDevTools, event => event.sender.closeDevTools())
        .on(IpcChannel.ReloadWindow, event => event.sender.reload());
    }

    private async registerServices(machineID: UUID): Promise<IInstantiationService> {
        this.logService.trace('Main#NotaInstance#registerSerices');

        const appInstantiationService = this.mainInstantiationService.createChild(new ServiceCollection());

        // TODO: update-service

        appInstantiationService.register(IMainWindowService, new ServiceDescriptor(MainWindowService, [machineID]));

        // TODO: dialog-service
        
        // TODO: keyboard-shortcut-service

        // TODO: keyboard-screen-cast-service

        // TODO: i18n-service

        // TODO: notebook-group-service

        return appInstantiationService;
    }

    private registerChannels(server: Readonly<IpcServer>): void {

        // file service
        const diskFileChannel = ProxyChannel.wrapService(this.fileService);
        server.registerChannel(IpcChannel.DiskFile, diskFileChannel);

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

    private __getMachineID(): UUID {
        let id = this.statusService.get(StatusKey.MachineIdKey);
        if (!id) {
            id = getUUID();
            this.statusService.set(StatusKey.MachineIdKey, id);
        }
        return id;
    }

    private __onUnexpectedError(error: any): void {
        this.logService.error(`[uncought exception]: ${error}`);
        if (error.stack) {
            this.logService.error(error.stack);
        }
    }
}
