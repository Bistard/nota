import { APP_ROOT_PATH } from "src/base/electron/app";
import { AbstractLogService, IAbstractLogService, ILogInfo, LogLevel } from "src/code/common/service/logService/abstractLogService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";
import { EGlobalSettings, IGlobalConfigService, IGlobalNotebookManagerSettings, LOCAL_NOTA_DIR_NAME } from "src/code/common/service/configService/configService";
import { FileService, IFileService } from 'src/code/common/service/fileService/fileService';
import { URI } from "src/base/common/file/uri";
import { getCurrentFormatDate } from "src/base/common/date";
import { DataBuffer } from "src/base/common/file/buffer";
import { resolve } from "src/base/common/file/path";

export const IFileLogService = createDecorator<IFileLogService>('file-log-service');

export interface IFileLogInfo extends ILogInfo {
    path: URI;
};

export interface IFileLogService extends IAbstractLogService {
    
    getPath(): URI;
    
    setPath(path: URI): void;

    /**
     * @description trace logs trace-level (thorough debugging) logging messages.
     * @param message the output message.
     * @param filePath the path of the file.
     * @param path the path to be written in disk.
     */
    trace(message: string, filePath: string, path: URI): void;
	
    /**
     * @description debug logs debug-level (normal debugging) logging messages.
     * @param message the output message.
     * @param filePath the path of the file.
     * @param path the path to be written in disk.
     */
	debug(message: string, filePath: string, path: URI): void;

    /**
     * @description info logs info-level (tracking) logging messages.
     * @param message the output message.
     * @param filePath the path of the file.
     * @param path the path to be written in disk.
     */
	info(message: string, filePath: string, path: URI): void;

    /**
     * @description warn logs warn-level (might be a problem) logging messages.
     * @param message the output message.
     * @param filePath the path of the file.
     * @param path the path to be written in disk.
     */
	warn(message: string, filePath: string, path: URI): void;

    /**
     * @description error logs error-level (definitely needs investigation) logging messages.
     * @param message the output message.
     * @param err the error catched during execution.
     * @param filePath the path of the file.
     * @param path the path to be written in disk.
     */
	error(message: string, err: Error, filePath: string, path: URI): void;

    /**
     * @description fatal logs fatal-level (need urgent investigation) logging messages.
     * @param message 
     * @param err the error catched during execution.
     * @param filePath the path of the file.
     * @param path the path to be written in disk.
     */
	fatal(message: string, err: Error, filePath: string, path: URI): void;
}

/**
 * @description @class A logger that manages the log messages of the {@link FileService} 
 * related business.
 */
export class FileLogService extends AbstractLogService<IFileLogInfo> implements IFileLogService {
    
    // [fields]

    // the path to be written
    private path: URI;

    // [constructor]

    constructor(
        level: LogLevel,
        @IFileService private fileService: FileService,
        @IGlobalConfigService private globalConfigService: IGlobalConfigService,
    ) {
        super(level);

        const globalConfig = this.globalConfigService.get<IGlobalNotebookManagerSettings>(EGlobalSettings.NotebookManager);
        const defaultConfigOn = globalConfig.defaultConfigOn;
        if (defaultConfigOn) {
            this.path = URI.fromFile(resolve(APP_ROOT_PATH, LOCAL_NOTA_DIR_NAME));
        } else {
            // FIXME
            this.path = URI.fromFile(resolve(APP_ROOT_PATH, LOCAL_NOTA_DIR_NAME));
            // undefined
            // this.path = URI.fromFile(NotebookManager.rootPath); 
        }
    }

    // [methods - get / set]

    public getPath(): URI {
        return this.path;
    }

    public setPath(path: URI): void {
        this.path = path;
    }

    // [methods]

    public trace(message: string, filePath: string, path: URI): void {
        const dateInfo = getCurrentFormatDate();
        const formatted = `[trace] [file: ${filePath}] [${dateInfo}] - Message: ${message}`;
        this.log(LogLevel.TRACE, {output: formatted, path: path});
    }
	
    public debug(message: string, filePath: string, path: URI): void {
        const dateInfo = getCurrentFormatDate();
        const formatted = `[debug] [file: ${filePath}] [${dateInfo}] - Message: ${message}`;
        this.log(LogLevel.DEBUG, {output: formatted, path: path});
    }

    public info(message: string, filePath: string, path: URI = this.path): void {
        const dateInfo = getCurrentFormatDate();
        const formatted = `[info] [file: ${filePath}] [${dateInfo}] - Message: ${message}`;
        this.log(LogLevel.INFO, {output: formatted, path: path});
    }

	public warn(message: string, filePath: string, path: URI = this.path): void {
        const dateInfo = getCurrentFormatDate();
        const formatted = `[warning] [file: ${filePath}] [${dateInfo}] - Message: ${message}`;
        this.log(LogLevel.WARN, {output: formatted, path: path});
    }

    public error(message: string, err: Error, filePath: string, path: URI = this.path): void {
        const dateInfo = getCurrentFormatDate();
        const formatted = `[error] [file: ${filePath}] [${dateInfo}] - Message: ${message} Error: ${err.name} ${err.message} ${err.stack}`;
        this.log(LogLevel.ERROR, {output: formatted, path: path});
    }

	public fatal(message: string, err: Error, filePath: string, path: URI = this.path): void {
        const dateInfo = getCurrentFormatDate();
        const formatted = `[CRITICAL] [file: ${filePath}] [${dateInfo}] - Message: ${message} Error: ${err.name} ${err.message} ${err.stack}`;
        this.log(LogLevel.FATAL, {output: formatted, path: path});
    }

    protected async logger(logInfo: IFileLogInfo): Promise<void> {
        await this.fileService.writeFile(logInfo.path, DataBuffer.fromString(logInfo.output));
    }
}
