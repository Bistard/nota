import { APP_ROOT_PATH } from "src/base/electron/app";
import { posix } from 'src/base/common/file/path';
import { DataBuffer } from 'src/base/common/file/buffer';
import { INoteBookManagerService, NoteBookManager } from "src/code/common/model/notebookManager";
import { IGlobalConfigService, GlobalConfigService } from "src/code/common/service/configService/configService";
import { IFileLogService } from "./fileLogService";
import { FileService, IFileService } from 'src/code/common/service/fileService/fileService';
import { URI } from "src/base/common/file/uri";

export enum LogLevel {
    TRACE,
    DEBUG,
    INFO,
    WARN,
    ERROR,
    CRITICAL
}; 

export const enum LogPathType {
    APP,
    NOTEBOOKMANAGER
};

export interface LogInfo {
    output: string;
    path: URI;
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
    protected _logLevel: number | undefined;

    // solves singletion problem, so we always have at most one LogServiceManager when we create a logService
    constructor(
        // noteBookManagerService: INoteBookManagerService,
        // globalConfigService: GlobalConfigService,
        fileService: FileService
    ) {
        this._logServiceManager = createOrGetLogServiceManager(
            /*noteBookManagerService, globalConfigService, */fileService);
    }

    /**
     * __pushLog pushed logInfo to _logServiceManager and prints out the 
     * output of the logInfo to the console
     * @param logInfo the logging info
     */
    protected __pushLog(logInfo: LogInfo, loggingLevel: number) {
        if (this._logLevel && loggingLevel >= this._logLevel) { // type-checking
            this._logServiceManager.pushLogInfo(logInfo);
            console.log(logInfo.output);
        }
        
    }

    public getPushedLog(): LogInfo{
        return this._logServiceManager.peek();
    }

    trace(...args: any[]): void {
    }
	
	debug(...args: any[]): void {
        
    }

	info(...args: any[]): void {
    }

	warn(...args: any[]): void {
        
    }

	error(...args: any[]): void {
    }

    critical(...args: any[]): void {
    }

    /**
     * 
     * @param level 
     */
    public setLevel(level: number) {
        this._logLevel = level;
    }

    public getLogLevel(): number {
        return this._logLevel as number;
    }
}

/**
 * @description must obtain LogService only from this function
 * @param ctor a constructor
 * @param args arguments to be passed to the constructor
 * @returns an existing LogServiceManager or a newly constructed one
 */
function createOrGetLogServiceManager<T extends LogServiceManager>(ctor: any, ...args: any[]): LogServiceManager {
    if (_logServiceManagerInstance === null) {
        _logServiceManagerInstance = <T>new ctor(...args);
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
        // private readonly noteBookManagerService: INoteBookManagerService,
        // private readonly globalConfigService: GlobalConfigService,
        private readonly fileService: FileService
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

    public peek(): LogInfo {
        return this._queue[-1] as LogInfo;
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
            // this._ongoing = true;
            // const logInfo = this._queue[0]!;
            
            // let dir: string;
            // if (this.globalConfigService.defaultConfigOn) {
            //     dir = APP_ROOT_PATH; 
            //     const mdNoteExists = await isDirExisted(dir, ".mdnote");
            //     if (!mdNoteExists) {
            //         await createDir(dir, ".mdnote");
            //     }  
            // } else {
            //     // dir = this.noteBookManagerService.getRootPath();
            //     dir = NoteBookManager.rootPath;
            // }
            
            // dir = pathJoin(dir, ".mdnote");
            // const res = await isDirExisted(dir, "log");
            // if (!res) {
            //     await createDir(dir, "log");
            // }
            
            // const path = pathJoin(dir, "log");
            // writeToFile(path, logInfo.date.toISOString().slice(0, 10) + '.json', logInfo.message)
            // .then(() => {
            //     this._queue.shift();
            //     this._ongoing = false;
            // });

            this._ongoing = true;
            const logInfo = this._queue[0]!;
           
            this.fileService.writeFile(logInfo.path, DataBuffer.fromString(logInfo.output))
            .then(() => {
                this._queue.shift();
                this._ongoing = false;
            });
        } catch (err) {
            // do log here
        }

    }
}

