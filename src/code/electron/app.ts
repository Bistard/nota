import * as electron from "electron";
import { Disposable } from "src/base/common/dispose";
import { ErrorHandler, errorToMessage } from "src/base/common/error";
import { Event } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { getUUID } from "src/base/node/uuid";
import { IFileService } from "src/platform/files/common/fileService";
import { ServiceDescriptor } from "src/platform/instantiation/common/descriptor";
import { IInstantiationService, IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { ServiceCollection } from "src/platform/instantiation/common/serviceCollection";
import { IEnvironmentService, IMainEnvironmentService } from "src/platform/environment/common/environment";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { ProxyChannel } from "src/platform/ipc/common/proxy";
import { IMainLifecycleService, LifecyclePhase } from "src/platform/lifecycle/electron/mainLifecycleService";
import { StatusKey } from "src/platform/status/common/status";
import { IMainStatusService } from "src/platform/status/electron/mainStatusService";
import { IMainWindowService, MainWindowService } from "src/platform/window/electron/mainWindowService";
import { ILoggerService } from "src/platform/logger/common/abstractLoggerService";
import { MainLoggerChannel } from "src/platform/logger/common/loggerChannel";
import { IMainDialogService, MainDialogService } from "src/platform/dialog/electron/mainDialogService";
import { ILookupPaletteService, LookupPaletteService } from "src/platform/lookup/electron/lookupPaletteService";
import { IWindowInstance } from "src/platform/window/electron/windowInstance";
import { MainHostService } from "src/platform/host/electron/mainHostService";
import { IHostService } from "src/platform/host/common/hostService";
import { DEFAULT_HTML } from "src/platform/window/common/window";
import { URI } from "src/base/common/file/uri";
import { MainFileChannel } from "src/platform/files/electron/mainFileChannel";
import { UUID } from "src/base/common/util/string";
import { IpcServer } from "src/platform/ipc/electron/ipcServer";

/**
 * An interface only for {@link ApplicationInstance}
 */
export interface INotaInstance {
    run(): Promise<void>;
}

/**
 * @class The main class of the application. It handles the core business of the 
 * application.
 */
export class ApplicationInstance extends Disposable implements INotaInstance {

    // [fields]

    private readonly mainWindowService?: IMainWindowService;

    // [constructor]

    constructor(
        @IInstantiationService private readonly mainInstantiationService: IInstantiationService,
        @IEnvironmentService private readonly environmentService: IMainEnvironmentService,
        @IMainLifecycleService private readonly lifecycleService: IMainLifecycleService,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IMainStatusService private readonly statusService: IMainStatusService,
    ) {
        super();
        this.registerListeners();
    }

    // [public methods]

    public async run(): Promise<void> {
        this.logService.debug(`application starting at '${URI.toString(this.environmentService.appRootPath)}'...`);

        // machine ID
        const machineID = this.__getMachineID();
        this.logService.debug(`Resolved machine ID: ${machineID}`);

        // application service initialization
        const appInstantiationService = await this.createServices(machineID);

        // create IPC server in the main process
        const ipcServer = this.__register(new IpcServer(this.logService));

        // IPC channel initialization
        this.registerChannels(appInstantiationService, ipcServer);

        // open first window
        this.openFirstWindow(appInstantiationService);

        // post work
        this.afterFirstWindow(appInstantiationService);
    }

    // [private methods]

    private registerListeners(): void {
        this.logService.trace(`[ApplicationInstance] registerListenering...`);

        Event.once(this.lifecycleService.onWillQuit)(() => this.dispose());

        // interept unexpected errors so that the error will not go back to `main.ts`
        process.on('uncaughtException', err => ErrorHandler.onUnexpectedError(err));
        process.on('unhandledRejection', reason => ErrorHandler.onUnexpectedError(reason));
        ErrorHandler.setUnexpectedErrorExternalCallback(err => this.__onUnexpectedError(err));

        electron.app.on('open-file', (event, path) => {
            this.logService.trace(`[ApplicationInstance] open-file - ${path}`);
            // REVIEW
        });

        electron.app.on('new-window-for-tab', () => {
            // REVIEW
            // this.mainWindowService?.open();
        });

    }

    private async createServices(machineID: UUID): Promise<IInstantiationService> {
        this.logService.trace('[ApplicationInstance] creating services...');

        // instantiation-service (child)
        const appInstantiationService = this.mainInstantiationService.createChild(new ServiceCollection());

        // TODO: update-service

        // main-window-serivce
        appInstantiationService.register(IMainWindowService, new ServiceDescriptor(MainWindowService, [machineID]));

        // dialog-sevice
        appInstantiationService.register(IMainDialogService, new ServiceDescriptor(MainDialogService));

        // host-service
        appInstantiationService.register(IHostService, new ServiceDescriptor(MainHostService));

        // TODO: notebook-group-service

        // lookup-service
        appInstantiationService.register(ILookupPaletteService, new ServiceDescriptor(LookupPaletteService));

        return appInstantiationService;
    }

    private registerChannels(provider: IServiceProvider, server: Readonly<IpcServer>): void {

        // file-service-channel
        const diskFileChannel = new MainFileChannel(this.logService, this.fileService);
        server.registerChannel(IpcChannel.DiskFile, diskFileChannel);

        // logger-service-channel
        const loggerService = provider.getService(ILoggerService);
        const loggerChannel = new MainLoggerChannel(loggerService);
        server.registerChannel(IpcChannel.Logger, loggerChannel);

        // host-service-channel
        const hostService = provider.getOrCreateService(IHostService);
        const hostChannel = ProxyChannel.wrapService(hostService);
        server.registerChannel(IpcChannel.Host, hostChannel);

        // dialog-service-channel
        const dialogService = provider.getService(IMainDialogService);
        const dialogChannel = ProxyChannel.wrapService(dialogService);
        server.registerChannel(IpcChannel.Dialog, dialogChannel);
    }

    private openFirstWindow(provider: IServiceProvider): IWindowInstance {
        const mainWindowService = provider.getOrCreateService(IMainWindowService);

        // life-cycle-service: READY
        this.lifecycleService.setPhase(LifecyclePhase.Ready);

        // set-up lookup-palette-service
        mainWindowService.onDidOpenWindow(() => {
            if (mainWindowService.windowCount() === 1) {
                const lookupPaletteService = provider.getOrCreateService(ILookupPaletteService);
                lookupPaletteService.enable();
            }
        });
        mainWindowService.onDidCloseWindow(() => {
            if (mainWindowService.windowCount() === 0) {
                const lookupPaletteService = provider.getOrCreateService(ILookupPaletteService);
                lookupPaletteService.disable();
            }
        });

        // retrieve last saved opened window status
        const uriToOpen: URI[] = [];
        const uri = this.statusService.get<string>(StatusKey.LastOpenedWorkspace);
        if (uri) {
            uriToOpen.push(URI.parse(uri));
        }

        // open the first window
        const window: IWindowInstance = mainWindowService.open({
            CLIArgv: this.environmentService.CLIArguments,
            loadFile: DEFAULT_HTML,
            uriToOpen: uriToOpen,
        });

        return window;
    }

    private afterFirstWindow(provider: IServiceProvider): void {
        // TODO
    }

    // [private helper methods]

    private __getMachineID(): UUID {
        let id = this.statusService.get<string>(StatusKey.MachineIdKey);
        if (!id) {
            id = getUUID();
            this.statusService.set(StatusKey.MachineIdKey, id);
        }
        return id;
    }

    private __onUnexpectedError(error: any): void {
        this.logService.error(`[ApplicationInstance] [uncought exception] ${errorToMessage(error)}`);
    }
}
