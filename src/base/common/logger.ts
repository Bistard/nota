import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { IMicroService, createService } from "src/code/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";

export const ILogService = createService<ILogService>('log-service');
export const DEFAULT_LOG_LEVEL = LogLevel.INFO;

export interface ILogEvent<T> {
    readonly data: T;
    readonly level: LogLevel;
}

/**
 * Representing the maximum logging level of a {@link ILoggerService} or
 * {@link ILogger}.
 */
export const enum LogLevel {
    /**
     * The most fine-grained information only used in rare cases where you need 
     * the full visibility of what is happening in your application and inside 
     * the third-party libraries that you use. You can expect the TRACE logging 
     * level to be very verbose.
     */
    TRACE = 0,

    /**
     * Less granular compared to the TRACE level, but it is more than you will 
     * need in everyday use. The DEBUG log level should be used for information 
     * that may be needed for diagnosing issues and troubleshooting or when 
     * running application in the test environment for the purpose of making 
     * sure everything is running correctly.
     */
    DEBUG = 1,

    /**
     * The standard log level indicating that something happened, such as the 
     * application entered a certain state. The information logged using the 
     * INFO log level should be purely informative and not looking into them on 
     * a regular basis should not result in missing any important informations.
     */
    INFO  = 2,
    
    /**
     * The log level that indicates some unexpected things happened somewhere in 
     * the application that might disturb one of the functionality. But that 
     * does not mean that the application failed. The WARN level should be used 
     * in situations that are unexpected, but the code may still the work.
     */
    WARN  = 3,

    /**
     * The log level should be used when the application hits an issue that 
     * prevents one or more functionalities from properly functioning, but it 
     * either has other options to fix such failure or, the fundamental and 
     * basic functionalities of the application can still work.
     */
    ERROR = 4,

    /**
     * One or more key functionalities are not working and the whole system 
     * does not achieve the basic requirement to run as normal. Application may
     * crash in any seconds.
     */
    FATAL = 5
}; 

export interface ILoggable {
    log(message: string, ...args: any[]): void;
}

/**
 * A {@link IAbstractLogger} provides ability to set the current {@link LogLevel}
 * of this logger.
 */
export interface IAbstractLogger extends Disposable {
    /**
     * Fires when the level of the logger changes.
     */
    readonly onDidChangeLevel: Register<LogLevel>;

    /**
     * @description Sets the current {@link LogLevel}.
     */
    setLevel(level: LogLevel): void;

    /**
     * @description Returns the current log level.
     */
    getLevel(): LogLevel;
}

/**
 * @class The base class of each {@link ILogger}. Provides functionalities 
 * relates to log level.
 * 
 * @default level {@link DEFAULT_LOG_LEVEL}.
 */
export abstract class AbstractLogger extends Disposable implements IAbstractLogger {
    
    _microserviceIdentifier: undefined;
    private _level!: LogLevel;
    
    private readonly _emitter = this.__register(new Emitter<LogLevel>());
    public readonly onDidChangeLevel = this._emitter.registerListener;

    constructor(level: LogLevel = DEFAULT_LOG_LEVEL) {
        super();
        this.setLevel(level);
    }

    public setLevel(level: LogLevel): void {
        if (this._level !== level) {
            this._level = level;
            this._emitter.fire(level);
        }
    }

    public getLevel(): LogLevel {
        return this._level;
    }
}

/**
 * A {@link ILogger} is an instance that able to handle a series of incoming 
 * logging messages. 
 * 
 * @note Generally created by a {@link ILoggerService}.
 * @note Any logging level BELOW the current level will be ignored.
 */
export interface ILogger extends IAbstractLogger {
    
    /**
     * @description Provides a collections of logging ways.
     * @param message The message for logging.
     * @param args Provided arguments will be append to the end of the message 
     *             and spliting by spaces.
     */
    trace(message: string, ...args: any[]): void;
	debug(message: string, ...args: any[]): void;
	info(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
	error(message: string | Error, ...args: any[]): void;
	fatal(message: string | Error, ...args: any[]): void;
    flush(): Promise<void>;
}

/** 
 * Alias for a {@link ILogger}. May be registered into a {@link IInstantiationService}.
 */
export interface ILogService extends ILogger, IMicroService {};

/**
 * An option for constructing {@link ILogger}.
 */
export interface ILoggerOpts {

    /**
     * The name of the logger.
     */
    readonly name?: string;

    /**
     * The description of the logger.
     */
    readonly description?: string;

    /**
     * If use the built-in formatter to format the message.
     */
    readonly noFormatter?: boolean;

