import { ComponentService, IComponentService } from "src/code/browser/service/componentService";
import { Workbench } from "src/code/browser/workbench/workbench";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IInstantiationService, InstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { getSingletonServiceDescriptors, ServiceCollection } from "src/code/common/service/instantiationService/serviceCollection";
import { FileService, IFileService } from "src/code/common/service/fileService/fileService";
import { GlobalConfigService, IGlobalConfigService, IUserConfigService, UserConfigService } from "src/code/common/service/configService/configService";
import { Schemas, URI } from "src/base/common/file/uri";
import { DiskFileSystemProvider } from "src/base/node/diskFileSystemProvider";
import { IIpcService, IpcService } from "src/code/browser/service/ipcService";
import { ipcRendererSend } from "src/base/electron/register";
import { IpcChannel } from "src/base/common/ipcChannel";
import { APP_ROOT_PATH, DEVELOP_ENV } from "src/base/electron/app";
import { EventType } from "src/base/common/dom";
import { ILogService, LogLevel, PipelineLogger } from "src/base/common/logger";
import { ILoggerService } from "src/code/common/service/logService/abstractLoggerService";
import { FileLoggerService } from "src/code/common/service/logService/fileLoggerService";
import { join } from "src/base/common/file/path";
import { ConsoleLogger } from "src/code/common/service/logService/consoleLoggerService";

/**
 * @class This is the main entry of the renderer process.
 */
export class Browser {

    public workbench!: Workbench;

    private instantiationService!: IInstantiationService;
    private fileService!: IFileService;
    private globalConfigService!: GlobalConfigService;
    private userConfigService!: UserConfigService;
    private componentService!: ComponentService;

    constructor() {
        this.startUp();
    }

    private startUp(): void {
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
        this.instantiationService.register(IIpcService, new ServiceDescriptor(IpcService));

        // fileService
        // this.fileService = new FileService();
        // this.fileService.registerProvider(Schemas.FILE, new DiskFileSystemProvider());
        // this.instantiationService.register(IFileService, this.fileService);
        
        // // GlobalConfigService
        // this.globalConfigService = new GlobalConfigService(this.fileService);
        // this.instantiationService.register(IGlobalConfigService, this.globalConfigService);
        // await this.globalConfigService.init();

        // // UserConfigService
        // this.userConfigService = new UserConfigService(this.fileService);
        // this.instantiationService.register(IUserConfigService, this.userConfigService);
        // await this.userConfigService.init();

        // ILoggerService
        const fileLoggerService = new FileLoggerService(LogLevel.INFO, this.instantiationService);
        this.instantiationService.register(ILoggerService, fileLoggerService);

        // ILogService
        const fileLogger = fileLoggerService.createLogger(
            // REVIEW: uri should be retrieve from `envrionmentService`
            // REVIEW: file name should be a date
            URI.fromFile(join(APP_ROOT_PATH, '.nota/log/file-log.txt')), {
            name: 'file-read-result'
        }); 
        const pipelineLogService = new PipelineLogger(
            [fileLogger, new ConsoleLogger(LogLevel.WARN)]
        );
        this.instantiationService.register(ILogService, pipelineLogService);
        
        // ComponentService
        this.componentService = new ComponentService();
        this.instantiationService.register(IComponentService, this.componentService);

        // more and more...
        
    }

    private registerListeners(): void {
        // empty for now
    }

}

const onCatchAnyErrors = () => { 
    if (DEVELOP_ENV) {
        ipcRendererSend(IpcChannel.ErrorInWindow);
    }
}

/**
 * @readonly Needs to be set globally before everything, once an error has been 
 * captured, we tells the main process to open dev tools.
 */
window.addEventListener(EventType.unhandledrejection, onCatchAnyErrors);
window.onerror = onCatchAnyErrors;

new Browser();