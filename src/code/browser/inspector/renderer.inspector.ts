import { waitDomToBeLoad } from "src/base/browser/basic/dom";
import { ErrorHandler } from "src/base/common/error";
import { monitorEventEmitterListenerGC } from "src/base/common/event";
import { ILogService, BufferLogger, LogLevel } from "src/base/common/logger";
import { toBoolean } from "src/base/common/utilities/type";
import { initGlobalErrorHandler } from "src/code/browser/common/renderer.common";
import { initExposedElectronAPIs, ipcRenderer, WIN_CONFIGURATION } from "src/platform/electron/browser/global";
import { BrowserEnvironmentService } from "src/platform/environment/browser/browserEnvironmentService";
import { IBrowserEnvironmentService, ApplicationMode } from "src/platform/environment/common/environment";
import { IBrowserHostService } from "src/platform/host/browser/browserHostService";
import { IHostService } from "src/platform/host/common/hostService";
import { IInstantiationService, InstantiationService } from "src/platform/instantiation/common/instantiation";
import { ServiceCollection } from "src/platform/instantiation/common/serviceCollection";
import { IpcService, IIpcService } from "src/platform/ipc/browser/ipcService";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { ProxyChannel } from "src/platform/ipc/common/proxy";
import { BrowserLifecycleService, IBrowserLifecycleService, ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { ConsoleLogger } from "src/platform/logger/common/consoleLoggerService";

/**
 * InspectorRenderer first entry for inspector window.
 * // TODO
 */
export class InspectorRenderer {
    
    // [fields]

    private readonly logService!: ILogService;

    // [constructor]

    constructor() {}
    
    // [public methods]

    public async init(): Promise<void> {

        ErrorHandler.setUnexpectedErrorExternalCallback((error: any) => console.error(error));

        let instantiationService: IInstantiationService | undefined;
        try {
            // retrieve the exposed APIs from preload.js
            initExposedElectronAPIs();
            monitorEventEmitterListenerGC({
                ListenerGCedWarning: toBoolean(WIN_CONFIGURATION.ListenerGCedWarning),
            });

            // ensure we handle almost every errors properly
            initGlobalErrorHandler(this.logService, WIN_CONFIGURATION);

            // core service construction
            instantiationService = this.createCoreServices();

            // service initialization
            await Promise.all([
                // this.initServices(instantiationService),
                waitDomToBeLoad().then(() => this.logService.info('renderer', 'Web environment (DOM content) has been loaded.')),
            ]);

            // view initialization
            const window = instantiationService.createInstance(InspectorWindow, document.body);
            window.init();
        }
        catch (error: any) {
            ErrorHandler.onUnexpectedError(error);
        }
    }

    // [private helper methods]

    private createCoreServices(): IInstantiationService {
        
        // instantiation-service (Dependency Injection)
        const instantiationService = new InstantiationService(new ServiceCollection());
        instantiationService.register(IInstantiationService, instantiationService);

        // log-service
        const logService = new BufferLogger();
        instantiationService.register(ILogService, logService);
        (<any>this.logService) = logService;

        // environment-service
        const environmentService = new BrowserEnvironmentService(logService);
        instantiationService.register(IBrowserEnvironmentService, environmentService);
        
        // logger
        logService.setLogger(new ConsoleLogger(environmentService.mode === ApplicationMode.DEVELOP ? environmentService.logLevel : LogLevel.WARN));

        // ipc-service
        const ipcService = new IpcService(environmentService.windowID, logService);
        instantiationService.register(IIpcService, ipcService);

        // host-service
        const hostService = ProxyChannel.unwrapChannel<IBrowserHostService>(ipcService.getChannel(IpcChannel.Host), { context: environmentService.windowID });
        instantiationService.register(IHostService, hostService);

        // lifecycle-service
        const lifecycleService = new BrowserLifecycleService(logService, hostService);
        instantiationService.register(ILifecycleService, lifecycleService);

        return instantiationService;
    }
}

(new InspectorRenderer()).init();


class InspectorWindow {

    // [field]

    private readonly _parent: HTMLElement;

    // [constructor]

    constructor(
        parent: HTMLElement,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
    ) {
        this._parent = parent;
        this.registerListeners();
    }

    // [public methods]

    private registerListeners(): void {
        // before quit, notify the main process we are actually closing
        this.lifecycleService.onWillQuit(e => {
            ipcRenderer.send(IpcChannel.InspectorClose, WIN_CONFIGURATION.windowID);
        });
    }

    public init(): void {
        ipcRenderer.send(IpcChannel.InspectorReady, WIN_CONFIGURATION.windowID);
    }
}