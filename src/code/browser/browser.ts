import "src/code/browser/registration";
import { Workbench } from "src/code/browser/workbench/workbench";
import { IInstantiationService, InstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { getSingletonServiceDescriptors, ServiceCollection } from "src/code/platform/instantiation/common/serviceCollection";
import { waitDomToBeLoad } from "src/base/common/dom";
import { ComponentService, IComponentService } from "src/code/browser/service/componentService";
import { Disposable } from "src/base/common/dispose";
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { initExposedElectronAPIs, ipcRenderer, process, windowConfiguration } from "src/code/platform/electron/browser/global";
import { IIpcService, IpcService } from "src/code/platform/ipc/browser/ipcService";
import { BrowserLoggerChannel } from "src/code/platform/logger/common/loggerChannel";
import { ILogService, LogLevel } from "src/base/common/logger";
import { ILoggerService } from "src/code/platform/logger/common/abstractLoggerService";
import { IFileService } from "src/code/platform/files/common/fileService";
import { BrowserEnvironmentService } from "src/code/platform/environment/browser/browserEnvironmentService";
import { BrowserFileChannel } from "src/code/platform/files/common/fileChannel";
import { ErrorHandler } from "src/base/common/error";
import { IUserConfigService, UserConfigService } from "src/code/platform/configuration/electron/configService";
import { IBrowserEnvironmentService } from "src/code/platform/environment/common/environment";

/**
 * @class This is the main entry of the renderer process.
 */
export class Browser extends Disposable {

    // [constructor]

    constructor() {
        super();
        this.run();
    }
    
    // [private methods]

    private async run(): Promise<void> {
        ErrorHandler.setUnexpectedErrorExternalCallback((error: any) => console.error(error));

        try {
            initExposedElectronAPIs();

            const instantiaionService = this.createCoreServices();

            await Promise.all([
                this.initServices(instantiaionService),
                waitDomToBeLoad(),
            ]);
        } catch (error) {
            ErrorHandler.onUnexpectedError(error);
        }

        // TODO: workbench

        this.registerListeners();
    }

    private createCoreServices(): IInstantiationService {
        
        // instantiationService (Dependency Injection)
        const serviceCollection = new ServiceCollection();
        const instantiationService = new InstantiationService(serviceCollection);

        // instantiation-service (itself)
        instantiationService.register(IInstantiationService, instantiationService);

        // environmentService
        const environmentService = new BrowserEnvironmentService();
        instantiationService.register(IBrowserEnvironmentService, environmentService);
        
        // ipc-service
        // FIX: windowID is updated after the configuraion is passed into BrowserWindow
        const ipcService = new IpcService(environmentService.windowID);
        instantiationService.register(IIpcService, ipcService);

        // logger-service
        const loggerService = new BrowserLoggerChannel(ipcService, environmentService.logLevel);
        instantiationService.register(ILoggerService, loggerService);

        // log-service
        const logService = loggerService.createLogger(environmentService.logPath, { 
            name: `window-${environmentService.windowID}.txt`,
            description: `renderer`,
        });
        ErrorHandler.setUnexpectedErrorExternalCallback(error => {
            console.error(error);
            logService.error(error);
        });
        instantiationService.register(ILogService, logService);

        // file-service
        // FIX: readFileStream does not work
        const fileService = new BrowserFileChannel(ipcService);
        instantiationService.register(IFileService, fileService);
 
        // global-config-service
        // const globalConfigService = ProxyChannel.unwrapChannel<IGlobalConfigService>(ipcService.getChannel('test'));
        // instantiationService.register(IGlobalConfigService, globalConfigService);

        // user-config-service
        const userConfigService = new UserConfigService(fileService, logService, environmentService);
        instantiationService.register(IUserConfigService, userConfigService);

        // component-service
        instantiationService.register(IComponentService, new ServiceDescriptor(ComponentService));

        // singleton initialization
        for (const [serviceIdentifer, serviceDescriptor] of getSingletonServiceDescriptors()) {
			instantiationService.register(serviceIdentifer, serviceDescriptor);
		}

        return instantiationService;
    }

    private async initServices(instantiaionService: IInstantiationService): Promise<any> {
        const userConfigService = instantiaionService.getService(IUserConfigService);

        return Promise.all<any>([
            userConfigService.init(),
        ]);
    }

    private registerListeners(): void {
        // empty for now
    }

}

new Browser();