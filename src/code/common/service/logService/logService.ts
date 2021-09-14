import { debug } from "console";
import { Debugger } from "electron";
import { format } from "path/posix";
import { APP_ROOT_PATH } from "src/base/electron/app";
import { isDirExisted, createDir, writeToFile } from "src/base/node/io";
import { pathJoin } from "src/base/common/string";
import { INoteBookManagerService, NoteBookManager } from "src/code/common/model/notebookManager";
import { GlobalConfigService, IGlobalConfigService } from "src/code/common/service/configService/globalConfigService";

enum LogLevel {
    TRACE,
    DEBUG,
    INFO,
    WARN,
    ERROR,
    CRITICAL
}; 

export enum LogPathType {
    APP,
    NOTEBOOKMANAGER
};

export interface LogInfo {
    message: string;
    date: Date;
    path: LogPathType;    
};

export interface ILogService {
    trace(message: string, ...args: any[]): void;
	
	debug(message: Error, ...args: any[]): void;

	info(message: string, ...args: any[]): void;

	warn(message: string, ...args: any[]): void;

	error(message: string | Error, ...args: any[]): void;

	critical(message: string | Error, ...args: any[]): void;

	//flush(): void;

	//format(args: any): string;
}

export abstract class LogService implements ILogService {

    // startWriting(message: string, func: (message: string, ...args: any[]) => void, ...args: any[]) {
    //     func(message, ...args);
    // }

    protected _logServiceManager: LogServiceManager;

    // solves singletion problem, so we always have at most one LogServiceManager when we create a logService
    constructor(
        @INoteBookManagerService noteBookManagerService: INoteBookManagerService,
        @IGlobalConfigService globalConfigService: GlobalConfigService,
    ) {
        this._logServiceManager = createOrGetLogServiceManager(noteBookManagerService, globalConfigService);
    }

    
    trace(message: string, ...args: any[]): void {

    }
	
	debug(message: Error, ...args: any[]): void {
        
    }

	info(message: string, ...args: any[]): void {
        const formatted_msg: string = `[info] [${message}] [${args}]`;
        this._logServiceManager.pushLogInfo({message: formatted_msg, path: LogPathType.NOTEBOOKMANAGER} as LogInfo);
    }

	warn(message: string, ...args: any[]): void {
        
    }

	error(err: Error, date: Date, underDir: LogPathType): void {
        const dateInfo = date.toISOString().slice(0, 10);
        let writeToDir = LogPathType.NOTEBOOKMANAGER;
        const formatted_msg: string = `[info] ${dateInfo}
        Log Message: ${err.name}  ${err.message} ${err.stack}`;
        this._logServiceManager.pushLogInfo({message: formatted_msg, date: date, path: underDir} as LogInfo);
    }

	critical(message: string | Error, ...args: any[]): void {
        
    }
}

function createOrGetLogServiceManager(noteBookManagerService: INoteBookManagerService, globalConfigService: GlobalConfigService): LogServiceManager {
    if (_logServiceManagerInstance === null) {
        _logServiceManagerInstance = new LogServiceManager(noteBookManagerService, globalConfigService);
    }
    return _logServiceManagerInstance;
}

let _logServiceManagerInstance: LogServiceManager| null = null;

/**
 * @internal
 */
class LogServiceManager {
    
    private _queue: LogInfo[] = [];
    private _ongoing: boolean = false;

    constructor(
        private readonly noteBookManagerService: INoteBookManagerService,
        private readonly globalConfigService: GlobalConfigService,
    ) {
        setInterval(this.checkQueue.bind(this), 1000);
    }

    public isEmpty(): boolean {
        return !this._queue.length;
    }

    public checkQueue(): void {
        if (!this.isEmpty() && !this._ongoing) {
            this.processQueue();
        }
    }

    // add a new logService to _logServices
    public pushLogInfo(logInfo: LogInfo): void {
        this._queue.push(logInfo);
    }

    /**
     * @description remove the log that has finished writing, then call next log's startR
     */
    public async processQueue(): Promise<void> {
        try {
            this._ongoing = true;
            const logInfo = this._queue[0]!;
            
            let dir: string;
            if (this.globalConfigService.defaultConfigOn) {
                dir = APP_ROOT_PATH; 
                const mdNoteExists = await isDirExisted(dir, ".mdnote");
                if (!mdNoteExists) {
                    await createDir(dir, ".mdnote");
                }  
            } else {
                // dir = this.noteBookManagerService.getRootPath();
                dir = NoteBookManager.rootPath;
            }
            
            dir = pathJoin(dir, ".mdnote");
            const res = await isDirExisted(dir, "log");
            if (!res) {
                await createDir(dir, "log");
            }
            
            const path = pathJoin(dir, "log");
            writeToFile(path, logInfo.date.toISOString().slice(0, 10) + '.json', logInfo.message)
            .then(() => {
                this._queue.shift();
                this._ongoing = false;
            });
        } catch (err) {
            // do log here
        }

    }
}

