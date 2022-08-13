import { app, dialog, ipcMain } from 'electron';
import { mkdir } from 'fs/promises';
import { ErrorHandler } from 'src/base/common/error';
import { Event } from 'src/base/common/event';
import { Schemas, URI } from 'src/base/common/file/uri';
import { BufferLogger, ILogService, LogLevel, PipelineLogger } from 'src/base/common/logger';
import { Strings } from 'src/base/common/util/string';
import { DiskFileSystemProvider } from 'src/code/platform/files/node/diskFileSystemProvider';
import { GlobalConfigService, IGlobalConfigService, IUserConfigService, UserConfigService } from 'src/code/platform/configuration/electron/configService';
import { FileService, IFileService } from 'src/code/platform/files/common/fileService';
import { IInstantiationService, InstantiationService } from 'src/code/platform/instantiation/common/instantiation';
import { ServiceCollection } from 'src/code/platform/instantiation/common/serviceCollection';
import { ILoggerService } from 'src/code/platform/logger/common/abstractLoggerService';
import { ConsoleLogger } from 'src/code/platform/logger/common/consoleLoggerService';
import { FileLoggerService } from 'src/code/platform/logger/common/fileLoggerService';
import { NotaInstance } from 'src/code/electron/nota';
import { IEnvironmentService, IMainEnvironmentService } from 'src/code/platform/environment/common/environment';
import { MainEnvironmentService } from 'src/code/platform/environment/electron/mainEnvironmentService';
import { IMainLifeCycleService, MainLifeCycleService } from 'src/code/platform/lifeCycle/electron/mainLifeCycleService';
import { IMainStatusService, MainStatusService } from 'src/code/platform/status/electron/mainStatusService';
import { ICLIArguments } from 'src/code/platform/environment/common/argument';

interface IMainProcess {
    start(argv: ICLIArguments): void;
}

/**
 * @class The first entry of the application (except `main.js`). Responsible for 
 * two things:
 *      1. Initializations on core microservices of the application.
 *      2. Important disk directory preparation.
 */
