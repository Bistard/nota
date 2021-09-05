import { APP_ROOT_PATH } from "src/base/electron/app";
import { isDirExisted, createDir, writeToFile } from "src/base/node/file";
import { LogPathType, LogInfo } from "src/code/common/service/logInfo";
import { pathJoin } from "src/base/common/string";
import { INoteBookManagerService, NoteBookManager } from "src/code/common/model/notebookManger";


// in another module
// singleton ??
// 用 setInterval来持续check queue里的状态
export class LogServiceManager {
    private static _instance: LogServiceManager;
    private _LogInfos: LogInfo[]; 
    private _ongoing: boolean = false;

    private constructor(
        @INoteBookManagerService private readonly noteBookManagerService: INoteBookManagerService
    ) {
        this._LogInfos = [];
        setInterval(this.checkServiceQueue.bind(this), 1000);
    }

    public static get Instance() {
        return this._instance;
        //|| (this._instance = new this());
    }

    public isEmpty() {
        return !this._LogInfos.length;
    }


    public checkServiceQueue() {
        if (!this.isEmpty() && !this._ongoing) {
            this.processServiceQueue();
        }
        //setInterval(this.processServiceQueue(), 1000);
    }

    
    // public pop():void {
    //     // const item = this._logServices.pop()!;
    //     // const service = item.service;
    //     // switch (item.type) {
    //     //     case 'fino':
                
    //     //         break;
        
    //     //     default:
    //     //         break;
    //     // }
    //     // service.info(item.message);
    // }


    // add a new logService to _logServices
    public addLogService(logInfo: LogInfo) {
        this._LogInfos.push(logInfo);
    }

    /**
     * @description
     * remove the log that has finished writing, then call next log's startR
     */
    public processServiceQueue() {
        this._ongoing = true;
        const logInfo = this._LogInfos[0];
        let path;
        let dir: string;
        if (logInfo!.path = LogPathType.APP) {
            dir = APP_ROOT_PATH;

            if (!isDirExisted(dir, "log")) {
                createDir(dir, "log");
            }

            path = pathJoin(dir, "log");
        } else {
            // 拿notebookmanager的path然后join "mdnote/log"
            //dir = ;
            dir = this.noteBookManagerService.noteBookManagerRootPath;
            if (!isDirExisted(dir, "log")) {
                createDir(dir, "log");
            }

            path = pathJoin(dir, "log");
        }

        writeToFile(dir, logInfo!.date.toISOString().slice(0, 10), logInfo!.message)
        .then(() => {
            this._LogInfos.shift();
            this._ongoing = false;
            
        });


    }
}

//
