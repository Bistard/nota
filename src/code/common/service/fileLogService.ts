import { LogService } from "src/code/common/service/logService";
import { LogServiceManager } from "src/code/common/service/logServiceManager";
import { LogPathType, LogInfo } from "src/code/common/service/logInfo";

export class FileLogService extends LogService {
    private static _instance: FileLogService;
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
    constructor() {
        super();
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
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
        LogServiceManager.Instance.addLogService({message: formatted_msg, date: date, path: underDir} as LogInfo);
    }

	override info(message: string, ...args: any[]): void {
        
    }

	override warn(message: string, ...args: any[]): void {
        
    }

	

	override critical(message: string | Error, ...args: any[]): void {
        
    }
}
