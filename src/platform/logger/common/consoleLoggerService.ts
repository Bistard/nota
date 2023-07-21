import { ASNIForegroundColor, setANSIColor } from "src/base/common/color";
import { getCurrTimeStamp } from "src/base/common/date";
import { AbstractLogger, DEFAULT_LOG_LEVEL, ILogger, LogLevel } from "src/base/common/logger";

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

    constructor(level: LogLevel = DEFAULT_LOG_LEVEL, ifUseColor: boolean = true) {
        super(level);
        this._ifUseColors = ifUseColor;
    }

    public trace(message: string, ...args: any[]): void {
		if (this.getLevel() <= LogLevel.TRACE) {
			if (this._ifUseColors) {
				console.log(setANSIColor(`[TRACE] [${getCurrTimeStamp()}]`, { fgColor: ASNIForegroundColor.LightGray }), message, ...args);
			} else {
				console.log(`[TRACE] [${getCurrTimeStamp()}]`, message, ...args);
			}
		}
	}

	public debug(message: string, ...args: any[]): void {
		if (this.getLevel() <= LogLevel.DEBUG) {
            if (this._ifUseColors) {
				console.log(setANSIColor(`[DEBUG] [${getCurrTimeStamp()}]`, { fgColor: ASNIForegroundColor.LightGray }), message, ...args);
			} else {
				console.log(`[DEBUG] [${getCurrTimeStamp()}]`, message, ...args);
			}
		}
	}

	public info(message: string, ...args: any[]): void {
		if (this.getLevel() <= LogLevel.INFO) {
			if (this._ifUseColors) {
				console.log(setANSIColor(`[INFO]  [${getCurrTimeStamp()}]`, { fgColor: ASNIForegroundColor.LightGray }), message, ...args);
			} else {
				console.log(`[INFO]  [${getCurrTimeStamp()}]`, message, ...args);
			}
		}
	}

	public warn(message: string | Error, ...args: any[]): void {
		if (this.getLevel() <= LogLevel.WARN) {
			if (this._ifUseColors) {
				console.warn(setANSIColor(`[WARN]  [${getCurrTimeStamp()}]`, { fgColor: ASNIForegroundColor.LightYellow }), message, ...args);
			} else {
				console.warn(`[WARN]  [${getCurrTimeStamp()}]`, message, ...args);
			}
		}
	}

	public error(message: string, ...args: any[]): void {
		if (this.getLevel() <= LogLevel.ERROR) {
			if (this._ifUseColors) {
				console.error(setANSIColor(`[ERROR] [${getCurrTimeStamp()}]`, { fgColor: ASNIForegroundColor.LightRed }), message, ...args);
			} else {
				console.error(`[ERROR] [${getCurrTimeStamp()}]`, message, ...args);
			}
		}
	}

	public fatal(message: string, ...args: any[]): void {
		if (this.getLevel() <= LogLevel.FATAL) {
			if (this._ifUseColors) {
				console.error(setANSIColor(`[FATAL] [${getCurrTimeStamp()}]`, { fgColor: ASNIForegroundColor.Magenta }), message, ...args);
			} else {
				console.error(`[FATAL] [${getCurrTimeStamp()}]`, message, ...args);
			}
		}
	}

	public override dispose(): void { /** noop */ }
	public async flush(): Promise<void> { /** noop */ }
}