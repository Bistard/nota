import { app, dialog } from 'electron';
import { createServer, Server } from 'net';
import { mkdir } from 'fs/promises';
import { ErrorHandler, ExpectedError, isExpectedError } from 'src/base/common/error';
import { Event } from 'src/base/common/event';
import { Schemas, URI } from 'src/base/common/file/uri';
import { BufferLogger, ILogService, LogLevel, PipelineLogger } from 'src/base/common/logger';
import { Strings } from 'src/base/common/util/string';
import { DiskFileSystemProvider } from 'src/code/platform/files/node/diskFileSystemProvider';
import { FileService, IFileService } from 'src/code/platform/files/common/fileService';
import { IInstantiationService, InstantiationService } from 'src/code/platform/instantiation/common/instantiation';
import { ServiceCollection } from 'src/code/platform/instantiation/common/serviceCollection';
import { ILoggerService } from 'src/code/platform/logger/common/abstractLoggerService';
import { ConsoleLogger } from 'src/code/platform/logger/common/consoleLoggerService';
import { FileLoggerService } from 'src/code/platform/logger/common/fileLoggerService';
import { NotaInstance } from 'src/code/electron/nota';
import { ApplicationMode, IEnvironmentOpts, IEnvironmentService, IMainEnvironmentService } from 'src/code/platform/environment/common/environment';
import { MainEnvironmentService } from 'src/code/platform/environment/electron/mainEnvironmentService';
import { IMainLifecycleService, MainLifecycleService } from 'src/code/platform/lifecycle/electron/mainLifecycleService';
import { IMainStatusService, MainStatusService } from 'src/code/platform/status/electron/mainStatusService';
import { ICLIArguments } from 'src/code/platform/environment/common/argument';
import { ProcessKey } from 'src/base/common/process';
import { getFormatCurrTimeStamp } from 'src/base/common/date';
import { EventBlocker } from 'src/base/common/util/async';
import { IConfigurationService, MainConfigurationService } from 'src/code/platform/configuration/common/configurationService';

interface IMainProcess {
    start(argv: ICLIArguments): Promise<void>;
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
    private readonly configurationService!: IConfigurationService;
    private readonly logService!: ILogService;
    private readonly lifecycleService!: IMainLifecycleService;
    private readonly statusService!: IMainStatusService;
    private readonly CLIArgv!: ICLIArguments;

    // [constructor]

    constructor() {}

    // [public methods]

    public async start(argv: ICLIArguments): Promise<void> {
        (<any>this.CLIArgv) = argv;
        try {
            ErrorHandler.setUnexpectedErrorExternalCallback(err => console.error(err));
            await this.run();
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

        // core service construction / registration
        this.createCoreServices();
        
        try {
            
            // initialization
            try {
                await this.initServices();
            } catch (error) {
                this.__showDirectoryErrorDialog(error);
                throw error;
            }
            
            // application run
            {
                Event.once(this.lifecycleService.onWillQuit)(e => {
                    // release all the watching resources
                    e.join(new EventBlocker(this.fileService.onDidAllResourceClosed).waiting());
                    this.fileService.dispose();
                    
                    // flush all the logging messages before we quit
                    e.join(this.logService.flush().then(() => this.logService.dispose()));
                });
                
                await this.resolveSingleApplication();
    
                const instance = this.instantiationService.createInstance(NotaInstance);
                await instance.run();
            }
        } 
        catch (error: any) {
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
        const environmentService = new MainEnvironmentService(this.CLIArgv, this.__getEnvInfo(), logService);
        instantiationService.register(IEnvironmentService, environmentService);

        // file-service
        const fileService = new FileService(logService);
        fileService.registerProvider(Schemas.FILE, new DiskFileSystemProvider(logService));
        instantiationService.register(IFileService, fileService);

        // logger-service
        const fileLoggerService = new FileLoggerService(environmentService.logLevel, instantiationService);
        instantiationService.register(ILoggerService, fileLoggerService);
        
        // pipeline-logger
        const pipelineLogger = new PipelineLogger([
            // console-logger
            new ConsoleLogger(environmentService.mode === ApplicationMode.DEVELOP ? environmentService.logLevel : LogLevel.WARN),
            // file-logger
            fileLoggerService.createLogger(environmentService.logPath, { description: 'main', name: `main-${getFormatCurrTimeStamp()}.txt` }),
        ]);
        logService.setLogger(pipelineLogger);

        // life-cycle-service
        const lifecycleService = new MainLifecycleService(logService);
        instantiationService.register(IMainLifecycleService, lifecycleService);

        // main-configuration-service
        const configurationService = new MainConfigurationService(environmentService.appConfigurationPath, fileService, logService);
        instantiationService.register(IConfigurationService, configurationService);

        // status-service
        const statusService = new MainStatusService(fileService, logService, environmentService, lifecycleService);
        instantiationService.register(IMainStatusService, statusService);

        (this.instantiationService as any) = instantiationService;
        (this.environmentService as any) = environmentService;
        (this.fileService as any) = fileService;
        (this.configurationService as any) = configurationService;
        (this.logService as any) = logService;
        (this.lifecycleService as any) = lifecycleService;
        (this.statusService as any) = statusService;
    }
    
    /**
     * @description Some services need to be initialized asynchronously once the 
     * services are created.
     */
    private async initServices(): Promise<any> {
        
        return Promise.all([
            /**
             * At the very beginning state of the program, we need to initialize
             * all the necessary directories first. We need to ensure each one 
             * is created successfully.
             */
            Promise.all([
                this.environmentService.logPath,
                this.environmentService.appConfigurationPath,
                this.environmentService.userDataPath,
            ].map(path => mkdir(URI.toFsPath(path), { recursive: true }))),

            this.statusService.init(),
            this.configurationService.init(),
        ]);
    }

    private async resolveSingleApplication(): Promise<void> {

        try {
            /**
             * Each nota application will try to listen to the same socket file
             * or pipe. If an error is catched with code `EADDRINUSE`, it means 
             * there is already an application is running, we should terminate 
             * since we only accept one single application.
             */
            const server = await new Promise<Server>((resolve, reject) => {
                const tcpServer = createServer();
                tcpServer.on('error', reject);
                tcpServer.listen(this.environmentService.mainIpcHandle, () => {
                    tcpServer.removeListener('error', reject);
                    resolve(tcpServer);
                });
            });
            Event.once(this.lifecycleService.onWillQuit)(() => server.close());
        } 
        catch (error: any) {
            // unexpected errors
            if (error.code !== 'EADDRINUSE') {
                this.logService.error(error);
                throw error;
            }

            // there is a running nota application, we stop the current application.
            throw new ExpectedError('There is an application running, we are terminating...');
        }

        // we are the first running application under the current version.
        this.logService.debug('Running as the first application.');
        process.env[ProcessKey.PID] = String(process.pid);
        return;
    }

    private kill(error: Error): void {
        let code = 0;
        
        if (isExpectedError(error)) {
            if (error.message) {
                this.logService.trace(`${error.message}`);
            }
        }
        else {
            code = 1;
            if (error.stack) {
                this.logService.error(error.stack);
            } else {
                this.logService.error(`Main process error: ${error.toString()}`);
            }
        }

        this.lifecycleService.kill(code);
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

    private __getEnvInfo(): IEnvironmentOpts {
        return {
            isPackaged: app.isPackaged,
            userHomePath: app.getPath('home'),
            tmpDirPath: app.getPath('temp'),
            appRootPath: app.getAppPath(),
            userDataPath: app.getPath('userData'),
        };
    }
} {}; /** @readonly ❤hello, world!❤ */

export default nota;