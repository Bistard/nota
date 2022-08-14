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
import { IpcChannel } from "src/code/platform/ipc/common/channel";
import { BrowserLoggerChannel } from "src/code/platform/logger/common/browserLoggerService";
import { ILogService } from "src/base/common/logger";
import { ILoggerService } from "src/code/platform/logger/common/abstractLoggerService";
import { FileService, IFileService } from "src/code/platform/files/common/fileService";
import { BrowserEnvironmentService } from "src/code/platform/environment/browser/browserEnvironmentService";

/**
 * @class This is the main entry of the renderer process.
 */
export class Browser extends Disposable {

    // [field]

    public workbench!: Workbench;

    // [constructor]

    constructor() {
        super();
        this.run();
    }
    
    // [private methods]

    private async run(): Promise<void> {

        initExposedElectronAPIs();

        await Promise.all([
            this.initServices(), 
            waitDomToBeLoad(),
        ]);

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
        
        // component-service
        instantiationService.register(IComponentService, new ServiceDescriptor(ComponentService));

        // ipc-service
        // FIX: windowID is updated after the configuraion is passed into BrowserWindow
        const ipcService = new IpcService(environmentService.windowID);
        instantiationService.register(IIpcService, ipcService);

        // logger-service
        const loggerService = new BrowserLoggerChannel(environmentService.logLevel, ipcService.getChannel(IpcChannel.Logger));
        instantiationService.register(ILoggerService, loggerService);

        // log-service
        const logService = loggerService.createLogger(
            environmentService.logPath, { 
                name: `window-${environmentService.windowID}.txt`,
                description: `window-${environmentService.windowID}`,
            },
        );
        instantiationService.register(ILogService, logService);

        // file-service (disk files)
        const fileService = new FileService(logService);
        // TODO: we need a fileServiceChannel or a diskFileSystemProvider
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