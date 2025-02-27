import { AbstractLogger, Additional, DEFAULT_LOG_LEVEL, ILogger, LogLevel } from "src/base/common/logger";
import { prettyLog } from "src/platform/logger/common/prettyLog";

/**
 * @class The logger has ability to write log into the console. The log writing 
 * process is asynchronous and guarantees each log is written in succession.
 * 
 * @default level {@Link DEFAULT_LOG_LEVEL}
 * @default ifUseColor true
 * 
 * @note No need a {@link ILoggerService} since there is only one console.
 */
export class ConsoleLogger extends AbstractLogger implements ILogger {

    private readonly _ifUseColors: boolean;
	private readonly _description: string;

    constructor(level: LogLevel = DEFAULT_LOG_LEVEL, ifUseColor: boolean = true) {
        super(level);
        this._ifUseColors = ifUseColor;
		this._description = (typeof process !== 'undefined')
			? 'main'
			: (typeof document !== 'undefined')
				? 'browser'
				: 'others';
    }

    public trace(reporter: string, message: string, additional?: Additional): void {
		if (this.getLevel() <= LogLevel.TRACE) {
			console.log(prettyLog(this._ifUseColors, LogLevel.TRACE, this._description, reporter, message, undefined, additional).slice(0, -1));
		}
	}

	public debug(reporter: string, message: string, additional?: Additional): void {
		if (this.getLevel() <= LogLevel.DEBUG) {
            console.log(prettyLog(this._ifUseColors, LogLevel.DEBUG, this._description, reporter, message, undefined, additional).slice(0, -1));
		}
	}

	public info(reporter: string, message: string, additional?: Additional): void {
		if (this.getLevel() <= LogLevel.INFO) {
			console.log(prettyLog(this._ifUseColors, LogLevel.INFO, this._description, reporter, message, undefined, additional).slice(0, -1));
		}
	}

	public warn(reporter: string, message: string, additional?: Additional): void {
		if (this.getLevel() <= LogLevel.WARN) {
			console.warn(prettyLog(this._ifUseColors, LogLevel.WARN, this._description, reporter, message, undefined, additional).slice(0, -1));
		}
	}

	public error(reporter: string, message: string, error?: any, additional?: Additional): void {
		if (this.getLevel() <= LogLevel.ERROR) {
			console.error(prettyLog(this._ifUseColors, LogLevel.ERROR, this._description, reporter, message, undefined, additional).slice(0, -1));
			console.error(error); // ensure the printed error is intractive instead of just plain-text
		}
	}

	public fatal(reporter: string, message: string, error?: any, additional?: Additional): void {
		if (this.getLevel() <= LogLevel.FATAL) {
			console.error(prettyLog(this._ifUseColors, LogLevel.FATAL, this._description, reporter, message, undefined, additional).slice(0, -1));
			console.error(error); // ensure the printed error is intractive instead of just plain-text
		}
	}

	public override dispose(): void { /** noop */ }
	public async flush(): Promise<void> { /** noop */ }
}