import { Workbench } from "src/code/browser/workbench/workbench";
import { IInstantiationService, InstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { getSingletonServiceDescriptors, ServiceCollection } from "src/code/common/service/instantiationService/serviceCollection";
import { EventType } from "src/base/common/dom";

/**
 * @class This is the main entry of the renderer process.
 */
export class Browser {

    public workbench!: Workbench;
    private instantiationService!: IInstantiationService;

    constructor() {
        this.run();
    }

    private run(): void {
        this.initServices().then(async () => {

            this.workbench = this.instantiationService.createInstance(Workbench);
            await this.workbench.init();
            this.registerListeners();

        });
    }

    private async initServices(): Promise<void> {
        
        // create a instantiationService
        const serviceCollection = new ServiceCollection();
        this.instantiationService = new InstantiationService(serviceCollection);

        // InstantiationService (itself)
        this.instantiationService.register(IInstantiationService, this.instantiationService);

        // singleton initialization
        for (const [serviceIdentifer, serviceDescriptor] of getSingletonServiceDescriptors()) {
			this.instantiationService.register(serviceIdentifer, serviceDescriptor);
		}

        // IpcService
        // fileService
        // GlobalConfigService
        // UserConfigService
        // ILoggerService
        // ILogService
        // ComponentService
        
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