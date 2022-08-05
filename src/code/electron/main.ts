import { app } from 'electron';
import { mkdir } from 'fs/promises';
import { homedir, tmpdir } from 'os';
import { ErrorHandler } from 'src/base/common/error';
import { Schemas, URI } from 'src/base/common/file/uri';import { IpcChannel } from 'src/base/common/ipcChannel';
import { ILogService, LogLevel, PipelineLogger } from 'src/base/common/logger';
import { DiskFileSystemProvider } from 'src/base/node/diskFileSystemProvider';
import { GlobalConfigService, IGlobalConfigService, IUserConfigService, UserConfigService } from 'src/code/common/service/configService/configService';
import { FileService, IFileService } from 'src/code/common/service/fileService/fileService';
import { IInstantiationService, InstantiationService } from 'src/code/common/service/instantiationService/instantiation';
import { ServiceCollection } from 'src/code/common/service/instantiationService/serviceCollection';
import { ILoggerService } from 'src/code/common/service/logService/abstractLoggerService';
import { ConsoleLogger } from 'src/code/common/service/logService/consoleLoggerService';
import { FileLoggerService } from 'src/code/common/service/logService/fileLoggerService';
import { IEnvironmentService, IMainEnvironmentService } from 'src/code/platform/enviroment/common/environment';
import { MainEnvironmentService } from 'src/code/platform/enviroment/electron/mainEnvironmentService';

/**
 * @class // TODO
 */
const nota = new class extends class MainProcess {

    // [field]

    private readonly instantiationService!: IInstantiationService;
    private readonly environmentService!: IMainEnvironmentService;
    private readonly fileService!: IFileService;
    private readonly globalConfigService!: IGlobalConfigService;
    private readonly userConfigService!: IUserConfigService;
    private readonly logService!: ILogService;

    // [constructor]

    constructor() {
        try {
            
            ErrorHandler.setUnexpectedErrorExternalCallback(err => console.error(err));
            this.initialization();

        } catch (unexpectedError: any) {
            console.error(unexpectedError.message ?? 'unknown error message');
            app.exit(1);
        }
    }

    // [private methods]

    private async initialization(): Promise<void> {
        
        this.createCoreServices();

        try {

            await this.initServices();

        } catch (error) {
            /**
             * Once reaching here, there is no any other precautions to prevent 
             * this one. This is the final catch scope and we must exit the 
             * whole program immediately.
             */

            // REVIEW: show a dialog
            
            throw error;
        }

    }

    /**
     * @description // TODO
     */
    private createCoreServices(): void {
        
        // dependency injection (DI)
        const serviceCollection = new ServiceCollection();
        const instantiationService = new InstantiationService(serviceCollection);
        
        // environment-service
        const environmentService = new MainEnvironmentService(undefined, { tmpDirPath: tmpdir(), userHomePath: homedir(), appRootPath: app.getAppPath(), isPackaged: app.isPackaged });
        instantiationService.register(IEnvironmentService, environmentService);

        // file-service
        const fileService = new FileService();
        fileService.registerProvider(Schemas.FILE, new DiskFileSystemProvider());
        instantiationService.register(IFileService, fileService);

        // global-config-service
        const globalConfigService = new GlobalConfigService(fileService);
        instantiationService.register(IGlobalConfigService, globalConfigService);
        
        // user-config-service
        const userConfigService = new UserConfigService(fileService);
        instantiationService.register(IUserConfigService, userConfigService);

        // logger-service
        const fileLoggerService = new FileLoggerService(LogLevel.INFO, instantiationService);
        instantiationService.register(ILoggerService, fileLoggerService);

        // log-service
        const fileLogger = fileLoggerService.createLogger(
            environmentService.logPath, {
                description: 'main-log',
                name: 'main-log.txt'
            }
        );
        const consoleLogger = new ConsoleLogger(LogLevel.WARN);
        const logService = new PipelineLogger([fileLogger, consoleLogger]);
        instantiationService.register(ILogService, logService);
        
        // life-cycle-service
        // TODO

        
        globalConfigService.onDidLoad(result => { logService.info(`global configuration ${result ? 'loaded': 'faild loading'} at ${globalConfigService.resource!.toString()}.`); });
        userConfigService.onDidLoad(result => { logService.info(`user configuration ${result ? 'loaded': 'faild loading'} at ${userConfigService.resource!.toString()}.`); });

        (this.instantiationService as any) = instantiationService;
        (this.environmentService as any) = environmentService;
        (this.fileService as any) = fileService;
        (this.globalConfigService as any) = globalConfigService;
        (this.userConfigService as any) = userConfigService;
        (this.logService as any) = logService;
    }
    
    private async initServices(): Promise<any> {
        
        return Promise.allSettled<any>([
            /**
             * At the very beginning state of the program, we need to initialize
             * all the necessary directories first. We need to ensure each one 
             * is created successfully.
             */
            Promise.all<string | undefined>([
                this.environmentService.logPath,
                this.environmentService.appSettingPath
            ].map(path => mkdir(URI.toFsPath(path), { recursive: true }))),

            // reading all the configurations from the application and users
            this.globalConfigService.init(this.environmentService.appSettingPath),
            this.userConfigService.init(this.environmentService.appSettingPath),
        ]);
    }

    // [private helper methods]

    // private __getMainArguments

    // [private exception helper methods]

} {}; /** @readonly ❤hello, world!❤ */
