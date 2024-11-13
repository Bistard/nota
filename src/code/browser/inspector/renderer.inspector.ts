import { waitDomToBeLoad } from "src/base/browser/basic/dom";
import { ErrorHandler } from "src/base/common/error";
import { monitorEventEmitterListenerGC } from "src/base/common/event";
import { ILogService, BufferLogger, LogLevel } from "src/base/common/logger";
import { toBoolean } from "src/base/common/utilities/type";
import { initGlobalErrorHandler } from "src/code/browser/common/renderer.common";
import { initExposedElectronAPIs, WIN_CONFIGURATION } from "src/platform/electron/browser/global";
import { BrowserEnvironmentService } from "src/platform/environment/browser/browserEnvironmentService";
import { IBrowserEnvironmentService, ApplicationMode } from "src/platform/environment/common/environment";
import { IInstantiationService, InstantiationService } from "src/platform/instantiation/common/instantiation";
import { ServiceCollection } from "src/platform/instantiation/common/serviceCollection";
import { IpcService, IIpcService } from "src/platform/ipc/browser/ipcService";
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

            // TODO: view initialize
        }
        catch (error: any) {
            // try to log out the error message
            if (instantiationService) {
                try {
                    const logService = instantiationService.getService(ILogService);
                    logService.error('renderer', 'error encountered', error);
                } catch { }
            }
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


        return instantiationService;
    }
}

(new InspectorRenderer()).init();