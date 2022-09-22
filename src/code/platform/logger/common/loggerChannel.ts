import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { BufferLogger, defaultLog, ILogger, ILoggerOpts, LogLevel } from "src/base/common/logger";
import { IIpcService } from "src/code/platform/ipc/browser/ipcService";
import { IChannel, IpcChannel, IServerChannel } from "src/code/platform/ipc/common/channel";
import { AbstractLoggerService, ILoggerService } from "src/code/platform/logger/common/abstractLoggerService";

const enum LoggerCommand {
    CreateLogger = 'createLogger',
    Log = 'log',
}

/**
 * @class Used in main process to hold all the {@link ILogger}s that are created
 * in the renderer process.
 * 
 * The channel has the commands set {@link LoggerCommand}.
 * 
 * Created logger will only be stored inside the channel, the renderer process 
 * may call log command to send logging message to here for the actual logging
 * step.
 */
// TODO: sync log level with main process
export class MainLoggerChannel implements IServerChannel {

    // [field / constructor]

    private readonly _loggers = new Map<string, ILogger>();
    constructor(private readonly loggerService: ILoggerService) {}

    // [public methods]

    public async callCommand<T>(_id: string, command: LoggerCommand, arg: any[]): Promise<T> {
        switch (command) {
            case LoggerCommand.CreateLogger: 
                return this.__createLogger(arg[0], arg[1]);
            case LoggerCommand.Log: 
                return this.__log(arg[0], arg[1]);
        }
    }

    public registerListener<T>(_id: string, event: never, arg?: any[]): Register<T> {
        throw new Error(`Event not found: ${event}`);
    }

    // [private helper methods]

    private async __createLogger(path: URI, opts: ILoggerOpts): Promise<any> {
        const actualLogger = this.loggerService.createLogger(path, opts);
        this._loggers.set(URI.toString(path), actualLogger);
    }
    
    private async __log(path: URI, messages: { level: LogLevel, message: (string | Error), args: any[] }[]): Promise<any> {
        const logger = this._loggers.get(URI.toString(path));
        if (!logger) {
            throw new Error(`Logger not found: ${URI.toString(path)}`);
        }
        for (const { level, message, args } of messages) {
            defaultLog(logger, level, message, args);
        }
    }
}

/**
 * @class A {@link ILoggerService} on browser-side.
 */
export class BrowserLoggerChannel extends AbstractLoggerService {

    private readonly _channel: IChannel;

    constructor(ipcService: IIpcService, level: LogLevel) {
        super(level);
        this._channel = ipcService.getChannel(IpcChannel.Logger);
    }

    protected override __doCreateLogger(uri: URI, level: LogLevel, opts: ILoggerOpts): ILogger {
        return new __BrowserLogger(this._channel, uri, level, opts);
    }
}

class __BrowserLogger extends BufferLogger implements ILogger {

    private _created: boolean = false;

    constructor(
        private readonly channel: IChannel,
        private readonly path: URI,
        level: LogLevel,
        opts: ILoggerOpts,
    ) {
        super();
        this.setLevel(level);

        channel.callCommand(LoggerCommand.CreateLogger, [path, opts])
        .then(() => {
            /**
             * The logger is created at the main process, we need to flush all 
             * the messages.
             */
            this._created = true;
            this.__flushBuffer();
        });
    }

    // [protected methods]

    protected override __log(level: LogLevel, message: string | Error, ...args: any[]): void {
        this._buffer.push({ level: level, message, args });
        if (this._created) {
            this.__flushBuffer();
        }
    }

    protected override __flushBuffer(): void {
        this.channel.callCommand(LoggerCommand.Log, [this.path, this._buffer]);
        this._buffer = [];
    }
}