import { ComponentService, IComponentService } from "src/code/browser/service/componentService";
import { Workbench } from "src/code/browser/workbench/workbench";
import { FileLogService, IFileLogService } from "src/code/common/service/logService/fileLogService";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IInstantiationService, InstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { ServiceCollection } from "src/code/common/service/instantiationService/serviceCollection";
import { FileService, IFileService } from "src/code/common/service/fileService/fileService";
import { GlobalConfigService, IGlobalConfigService, IUserConfigService, UserConfigService } from "src/code/common/service/configService/configService";
import { Schemas } from "src/base/common/file/uri";
import { DiskFileSystemProvider } from "src/base/node/diskFileSystemProvider";

/**
 * @class This the main entry in the renderer process.
 */
export class Browser {

    public workbench: Workbench | null = null;

    private instantiationService!: IInstantiationService;
    private fileService!: IFileService;
    private globalConfigService!: GlobalConfigService;
    private userConfigService!: UserConfigService;
    private componentService!: ComponentService;

    constructor() {
        this.startUp();
    }

    private startUp(): void {
        this.initServices().then(() => {

            this.workbench = new Workbench(this.instantiationService, this.componentService, this.globalConfigService, this.userConfigService);
            
            this.registerListeners();

        });
    }

    private async initServices(): Promise<void> {
        
        // create a instantiationService
        const serviceCollection = new ServiceCollection();
        this.instantiationService = new InstantiationService(serviceCollection);

        // InstantiationService (itself)
        this.instantiationService.register(IInstantiationService, this.instantiationService);

        // fileService
        this.fileService = new FileService();
        this.fileService.registerProvider(Schemas.FILE, new DiskFileSystemProvider());
        this.instantiationService.register(IFileService, this.fileService);
        
        // GlobalConfigService
        this.globalConfigService = new GlobalConfigService(this.fileService);
        this.instantiationService.register(IGlobalConfigService, this.globalConfigService);
        await this.globalConfigService.init();

        // UserConfigService
        this.userConfigService = new UserConfigService(this.fileService);
        this.instantiationService.register(IUserConfigService, this.userConfigService);
        await this.userConfigService.init();

        // LogService
        this.instantiationService.register(IFileLogService, new ServiceDescriptor(FileLogService));

        // ComponentService
        this.componentService = new ComponentService();
        this.instantiationService.register(IComponentService, this.componentService);

        // more and more...
        
    }

    private registerListeners(): void {
        // none for now
    }

}


new Browser();