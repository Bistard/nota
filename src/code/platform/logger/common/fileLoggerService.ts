import { getCurrTimeStamp } from "src/base/common/date";
import { DataBuffer } from "src/base/common/file/buffer";
import { ByteSize, FileOperationError, FileOperationErrorType } from "src/base/common/file/file";
import { basename, join, parse, ParsedPath } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { AbstractLogger, ILogger, ILoggerOpts, LogLevel, parseLogLevel } from "src/base/common/logger";
import { AsyncQueue, Blocker } from "src/base/common/util/async";
import { Strings } from "src/base/common/util/string";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { AbstractLoggerService } from "src/code/platform/logger/common/abstractLoggerService";

export const MAX_LOG_SIZE = 5 * ByteSize.MB;

/**
 * @class The logger has ability to write log into disk. The log writing process
 * is asynchronous and guarantees each log is written in succession.
 * 
 * @note Once the logger created, the corresponding URI will be created into the 
 * disk first.
 * 
 * @note Once the corresponding URI exceeds {@link MAX_LOG_SIZE}, the current
 * content will be rewritten into a new backup URI under the same directory.
 * It is repeatable by incrementing the basename of the URI.
 * 
 * @note Once the application lifecycle ends, the increment on the backup URI 
 * will be reset.
 */
export class FileLogger extends AbstractLogger implements ILogger {

    // [field]

    private readonly _description: string;
    private readonly _uri: URI;
    private readonly _queue: AsyncQueue<void>;

    private _initPromise?: Promise<void>;
    private _backupCnt: number;
    private _backupExt: string;
    private readonly _noFormatter: boolean;

    // [cosntructor]

    constructor(
        uri: URI,
        description: string,
        level: LogLevel,
        noFormatter: boolean,
        @IFileService private readonly fileService: IFileService
    ) {
        super(level);
        this._description = description;
        this._uri = uri;

        this._queue = new AsyncQueue();
        this._backupCnt = 1;
        this._backupExt = '';
        this._noFormatter = noFormatter;

        this._initPromise = new Promise(async (resolve, reject) => {
            try {
                await this.fileService.createFile(uri, DataBuffer.alloc(0), { overwrite: false });
            } catch (error) {
                // ignore when the file already exists
                if ((<FileOperationError>error).operation !== FileOperationErrorType.FILE_EXISTS) {
                    reject(error);
                }
            }
            resolve();  
        });
    }

    // [public methods]

    public trace(message: string, ...args: any[]): void {
        if (this.getLevel() <= LogLevel.TRACE) {
			this.__log(LogLevel.TRACE, Strings.stringify(message, ...args));
		}
    }

    public debug(message: string, ...args: any[]): void {
        if (this.getLevel() <= LogLevel.DEBUG) {
			this.__log(LogLevel.DEBUG, Strings.stringify(message, ...args));
		}
    }

    public info(message: string, ...args: any[]): void {
        if (this.getLevel() <= LogLevel.INFO) {
			this.__log(LogLevel.INFO, Strings.stringify(message, ...args));
		}
    }

    public warn(message: string, ...args: any[]): void {
        if (this.getLevel() <= LogLevel.WARN) {
			this.__log(LogLevel.WARN, Strings.stringify(message, ...args));
		}
    }

    public error(message: string | Error, ...args: any[]): void {
        if (this.getLevel() <= LogLevel.ERROR) {
			if (message instanceof Error) {
				message = message.stack!;
				this.__log(LogLevel.ERROR, Strings.stringify(message, ...args));
			} else {
				this.__log(LogLevel.ERROR, Strings.stringify(message, ...args));
			}
		}
    }

    public fatal(message: string | Error, ...args: any[]): void {
        if (this.getLevel() <= LogLevel.FATAL) {
			if (message instanceof Error) {
				message = message.stack!;
				this.__log(LogLevel.FATAL, Strings.stringify(message, ...args));
			} else {
				this.__log(LogLevel.FATAL, Strings.stringify(message, ...args));
			}
		}
    }

    public async flush(): Promise<void> {
        const blocker = new Blocker<void>();
        this._queue.onDidFlush(() => blocker.resolve());
        return blocker.waiting();
    }

    // [private helper methods]

    /**
     * @description Logs the given message asynchronously and guarantees process
     * each log in succession.
     * @param level The level of the message.
     * @param message The raw message in string.
     */
    private __log(level: LogLevel, message: string): void {
        
        this._queue.queue(async () => {
            
            if (this._initPromise) {
                await this._initPromise;
                this._initPromise = undefined;
            }

            if (this._noFormatter === false) {
                message = `[${getCurrTimeStamp()}] [${this._description}] [${parseLogLevel(level)}] ${message}\n`;
            }

            let content = (await this.fileService.readFile(this._uri)).toString();
            if (content.length >= MAX_LOG_SIZE) {
                this.fileService.writeFile(this.__getBackupURI(), DataBuffer.fromString(content), { create: true, overwrite: true, unlock: true });
                content = '';
            }

            content += message;
            await this.fileService.writeFile(this._uri, DataBuffer.fromString(content), { create: false, overwrite: true, unlock: true });
        });
    }

    private __getBackupURI(): URI {
        if (this._backupCnt > 10) {
            this._backupCnt = 1;
            this._backupExt += `_${10}`;
        }
        
        const oldURI = URI.toFsPath(this._uri);
        const result = parse(oldURI) as ParsedPath;
        const newURI = URI.fromFile(join(result.dir, `${result.name}${this._backupExt}_${this._backupCnt}${result.ext}`));
        
        this._backupCnt++;
        return newURI;
    }
}

/**
 * @class The logger service that able to create a {@link FileLogger} which has
 * ability to write messages into disk.
 */
export class FileLoggerService extends AbstractLoggerService {

    constructor(
        level: LogLevel,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
    ) {
        super(level);
    }

    protected override __doCreateLogger(uri: URI, level: LogLevel, opts: ILoggerOpts): ILogger {
        const name = opts.name ?? basename(URI.toString(uri));
        const logger = this.instantiationService.createInstance(
            FileLogger,
            URI.fromFile(join(URI.toFsPath(uri), name)),
            opts.description ?? opts.name ?? 'No Description',
            level,
            opts.noFormatter ?? false
        );
        return logger;
    }

}