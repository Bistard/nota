import { DataBuffer } from "src/base/common/file/buffer";
import { ByteSize } from "src/base/common/file/file";
import { basename, dirname, join } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { AbstractLogger, ILogger, ILoggerOpts, LogLevel, parseLogLevel } from "src/base/common/logger";
import { AsyncQueue } from "src/base/common/util/async";
import { String } from "src/base/common/util/string";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { IInstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { AbstractLoggerService } from "src/code/common/service/logService/abstractLoggerService";

export const MAX_LOG_SIZE = ByteSize.MB * 10;

/**
 * @class // TODO
 */
export class FileLogger extends AbstractLogger implements ILogger {

    // [field]

    private readonly _name: string;
    private readonly _uri: URI;
    private readonly _queue: AsyncQueue<void>;

    private readonly _initPromise: Promise<void>;
    private _backupCnt: number;
    private readonly _noFormatter: boolean;

    // [cosntructor]

    constructor(
        name: string,
        uri: URI,
        level: LogLevel,
        noFormatter: boolean,
        @IFileService private readonly fileService: IFileService
    ) {
        super(level);
        this._name = name;
        this._uri = uri;
        this._queue = new AsyncQueue();
        this._backupCnt = 1;
        this._noFormatter = noFormatter;

        this._initPromise = new Promise(async () => {
            await this.fileService.createFile(uri);
        });
    }

    // [public methods]

    public trace(message: string, ...args: any[]): void {
        if (this.getLevel() <= LogLevel.TRACE) {
			this.__log(LogLevel.TRACE, String.stringify(message, ...args));
		}
    }

    public debug(message: string, ...args: any[]): void {
        if (this.getLevel() <= LogLevel.DEBUG) {
			this.__log(LogLevel.DEBUG, String.stringify(message, ...args));
		}
    }

    public info(message: string, ...args: any[]): void {
        if (this.getLevel() <= LogLevel.INFO) {
			this.__log(LogLevel.INFO, String.stringify(message, ...args));
		}
    }

    public warn(message: string, ...args: any[]): void {
        if (this.getLevel() <= LogLevel.WARN) {
			this.__log(LogLevel.WARN, String.stringify(message, ...args));
		}
    }

    public error(message: string | Error, ...args: any[]): void {
        if (this.getLevel() <= LogLevel.ERROR) {
			if (message instanceof Error) {
				message = message.stack!;
				this.__log(LogLevel.ERROR, String.stringify(message, ...args));
			} else {
				this.__log(LogLevel.ERROR, String.stringify(message, ...args));
			}
		}
    }

    public fatal(message: string | Error, ...args: any[]): void {
        if (this.getLevel() <= LogLevel.FATAL) {
			if (message instanceof Error) {
				message = message.stack!;
				this.__log(LogLevel.FATAL, String.stringify(message, ...args));
			} else {
				this.__log(LogLevel.FATAL, String.stringify(message, ...args));
			}
		}
    }

    // [private helper methods]

    /**
     * @description Logging the given message // TODO
     * @param level 
     * @param message 
     */
    private __log(level: LogLevel, message: string): void {
        this._queue.push(async () => {
            await this._initPromise;

            if (this._noFormatter === false) {
                message = `[${this.__getCurrentTimeStamp()}] [${this._name}] [${parseLogLevel(level)}] ${message}\n`;
            }

            let content = (await this.fileService.readFile(this._uri)).toString();
            if (content.length >= MAX_LOG_SIZE) {
                this.fileService.writeFile(this.__getBackupURI(), DataBuffer.fromString(content));
                content = '';
            }

            content += message;
            await this.fileService.writeFile(this._uri, DataBuffer.fromString(content));
        });
    }

    /**
     * @description // TODO
     * @returns 
     */
    private __getCurrentTimeStamp(): string {
		const toTwoDigits = (v: number) => v < 10 ? `0${v}` : v;
		const toThreeDigits = (v: number) => v < 10 ? `00${v}` : v < 100 ? `0${v}` : v;
		const currentTime = new Date();
		return `${currentTime.getFullYear()}-${toTwoDigits(currentTime.getMonth() + 1)}-${toTwoDigits(currentTime.getDate())} ${toTwoDigits(currentTime.getHours())}:${toTwoDigits(currentTime.getMinutes())}:${toTwoDigits(currentTime.getSeconds())}.${toThreeDigits(currentTime.getMilliseconds())}`;
	}

    private __getBackupURI(): URI {
        this._backupCnt %= 10;
        const oldURI = this._uri.toString();
        return URI.fromFile(join(dirname(oldURI), `${basename(oldURI)}_${this._backupCnt++}`));
    }
}

export class FileLoggerService extends AbstractLoggerService {

    constructor(
        level: LogLevel,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
    ) {
        super(level);
    }

    protected override __doCreateLogger(uri: URI, level: LogLevel, opts: ILoggerOpts): ILogger {
        const logger = this.instantiationService.createInstance(
            FileLogger,
            opts.name ?? uri.toString(),
            uri,
            level,
            opts.noFormatter ?? false
        );
        return logger;
    }

}