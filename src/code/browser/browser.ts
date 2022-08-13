import { Workbench } from "src/code/browser/workbench/workbench";
import { IInstantiationService, InstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { getSingletonServiceDescriptors, ServiceCollection } from "src/code/common/service/instantiationService/serviceCollection";
import { waitDomToBeLoad, EventType } from "src/base/common/dom";
import { ComponentService, IComponentService } from "src/code/browser/service/componentService";
import { Disposable } from "src/base/common/dispose";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { initExposedElectronAPIs, ipcRenderer, windowConfiguration } from "src/code/platform/electron/browser/global";
import { IpcChannel } from "src/code/platform/ipc/common/channel";
import { URI } from "src/base/common/file/uri";
import { IpcClient } from "src/code/platform/ipc/browser/ipc";
import { join } from "src/base/common/file/path";
import { DataBuffer } from "src/base/common/file/buffer";
import { IIpcService, IpcService } from "src/code/platform/ipc/browser/ipcService";

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

        // InstantiationService (itself)
        instantiationService.register(IInstantiationService, instantiationService);

        // ComponentService
        instantiationService.register(IComponentService, new ServiceDescriptor(ComponentService));

        // IpcService
        // FIX: windowID is updated after the configuraion is passed into BrowserWindow
        const ipcService = new IpcService(windowConfiguration.windowID);
        instantiationService.register(IIpcService, ipcService);

        // ILoggerService
        // ILogService
        // IpcService
        // localFileService
        // environmentService
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