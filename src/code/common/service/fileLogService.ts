import { ILogService, LogInfo, LogPathType, LogService } from "src/code/common/service/logService";
import { INoteBookManagerService } from "src/code/common/model/notebookManager";
import { createDecorator } from "src/code/common/service/instantiation/decorator";

export const IFileLogService = createDecorator<IFileLogService>('file-log-service');

export interface IFileLogService extends ILogService {
    
}

export class FileLogService extends LogService implements IFileLogService {
    
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
        @INoteBookManagerService noteBookManagerService: INoteBookManagerService,
    ) {
        super(noteBookManagerService);
    }

    override trace(message: string, ...args: any[]): void {
        
    }
	
    override debug(message: string | Error, ...args: any[]): void {
        
    }

    // exception
    /**
     * 
     * @param message    the unformatted info we pass in
     * @param underDir is either appRootPath or NoteBookManagerDir
     * @param date the Date object that stores specific properties of timing the error occurred
     */
    override error(err: Error, date: Date, underDir: LogPathType): void {
        const dateInfo = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds;
        //date.toISOString().slice(0, 10);
        let writeToDir = LogPathType.NOTEBOOKMANAGER;
        const formatted_msg: string = `[error] ${dateInfo}
        Log Message: ${err.name}  ${err.message} ${err.stack}`;
        this._logServiceManager.pushLogInfo({message: formatted_msg, date: date, path: underDir} as LogInfo);
    }

	override info(message: string, ...args: any[]): void {
        
    }

	override warn(message: string, ...args: any[]): void {
        
    }

	

	override critical(message: string | Error, ...args: any[]): void {
        
    }
}
