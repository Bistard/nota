import { debug } from "console";
import { Debugger } from "electron";
import { format } from "path/posix";
//import { writeToFile } from "src/base/node/file";
import { LogPathType, LogInfo } from "src/code/common/service/logInfo";
import { LogServiceManager } from "./logServiceManager";

enum LogLevel {
    TRACE,
    DEBUG,
    INFO,
    WARN,
    ERROR,
    CRITICAL
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

    
    trace(message: string, ...args: any[]): void {

    }
	
	debug(message: Error, ...args: any[]): void {
        
    }

	info(message: string, ...args: any[]): void {
        const formatted_msg: string = `[info] [${message}] [{...args}]`;
        LogServiceManager.Instance.addLogService({message: formatted_msg, path: LogPathType.NOTEBOOKMANAGER} as LogInfo);
    }

	warn(message: string, ...args: any[]): void {
        
    }

	error(err: Error, date: Date, underDir: LogPathType): void {
        const dateInfo = date.toISOString().slice(0, 10);
        let writeToDir = LogPathType.NOTEBOOKMANAGER;
        const formatted_msg: string = `[info] ${dateInfo}
        Log Message: ${err.name}  ${err.message} ${err.stack}`;
        LogServiceManager.Instance.addLogService({message: formatted_msg, date: date, path: underDir} as LogInfo);
    }

	critical(message: string | Error, ...args: any[]): void {
        
    }
}















// throw "error";
//fls1.info('message');
// fls1 = new LogInfo(Service, "debug");
// addLogService()

// fls1 = new SpecificService("message", ..., "debug");
// for () {
//     .startWriting("debug") {
//         .debug()
//     }
// }