const nota = new class extends class MainProcess implements IMainProcess {

    // [field]

    private readonly instantiationService!: IInstantiationService;
    private readonly environmentService!: IMainEnvironmentService;
    private readonly fileService!: IFileService;
    private readonly globalConfigService!: IGlobalConfigService;
    private readonly userConfigService!: IUserConfigService;
    private readonly logService!: ILogService;
    private readonly lifeCycleService!: IMainLifeCycleService;
    private readonly statusService!: IMainStatusService;

    private readonly CLIArgv!: ICLIArguments;

    // [constructor]

    constructor() {}

    public start(argv: ICLIArguments): void {
        (<any>this.CLIArgv) = argv;
        try {
            ErrorHandler.setUnexpectedErrorExternalCallback(err => console.error(err));
            this.run();
        } catch (unexpectedError: any) {
            console.error(unexpectedError.message ?? 'unknown error message');
            app.exit(1);
        }
    }

    // [private methods]

    private async run(): Promise<void> {
        
        /**
         * No error tolerance at this stage since all the work here are 
         * necessary for the future works.
         */
        let error: any;

        // core service construction / registration
        this.createCoreServices();
        
        // initialization
        try {
            ipcMain.on('nota:test', (event, data) => {
                console.log('nota:test ', data);
            });
            await this.initServices();
        } 
        catch (err) {
            this.__showDirectoryErrorDialog(err);
            error = err;
        }

        // application run
        try {
            Event.once(this.lifeCycleService.onWillQuit)(e => {
                this.fileService.dispose();
                this.userConfigService.dispose();
                this.globalConfigService.dispose();
            });

            const instance = this.instantiationService.createInstance(NotaInstance);
            instance.run();
        } 
        catch (err) {
            error = err;
        }

        // error handling
        if (error) {
            this.kill(error);
        }
    }

    /**
     * @description The very basic services that need to be created before 
     * everything.
     */
    private createCoreServices(): void {
        // dependency injection (DI)
        const serviceCollection = new ServiceCollection();
        const instantiationService = new InstantiationService(serviceCollection);
        instantiationService.register(IInstantiationService, instantiationService);
        
        // log-service
        const logService = new BufferLogger();
        instantiationService.register(ILogService, logService);

        // environment-service
        const environmentService = new MainEnvironmentService(this.CLIArgv, {}, logService);
        instantiationService.register(IEnvironmentService, environmentService);

        // file-service
        const fileService = new FileService(logService);
        fileService.registerProvider(Schemas.FILE, new DiskFileSystemProvider());
        instantiationService.register(IFileService, fileService);

        // logger-service
        const fileLoggerService = new FileLoggerService(environmentService.logLevel, instantiationService);
        instantiationService.register(ILoggerService, fileLoggerService);
        
        // pipeline-logger
        const pipelineLogger = new PipelineLogger([
            new ConsoleLogger(environmentService.mode === 'develop' ? environmentService.logLevel : LogLevel.WARN),
            fileLoggerService.createLogger(environmentService.logPath, { description: 'main-log', name: 'main-log.txt' }),
        ]);
        logService.setLogger(pipelineLogger);

        // global-config-service
        const globalConfigService = new GlobalConfigService(fileService, logService, environmentService);
        instantiationService.register(IGlobalConfigService, globalConfigService);
        
        // user-config-service
        const userConfigService = new UserConfigService(fileService, logService, environmentService);
        instantiationService.register(IUserConfigService, userConfigService);

        // life-cycle-service
        const lifeCycleService = new MainLifeCycleService(logService);
        instantiationService.register(IMainLifeCycleService, lifeCycleService);

        // status-service
        const statusService = new MainStatusService(fileService, logService, environmentService, lifeCycleService);
        instantiationService.register(IMainStatusService, statusService);

        (this.instantiationService as any) = instantiationService;
        (this.environmentService as any) = environmentService;
        (this.fileService as any) = fileService;
        (this.globalConfigService as any) = globalConfigService;
        (this.userConfigService as any) = userConfigService;
        (this.logService as any) = logService;
        (this.lifeCycleService as any) = lifeCycleService;
        (this.statusService as any) = statusService;
    }
    
    /**
     * @description Some services need to be initialized asynchronously once the 
     * services are created.
     */
    private async initServices(): Promise<any> {
        
        return Promise.all<any>([
            /**
             * At the very beginning state of the program, we need to initialize
             * all the necessary directories first. We need to ensure each one 
             * is created successfully.
             */
            Promise.all<string | undefined>([
                this.environmentService.logPath,
                this.environmentService.appConfigurationPath,
                this.environmentService.userDataPath,
            ].map(path => mkdir(URI.toFsPath(path), { recursive: true }))),

            this.statusService.init(),

            // reading all the configurations for the programs and users
            this.globalConfigService.init(),
            this.userConfigService.init(),            
        ]);
    }

    private kill(error: Error): void {
        if (error.stack) {
            this.logService.error(error.stack);
        } else {
            this.logService.error(`Main process error: ${error.toString()}`);
        }

        this.lifeCycleService.kill(1);
    }

    // [private helper methods]

    private __showDirectoryErrorDialog(error: any): void {
        
        const dir = [
            URI.toFsPath(this.environmentService.appRootPath), 
            URI.toFsPath(this.environmentService.logPath),
        ];

        dialog.showMessageBoxSync({
            title: 'nota',
            message: 'Unable to write to directories',
            detail: Strings.format('{0}\n\n Please make sure the following directories are writeable: \n\n{1}', [error.toString(), dir.join('\n')]),
            type: 'warning',
            buttons: ['close'],
        });
    }
} {}; /** @readonly ❤hello, world!❤ */

export default nota;