import { ComponentService, IComponentService } from "src/code/browser/service/componentService";
import { Workbench } from "src/code/browser/workbench/workbench";
import { FileLogService, IFileLogService } from "src/code/common/service/logService/fileLogService";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IInstantiationService, InstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { ServiceCollection } from "src/code/common/service/instantiationService/serviceCollection";
import { IUnitTestService, UnitTestService } from "src/code/common/service/unitTestService";
import { ConfigService, IConfigService } from "src/code/common/service/configService/configService";
import { GlobalConfigService, IGlobalConfigService } from "src/code/common/service/configService/globalConfigService";
import { APP_ROOT_PATH } from "src/base/electron/app";

/**
 * @description This the main entry in the renderer process.
 */
export class Browser {

    public workbench: Workbench | null = null;

    private instantiationService!: IInstantiationService;
    private globalConfigService!: GlobalConfigService;
    private configService!: ConfigService;

    constructor() {
        this.startUp();
    }

    private startUp() {
        this.initServices().then(() => {

            this.workbench = new Workbench(this.instantiationService, this.globalConfigService  , this.configService);
            
            this.registerListeners();

        });
    }

    private async initServices(): Promise<void> {
        const serviceCollection = new ServiceCollection();
        this.instantiationService = new InstantiationService(serviceCollection);

        // InstantiationService
        this.instantiationService.register(IInstantiationService, this.instantiationService);

        // GlobalConfigService
        this.globalConfigService = new GlobalConfigService();
        this.instantiationService.register(IGlobalConfigService, this.globalConfigService);
        await this.globalConfigService.init(APP_ROOT_PATH);

        // ConfigService
        this.configService = new ConfigService();
        this.instantiationService.register(IConfigService, this.configService);
        await this.configService.init(APP_ROOT_PATH);

        // LogService
        this.instantiationService.register(IFileLogService, new ServiceDescriptor(FileLogService));

        // ComponentService
        this.instantiationService.register(IComponentService, new ServiceDescriptor(ComponentService));

        // more and more...
        
        // UnitTestService
        this.instantiationService.register(IUnitTestService, new UnitTestService(this.globalConfigService));
        
    }

    private registerListeners(): void {
        // none for now
    }

}


new Browser();