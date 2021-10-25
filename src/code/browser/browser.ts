import { ComponentService, IComponentService } from "src/code/browser/service/componentService";
import { Workbench } from "src/code/browser/workbench/workbench";
import { FileLogService, IFileLogService } from "src/code/common/service/logService/fileLogService";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IInstantiationService, InstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { ServiceCollection } from "src/code/common/service/instantiationService/serviceCollection";


/**
 * @description This the main entry in the renderer process.
 */
export class Browser {

    public workbench: Workbench | null = null;

    constructor() {
        this.startUp();
    }

    private startUp() {
        const instantiationService = this.initServices();
        
        this.workbench = new Workbench(instantiationService);
        
        this.registerListeners();
    }

    private initServices(): IInstantiationService {
        const serviceCollection = new ServiceCollection();
        const instantiationService = new InstantiationService(serviceCollection);

        // InstantiationService
        instantiationService.register(IInstantiationService, instantiationService);

        // LogService
        instantiationService.register(IFileLogService, new ServiceDescriptor(FileLogService));

        // ComponentService
        instantiationService.register(IComponentService, new ServiceDescriptor(ComponentService));

        return instantiationService;
    }

    private registerListeners(): void {
        // none for now
    }

}


new Browser();