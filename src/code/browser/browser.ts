import "src/code/browser/registration";
import { Workbench } from "src/code/browser/workbench/workbench";
import { IInstantiationService, InstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { getSingletonServiceDescriptors, ServiceCollection } from "src/code/platform/instantiation/common/serviceCollection";
import { waitDomToBeLoad, EventType } from "src/base/common/dom";
import { ComponentService, IComponentService } from "src/code/browser/service/componentService";
import { Disposable } from "src/base/common/dispose";
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { initExposedElectronAPIs, process } from "src/code/platform/electron/browser/global";
import { IIpcService, IpcService } from "src/code/platform/ipc/browser/ipcService";
import { BrowserLoggerChannel } from "src/code/platform/logger/common/loggerChannel";
import { ILogService } from "src/base/common/logger";
import { ILoggerService } from "src/code/platform/logger/common/abstractLoggerService";
import { IFileService } from "src/code/platform/files/common/fileService";
import { BrowserEnvironmentService } from "src/code/platform/environment/browser/browserEnvironmentService";
import { BrowserFileChannel } from "src/code/platform/files/common/fileChannel";
import { ErrorHandler } from "src/base/common/error";

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

            await Promise.all([
                this.initServices(), 
                waitDomToBeLoad(),
            ]);
        } 
        catch (error) {
            ErrorHandler.onUnexpectedError(error);
        }

        // TODO: workbench

        this.registerListeners();
    }

    private async initServices(): Promise<void> {
        
        // create a instantiationService
        const serviceCollection = new ServiceCollection();
        const instantiationService = new InstantiationService(serviceCollection);

        // instantiation-service (itself)
        instantiationService.register(IInstantiationService, instantiationService);

        // environmentService
        const environmentService = new BrowserEnvironmentService(process);
        
        // ipc-service
        // FIX: windowID is updated after the configuraion is passed into BrowserWindow
        const ipcService = new IpcService(environmentService.windowID);
        instantiationService.register(IIpcService, ipcService);

        // component-service
        instantiationService.register(IComponentService, new ServiceDescriptor(ComponentService));

        // logger-service
        const loggerService = new BrowserLoggerChannel(ipcService, environmentService.logLevel);
        instantiationService.register(ILoggerService, loggerService);

        // log-service
        const logService = loggerService.createLogger(environmentService.logPath, { 
            name: `window-${environmentService.windowID}.txt`,
            description: `window-${environmentService.windowID}`,
        });
        ErrorHandler.setUnexpectedErrorExternalCallback(error => {
            console.error(error);
            logService.error(error);
        });
        instantiationService.register(ILogService, logService);

        // file-service
        const fileService = new BrowserFileChannel(ipcService);
        instantiationService.register(IFileService, fileService);
 
        // GlobalConfigService
        // UserConfigService
        
        // singleton initialization
        for (const [serviceIdentifer, serviceDescriptor] of getSingletonServiceDescriptors()) {
			instantiationService.register(serviceIdentifer, serviceDescriptor);
		}
    }

    private registerListeners(): void {
        // empty for now
    }

}

const onCatchAnyErrors = () => { 
    if (true) { // REVIEW
        // ipcRendererSend(IpcChannel.ErrorInWindow);
    }
}

/**
 * @readonly Needs to be set globally before everything, once an error has been 
 * captured, we tells the main process to open dev tools.
 */
window.addEventListener(EventType.unhandledrejection, onCatchAnyErrors);
window.onerror = onCatchAnyErrors;

new Browser();