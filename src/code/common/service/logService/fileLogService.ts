import { APP_ROOT_PATH } from "src/base/electron/app";
import { ILogService, LogInfo, LogPathType, LogService } from "src/code/common/service/logService/logService";
import { INoteBookManagerService, NoteBookManager } from "src/code/common/model/notebookManager";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";
import { EGlobalSettings, GlobalConfigService, IGlobalApplicationSettings, IGlobalConfigService } from "src/code/common/service/configService/configService";
import { FileService, IFileService } from 'src/code/common/service/fileService/fileService';
import { URI } from "src/base/common/file/uri";
import { FileNode } from "src/base/node/fileTree";


export const IFileLogService = createDecorator<IFileLogService>('file-log-service');

export interface IFileLogService extends ILogService {
    
}

export class FileLogService extends LogService implements IFileLogService {
    
    public path: URI;

    // whether opened by a manager OR just a tab
    // private _hasNoteBookManager: boolean;

    // // The Directory whether the log folder for this particular NoteBook is
    // private _noteBookLogDir: string;

    // // the path where actual log message is placed
    // private _loggerPath: string;

    // constructor(hasNoteBookManager, noteBookLogDir, loggerPath) {
    //     super();

    //     this._hasNoteBookManager = hasNoteBookManager;
    //     this._noteBookLogDir = noteBookLogDir;
    //     this._loggerPath = loggerPath;
    // }
    constructor(
        @IFileService fileService: FileService
    ) {
        super(/*noteBookManagerService, globalConfigService, */fileService);
        const globalConfigService = new GlobalConfigService(fileService);
        const globalConfig = globalConfigService.get<IGlobalApplicationSettings>(EGlobalSettings.Application)!;
        const defaultConfigOn = globalConfig.defaultConfigOn;

        if (defaultConfigOn) {
            this.path = URI.fromFile(APP_ROOT_PATH);
        } else {
            this.path = URI.fromFile(NoteBookManager.rootPath);
        }
    }

    /**
     * trace logs trace-level (thorough debugging) logging messages
     * @param message 
     * @param args 
     */
    public override trace(message: string, ...args: any[]): void {
    }
	
    /**
     * debug logs debug-level (normal debugging) logging messages
     * @param message 
     * @param args 
     */
    public override debug(message: string | Error, ...args: any[]): void {
        
    }

    /**
     * error logs error-level (definitely needs investigation) logging messages
     * @param message the message user wants to log
     * @param err the error catched during execution
     * @param filePath the path of the file whose operation causes the error
     * @param path the path of the file where the logging info will be written
     */
    public override error(message: string, err: Error, filePath: string, path: URI = this.path): void {
        const dateInfo = getDateInfo();
        const formatted_msg: string = `[error] [file: ${filePath}] ${dateInfo}
         - Log Message: ${message} Error: ${err.name} ${err.message} ${err.stack}`;
        this._logServiceManager.pushLogInfo({output: formatted_msg, path: path} as LogInfo);
    }

    /**
     * info logs info-level (tracking) logging messages
     * @param message 
     * @param filePath the path of the file whose operation causes the error
     * @param path the path of the file where the logging info will be written
     */
	public override info(message: string, filePath: string, path: URI = this.path): void {
        const dateInfo = getDateInfo();
        const formatted_msg: string = `[info] [file: ${filePath}] ${dateInfo}
         - Log Message: ${message}`;
        this._logServiceManager.pushLogInfo({output: formatted_msg, path: path} as LogInfo);
    }

    /**
     * warn logs warn-level (might be a problem) logging messages
     * @param message 
     * @param filePath the path of the file whose operation causes the error
     * @param path the path of the file where the logging info will be written
     */
	public override warn(message: string, filePath: string, path: URI = this.path): void {
        const dateInfo = getDateInfo();
        const formatted_msg: string = `[warning] [file: ${filePath}] ${dateInfo}
         - Log Message: ${message}`; // hello world / hello cindy
        this._logServiceManager.pushLogInfo({output: formatted_msg, path: path} as LogInfo);
    }

    /**
     * critical logs critical-level (need urgent investigation) logging messages
     * @param message 
     * @param err the error catched during execution
     * @param filePath the path of the file whose operation causes the error
     * @param path the path of the file where the logging info will be written
     */
	public override critical(message: string, err: Error, filePath: string, path: URI = this.path): void {
        const dateInfo = getDateInfo();
        const formatted_msg: string = `[CRITICAL] [file: ${filePath}] ${dateInfo}
         - Log Message: ${message} Error: ${err.name}  ${err.message} ${err.stack}`;
        this._logServiceManager.pushLogInfo({output: formatted_msg, path: path} as LogInfo);
    }

    
}

/**
 * 
 * @returns Date Object converted to LocaledString
 * @example "12/29/2021, 12:08:40 PM"
 */
function getDateInfo(): string {
    const date = new Date()
    return date.toLocaleString();
}
// onDidLogError