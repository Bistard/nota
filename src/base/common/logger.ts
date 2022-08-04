import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";

export const DEFAULT_LEVEL = LogLevel.INFO;

/**
 * Representing the maximum logging level of a {@link ILoggerService} or
 * {@link ILogger}. Any logging message above the current setting level will be 
 * ignored.
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
 * @default level {@link DEFAULT_LEVEL}.
 */
export abstract class AbstractLogger extends Disposable implements IAbstractLogger {
    
    private _level!: LogLevel;
    private _emitter: Emitter<LogLevel>;
    
    constructor(level: LogLevel = DEFAULT_LEVEL) {
        super();
        this._emitter = this.__register(new Emitter());
        this.setLevel(level);
    }

    get onDidChangeLevel(): Register<LogLevel> {
        return this._emitter.registerListener;
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
 * @note created by {@link ILoggerService}.
 */
export interface ILogger extends IAbstractLogger {
    
    /**
     * @description Provides a collections of logging ways.
     * @param message The message for logging.
     * @param args The caller provided arguments.
     */
    trace(message: string, ...args: any[]): void;
	debug(message: string, ...args: any[]): void;
	info(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
	error(message: string | Error, ...args: any[]): void;
	fatal(message: string | Error, ...args: any[]): void;
}

/**
 * An option for constructing {@link ILogger}.
 */
export interface ILoggerOpts {

    /**
     * The name of the logger.
     */
    readonly name?: string;

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
        case LogLevel.FATAL: return 'critical';
        case LogLevel.ERROR: return 'error';
        case LogLevel.WARN: return 'warning';
        case LogLevel.INFO: return 'info';
        case LogLevel.DEBUG: return 'debug';
        case LogLevel.TRACE: return 'trace';
    }
}