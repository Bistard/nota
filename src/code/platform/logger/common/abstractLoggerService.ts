import { Disposable } from "src/base/common/dispose";
import { URI } from "src/base/common/file/uri";
import { DEFAULT_LOG_LEVEL, ILogger, ILoggerOpts, LogLevel } from "src/base/common/logger";
import { createService } from "src/code/platform/instantiation/common/decorator";

export const ILoggerService = createService<ILoggerService>('logger-service');

/**
 * A {@link ILoggerService} provides ability to create or get {@link ILogger}
 * which has the actual ability to log messages.
 */
export interface ILoggerService extends Disposable {

    /**
     * @description Create a new {@link ILogger}. It overrides the previous 
     * logger if already existed.
     * @param uri The linked {@link URI} for the logger.
     * @param opts The option for construction of the logger.
     */
    createLogger(uri: URI, opts: ILoggerOpts): ILogger;

    /**
     * @description Get an existed {@link ILogger} if any.
     */
    getLogger(uri: URI): ILogger | undefined;

    /**
     * @description All the existed {@link ILogger}s will be disposed.
     */
    dispose(): void;
}

/**
 * @class The base class for each {@link ILoggerService}. The default log level
 * is {@link DEFAULT_LOG_LEVEL}.
 */
export abstract class AbstractLoggerService extends Disposable implements ILoggerService {

    // [field]

    /** determines the log level of the created logger. */
    private readonly _level: LogLevel;
    private readonly _loggers: Map<string, ILogger>;

    // [constructor]

    constructor(level: LogLevel = DEFAULT_LOG_LEVEL) {
        super();
        this._level = level;
        this._loggers = new Map();
    }

    // [abstract method]

    protected abstract __doCreateLogger(uri: URI, level: LogLevel, opts: ILoggerOpts): ILogger;

    // [public methods]

    public createLogger(uri: URI, opts: ILoggerOpts): ILogger {
        const newLogger = this.__doCreateLogger(uri, opts.alwaysLog ? LogLevel.TRACE : this._level, opts);
        const oldLogger = this.getLogger(uri);
        if (oldLogger) {
            oldLogger.dispose();
        }

        this._loggers.set(URI.toString(uri), newLogger);
        return newLogger;
    }

    public getLogger(uri: URI): ILogger | undefined {
        return this._loggers.get(URI.toString(uri));
    } 

    public override dispose(): void {
        for (const [uri, logger] of this._loggers) {
            logger.dispose();
        }
        this._loggers.clear();
        super.dispose();
    }
}