    /**
     * Always log the messages and will ignore {@link LogLevel}.
     */
    readonly alwaysLog?: boolean;
}

export function parseLogLevel(level: LogLevel): string {
    switch (level) {
        case LogLevel.FATAL: return 'FATAL';
        case LogLevel.ERROR: return 'ERROR';
        case LogLevel.WARN: return 'WARN';
        case LogLevel.INFO: return 'INFO';
        case LogLevel.DEBUG: return 'DEBUG';
        case LogLevel.TRACE: return 'TRACE';
    }
}

export function parseToLogLevel(str?: string): LogLevel {
    if (!str) {
        return LogLevel.INFO;
    }
    
    switch (str.toUpperCase()) {
        case 'FATAL': return LogLevel.FATAL;
        case 'ERROR': return LogLevel.ERROR;
        case 'WARN': return LogLevel.WARN;
        case 'INFO': return LogLevel.INFO;
        case 'DEBUG': return LogLevel.DEBUG;
        case 'TRACE': return LogLevel.TRACE;
        default: return LogLevel.INFO;
    }
}

/**
 * @class A simple integrated {@link ILogger} that combines the other loggers
 * into a intergrated version. The loggers will be invoked by their adding 
 * order.
 */
export class PipelineLogger extends AbstractLogger implements ILogService {

    private readonly _loggers: ILogger[];

    constructor(loggers: ILogger[]) {
        super();

        this._loggers = loggers;
        for (const logger of loggers) {
            this.__register(logger);
        }
    }

    public add(logger: ILogger): void {
        this._loggers.push(logger);
    }

    public trace(message: string, ...args: any[]): void {
        for (const logger of this._loggers) {
			logger.trace(message, ...args);
		}
    }

    public debug(message: string, ...args: any[]): void {
        for (const logger of this._loggers) {
			logger.debug(message, ...args);
		}
    }

    public info(message: string, ...args: any[]): void {
        for (const logger of this._loggers) {
			logger.info(message, ...args);
		}
    }

    public warn(message: string, ...args: any[]): void {
        for (const logger of this._loggers) {
			logger.warn(message, ...args);
		}
    }

    public error(message: string | Error, ...args: any[]): void {
        for (const logger of this._loggers) {
			logger.error(message, ...args);
		}
    }

    public fatal(message: string | Error, ...args: any[]): void {
        for (const logger of this._loggers) {
			logger.fatal(message, ...args);
		}
    }

    public async flush(): Promise<void> {
        for (const logger of this._loggers) {
            await logger.flush();
        }
    }
}

/**
 * @description Buffer logger may wraps antoher {@link ILogger} at anytime. If
 * there is no provided logger, the logging message will be stored in the buffer
 * and will be flushed once there is a logger has been set.
 */
export class BufferLogger extends AbstractLogger implements ILogService {

    protected readonly _buffer: { level: LogLevel, message: (string | Error), args: any[] }[] = [];
    private _logger?: ILogger;

    constructor() {
        super();
    }

    public setLogger(logger: ILogger): void {
        this._logger = logger;
        this.__flushBuffer();
    }

    public getLogger(): ILogger | undefined {
        return this._logger;
    }

    public trace(message: string, ...args: any[]): void {
        this.__log(LogLevel.TRACE, message, ...args);
    }

    public debug(message: string, ...args: any[]): void {
        this.__log(LogLevel.DEBUG, message, ...args);
    }

    public info(message: string, ...args: any[]): void {
        this.__log(LogLevel.INFO, message, ...args);
    }

    public warn(message: string, ...args: any[]): void {
        this.__log(LogLevel.WARN, message, ...args);
    }

    public error(message: string | Error, ...args: any[]): void {
        this.__log(LogLevel.ERROR, message, ...args);
    }

    public fatal(message: string | Error, ...args: any[]): void {
        this.__log(LogLevel.FATAL, message, ...args);
    }

    public async flush(): Promise<void> {
        this.__flushBuffer();
        return this._logger?.flush();
    }

    // [protected helper methods]

    protected __log(level: LogLevel, message: string | Error, ...args: any[]): void {
        this._buffer.push({ level: level, message, args });
        if (this._logger) {
            this.__flushBuffer();
        }
    }

    protected __flushBuffer(): void {
        for (const { level, message, args } of this._buffer) {
            defaultLog(this._logger!, level, message, args);
        }
        this._buffer.length = 0;
    }
}

export type LogFunction = (logger: ILogger, level: LogLevel, message: string | Error, args: any[]) => void;

export function defaultLog(logger: ILogger, level: LogLevel, message: string | Error, args: any[] = []): void {
    switch (level) {
        case LogLevel.TRACE:
            logger.trace(<any>message, ...args);
            break;
        case LogLevel.DEBUG: 
            logger.debug(<any>message, ...args);
            break;
        case LogLevel.INFO: 
            logger.info(<any>message, ...args);
            break;
        case LogLevel.WARN: 
            logger.warn(<any>message, ...args);
            break;
        case LogLevel.ERROR: 
            logger.error(<any>message, ...args);
            break;
        case LogLevel.FATAL: 
            logger.fatal(<any>message, ...args);
            break;
    }
}