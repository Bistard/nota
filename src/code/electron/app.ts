import * as electron from "electron";
import { Disposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
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
import { IWindowInstance } from "src/platform/window/electron/windowInstance";
import { MainHostService } from "src/platform/host/electron/mainHostService";
import { IHostService } from "src/platform/host/common/hostService";
import { DEFAULT_HTML, INSPECTOR_HTML } from "src/platform/window/common/window";
import { URI } from "src/base/common/files/uri";
import { MainFileChannel } from "src/platform/files/electron/mainFileChannel";
import { UUID } from "src/base/common/utilities/string";
import { IpcServer } from "src/platform/ipc/electron/ipcServer";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { IScreenMonitorService, ScreenMonitorService } from "src/platform/screen/electron/screenMonitorService";

/**
 * An interface only for {@link ApplicationInstance}
 */
export interface IApplicationInstance {
    run(): Promise<void>;
}

/**
 * @class The main class of the application. It handles the core business of the 
 * application.
 */
export class ApplicationInstance extends Disposable implements IApplicationInstance {

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
        @IRegistrantService private readonly registrantService: IRegistrantService,
    ) {
        super();
        this.registerListeners();
    }

    // [public methods]

    public async run(): Promise<void> {
        this.logService.debug('App', `application starting at '${URI.toString(this.environmentService.appRootPath, true)}'...`);

        // machine ID
        const machineID = this.__getMachineID();
        this.logService.debug('App', `Resolved machine ID (${machineID}).`);

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
        Event.once(this.lifecycleService.onWillQuit)(() => this.dispose());

        // interrupt unexpected errors so that the error will not go back to `main.ts`
        process.on('uncaughtException', err => ErrorHandler.onUnexpectedError(err));
        process.on('unhandledRejection', reason => ErrorHandler.onUnexpectedError(reason));
        ErrorHandler.setUnexpectedErrorExternalCallback(err => this.__onUnexpectedError(err));

        electron.app.on('open-file', (event, path) => {
            this.logService.debug('App', `open-file: ${path}`);
            // REVIEW
        });

        electron.app.on('new-window-for-tab', () => {
            // REVIEW
            // this.mainWindowService?.open();
        });
    }

    private async createServices(machineID: UUID): Promise<IInstantiationService> {
        this.logService.debug('App', 'constructing application services...');

        // instantiation-service (child)
        const appInstantiationService = this.mainInstantiationService.createChild(new ServiceCollection());

        // main-window-service
        appInstantiationService.register(IMainWindowService, new ServiceDescriptor(MainWindowService, [machineID]));

        // dialog-service
        appInstantiationService.register(IMainDialogService, new ServiceDescriptor(MainDialogService, []));

        // host-service
        appInstantiationService.register(IHostService, new ServiceDescriptor(MainHostService, []));

        // screen-monitor-service
        appInstantiationService.register(IScreenMonitorService, new ServiceDescriptor(ScreenMonitorService, []));

        // ai-service

        this.logService.debug('App', 'Application services constructed.');
        return appInstantiationService;
    }

    private registerChannels(provider: IServiceProvider, server: Readonly<IpcServer>): void {
        this.logService.debug('App', 'Registering IPC channels...');

        // file-service-channel
        const diskFileChannel = new MainFileChannel(this.logService, this.fileService, this.registrantService);
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

        // ai-service-channel


        this.logService.debug('App', 'IPC channels registered successfully.');
    }

    private openFirstWindow(provider: IServiceProvider): IWindowInstance {
        this.logService.debug('App', 'Opening the first window...');

        const mainWindowService = provider.getOrCreateService(IMainWindowService);

        // life-cycle-service: READY
        this.lifecycleService.setPhase(LifecyclePhase.Ready);

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
            displayOptions: {
                frameless: true,
            }
        });

        return window;
    }

    private afterFirstWindow(provider: IServiceProvider): void {
        
        if (this.environmentService.CLIArguments.inspector === true 
            || this.environmentService.CLIArguments.inspector === 'true'
        ) {
            this.openDebugInspectorWindow(provider);
        }
    }

    private openDebugInspectorWindow(provider: IServiceProvider): void {
        const mainWindowService = provider.getOrCreateService(IMainWindowService);

        const window: IWindowInstance = mainWindowService.open({
            CLIArgv: this.environmentService.CLIArguments,
            loadFile: INSPECTOR_HTML,
            displayOptions: {
                width: 600,
                height: 200,
                minWidth: 600,
                minHeight: 200,
                resizable: true,
                frameless: false,
            },
            "open-devtools": false,
        });

        /**
         * Whenever all the other windows are closed, we also need to close the
         * inspector window.
         */
        mainWindowService.onDidCloseWindow(() => {
            if (mainWindowService.windowCount() === 1) {
                mainWindowService.closeWindowByID(window.id);
            }
        });
    }

    // [private helper methods]

    private __getMachineID(): UUID {
        let id = this.statusService.get<string>(StatusKey.MachineIdKey);
        if (!id) {
            id = getUUID();
            this.statusService.set(StatusKey.MachineIdKey, id).unwrap();
        }
        return id;
    }

    private __onUnexpectedError(error: any): void {
        this.logService.error('App', `Uncaught exception occurred.`, error);
    }
}
