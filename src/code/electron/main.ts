import { BrowserWindow, ipcMain, app, dialog } from 'electron';
import { homedir, tmpdir } from 'os';
import { ErrorHandler } from 'src/base/common/error';
import { join, resolve } from 'src/base/common/file/path';
import { Schemas } from 'src/base/common/file/uri';
import { IpcChannel } from 'src/base/common/ipcChannel';
import { ILogService, LogLevel, PipelineLogger } from 'src/base/common/logger';
import { DiskFileSystemProvider } from 'src/base/node/diskFileSystemProvider';
import { FileService, IFileService } from 'src/code/common/service/fileService/fileService';
import { IInstantiationService, InstantiationService } from 'src/code/common/service/instantiationService/instantiation';
import { ServiceCollection } from 'src/code/common/service/instantiationService/serviceCollection';
import { ILoggerService } from 'src/code/common/service/logService/abstractLoggerService';
import { ConsoleLogger } from 'src/code/common/service/logService/consoleLoggerService';
import { FileLoggerService } from 'src/code/common/service/logService/fileLoggerService';
import { IEnvironmentService } from 'src/code/platform/enviroment/common/environment';
import { MainEnvironmentService } from 'src/code/platform/enviroment/electron/mainEnvironmentService';

/**
 * @class // TODO
 */
const nota = new class extends class MainProcess {

    // [constructor]

    constructor() {
        try {
            
            ErrorHandler.setUnexpectedErrorExternalCallback(err => console.error(err));
            this.initialization();

        } catch (unexpectedError: any) {

            /**
             * Once reach here, there is no any other precautions to prevent 
             * this error, this is the final catch scope and we must exit the 
             * whole program immediately.
             */

            console.error(unexpectedError.message ?? 'unknown error message');
            app.exit(1);
        }
    }

    // [private methods]

    private initialization(): void {
        const services = this.createCoreServices();
        // TODO
    }

    /**
     * @description // TODO
     */
    private createCoreServices(): [IInstantiationService] {
        
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
        const pipelineLogService = new PipelineLogger([fileLogger, new ConsoleLogger()]);
        instantiationService.register(ILogService, pipelineLogService);
        
        // configuration
        // TODO

        // lifeCycle
        // TODO

        return [instantiationService];
    }

    // [private helper methods]

    // private __getMainArguments

    // [private exception helper methods]

} {}; /** @readonly ❤hello, world!❤ */
