import { Workbench } from "src/code/browser/workbench/workbench";
import { IInstantiationService, InstantiationService } from "src/code/common/service/instantiation/instantiation";
import { ServiceCollection } from "src/code/common/service/instantiation/serviceCollection";


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
        
        this.registerListeners();

        this.workbench = new Workbench(instantiationService);
    }

    private initServices(): IInstantiationService {
        const serviceCollection = new ServiceCollection();

        // sets all the services here...

        const instantiationService = new InstantiationService(serviceCollection);
        return instantiationService;
    }

    private registerListeners(): void {
        // 
    }

}


new Browser();