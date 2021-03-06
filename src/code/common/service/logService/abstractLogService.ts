import { IntervalTimer } from "src/base/common/util/timer";

export const enum LogLevel {
    TRACE = 0,
    DEBUG = 1,
    INFO  = 2,
    WARN  = 3,
    ERROR = 4,
    FATAL = 5
}; 

export interface ILogInfo {
    output: string;
};

export interface IAbstractLogService {
    
    /**
     * Pauses handling any incoming log messages.
     */
    pause(): void;

    /**
     * Resumes to handle any existed or incoming log messages.
     */
    resume(): void;

    /**
     * Determines if the service is paused or resumed.
     */
    isFlowing(): boolean;

    /**
     * Sets the current log level. Any log messages that has lower level than 
     * the current level will be ignored.
     * 
     * Checks {@link LogLevel}.
     */
    setLevel(level: LogLevel): void;

    /**
     * Returns the current log level.
     */
    getLevel(): LogLevel;

}

export abstract class AbstractLogService<T extends ILogInfo> implements IAbstractLogService {

    // [fields]

    private _logServiceManager: LogServiceManager<T>;

    private _level: LogLevel;
    
    // [constructor]

    constructor(
        level: LogLevel = LogLevel.INFO,
    ) {
        this._logServiceManager = new LogServiceManager<T>(info => this.logger(info));
        this._level = level;
    }

    // [methods]

    public pause(): void {
        this._logServiceManager.pause();
    }

    public resume(): void {
        this._logServiceManager.resume();
    }

    public isFlowing(): boolean {
        return this._logServiceManager.isFlowing();
    }
    
    public setLevel(level: LogLevel): void {
        this._level = level;
    }

    public getLevel(): LogLevel {
        return this._level;
    }

    // [helper methods]

    protected log(level: LogLevel, info: T): void {
        if (level >= this._level) {
            this._logServiceManager.push(info);
        }
    }

    protected abstract logger(logInfo: T): Promise<void>;
}

/**
 * @internal
 * @class An internal class that manages the flow of log messages.
 */
class LogServiceManager<T extends ILogInfo> {
    
    // [fields]

    // buffer
    private _queue: T[];
    
    // switch that controls the writing flow
    private _flowing: boolean;
    private _timer: IntervalTimer;

    // there is an ongoing log is writting
    private _ongoing: boolean;

    // [constructor]

    constructor(
        private readonly logger: (logInfo: T) => Promise<void>
    ) {
        this._queue = [];
        this._flowing = true;
        this._ongoing = false;

        // starts flowing
        this._timer = new IntervalTimer();
        this._timer.set(() => this.checkQueue(), 300);
    }

    // [methods]

    public isEmpty(): boolean {
        return !this._queue.length;
    }

    public checkQueue(): void {
        if (!this._flowing) {
            this._timer.cancel();
            return;
        }

        if (!this.isEmpty() && !this._ongoing) {
            this.__processQueue();
        }
    }

    public peek(): ILogInfo | undefined {
        return this._queue[this._queue.length - 1];
    }

    public push(logInfo: T): void {
        this._queue.push(logInfo);
    }

    public pause(): void {
        this._flowing = false;
    }

    public resume(): void {
        this._flowing = true;
        this._timer.set(() => this.checkQueue(), 300);
    }

    public isFlowing(): boolean {
        return this._flowing;
    }

    // [private helper methods]

    private async __processQueue(): Promise<void> {
        try {
            this._ongoing = true;
            const logInfo = this._queue[0]!;
           
            await this.logger(logInfo);
            
            this._queue.shift();
            this._ongoing = false;    
        } 
        
        catch (err) {
            // we throw it out for now, maybe we can catch this error for later.
            throw err;
        }

    }
}

