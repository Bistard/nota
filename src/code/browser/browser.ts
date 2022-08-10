import { Workbench } from "src/code/browser/workbench/workbench";
import { IInstantiationService, InstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { getSingletonServiceDescriptors, ServiceCollection } from "src/code/common/service/instantiationService/serviceCollection";
import { waitDomToBeLoad, EventType } from "src/base/common/dom";
import { ComponentService, IComponentService } from "src/code/browser/service/componentService";
import { Disposable } from "src/base/common/dispose";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { initExposedElectronAPIs, windowConfiguration } from "src/code/platform/electron/browser/global";

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

        console.log(windowConfiguration);

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

        // singleton initialization
        for (const [serviceIdentifer, serviceDescriptor] of getSingletonServiceDescriptors()) {
			instantiationService.register(serviceIdentifer, serviceDescriptor);
		}

        // ComponentService
        instantiationService.register(IComponentService, new ServiceDescriptor(ComponentService));

        // IpcService
        // fileService
        // GlobalConfigService
        // UserConfigService
        // ILoggerService
        // ILogService
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