import { Disposable, IDisposable, toDisposable } from "src/base/common/dispose";
import { AsyncResult, Result, ok } from "src/base/common/result";
import { Emitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationError, FileOperationErrorType, FileType, ICreateFileOptions, IDeleteFileOptions, IFileSystemProvider, IReadFileOptions, IResolvedFileStat, IResolveStatOptions, IWatchOptions, IWriteFileOptions } from "src/base/common/files/file";
import { IReadableStream, IReadyReadableStream, newWriteableBufferStream, toReadyStream } from "src/base/common/files/stream";
import { URI } from "src/base/common/files/uri";
import { Mutable } from "src/base/common/utilities/type";
import { IFileService } from "src/platform/files/common/fileService";
import { FileChannelsInternalCommands, ReadableStreamDataFlowType } from "src/platform/files/electron/mainFileChannel";
import { IIpcService } from "src/platform/ipc/browser/ipcService";
import { IChannel, IpcChannel } from "src/platform/ipc/common/channel";
import { IRawResourceChangeEvents } from "src/platform/files/common/watcher";
import { ResourceChangeEvent } from "src/platform/files/common/resourceChangeEvent";
import { IReviverRegistrant } from "src/platform/ipc/common/revive";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { ILogService } from "src/base/common/logger";
import { errorToMessage, panic } from "src/base/common/utilities/panic";

export class BrowserFileChannel extends Disposable implements IFileService {

    declare _serviceMarker: undefined;

    // [event]

    private readonly _onDidResourceChange = this.__register(new Emitter<IRawResourceChangeEvents>());
    public readonly onDidResourceChange = this._onDidResourceChange.registerListener;

    private readonly _onDidResourceClose = this.__register(new Emitter<URI>());
    public readonly onDidResourceClose = this._onDidResourceClose.registerListener;

    private readonly _onDidAllResourceClosed = this.__register(new Emitter<void>());
    public readonly onDidAllResourceClosed = this._onDidAllResourceClosed.registerListener;

    // [field]

    private readonly _channel: IChannel;
    private readonly _reviver: IReviverRegistrant;

    // [constructor]

    constructor(
        @IIpcService ipcService: IIpcService,
        @IRegistrantService registrantService: IRegistrantService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        this._channel = ipcService.getChannel(IpcChannel.DiskFile);
        this._reviver = registrantService.getRegistrant(RegistrantType.Reviver);

        this.__register(this._channel.registerListener<IRawResourceChangeEvents>(FileChannelsInternalCommands.onDidResourceChange)(event => {
            if (event instanceof Error) {
                panic(event);
            }
            this._onDidResourceChange.fire({
                ...event,
                wrap: function (ignoreCase?: boolean) { return new ResourceChangeEvent(this, ignoreCase); }
            });
        }));

        this.__register(this._channel.registerListener<URI>(FileChannelsInternalCommands.onDidResourceClose)(event => {
            if (event instanceof Error) {
                panic(event);
            }
            this._onDidResourceClose.fire(URI.revive(event, this._reviver));
        }));

        this.__register(this._channel.registerListener<void | Error>(FileChannelsInternalCommands.onDidAllResourceClosed)(error => {
            if (error) {
                panic(error);
            }
            this._onDidAllResourceClosed.fire();
        }));

        logService.trace('BrowserFileChannel', 'constructed.');
    }

    // [public methods]

    public registerProvider(_scheme: string, _provider: IFileSystemProvider): void {
        this.logService.warn('BrowserFileChannel', 'Cannot register a provider to the file service in the renderer process.', { scheme: _scheme });
    }

    public getProvider(_scheme: string): IFileSystemProvider | undefined {
        return undefined;
    }

    public stat(uri: URI, opts?: IResolveStatOptions): AsyncResult<IResolvedFileStat, FileOperationError> {
        return Result.fromPromise<IResolvedFileStat, FileOperationError>(
            () => this._channel.callCommand(FileChannelsInternalCommands.stat, [uri, opts]),
        )
        .andThen(stat => {
            const revive = (stat: IResolvedFileStat): void => {
                (<Mutable<URI>>stat.uri) = URI.revive(stat.uri, this._reviver);
                for (const child of (stat?.children ?? [])) {
                    revive(child);
                }
            };
            revive(stat);
    
            return ok(stat);
        });
    }

    public readFile(uri: URI, opts?: IReadFileOptions): AsyncResult<DataBuffer, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileChannelsInternalCommands.readFile, [uri, opts]),
        );
    }

    public readDir(uri: URI): AsyncResult<[string, FileType][], FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileChannelsInternalCommands.readDir, [uri]),
        );
    }

    public readFileStream(uri: URI, opts?: IReadFileOptions | undefined): AsyncResult<IReadyReadableStream<DataBuffer>, FileOperationError> {
        const stream = newWriteableBufferStream();
        
        /**
         * Reading file using stream needs to be handled specially when acrossing 
         * IPC. The channels between client and server is using `registerListener` 
         * API instead of using `callCommand` internally.
         */
        const listener = this._channel.registerListener<ReadableStreamDataFlowType<DataBuffer>>(FileChannelsInternalCommands.readFileStream, [uri, opts]);
        const disconnect = listener((flowingData) => {

            // normal data
            if (flowingData instanceof DataBuffer) {
                stream.write(flowingData);
                return;
            }

            // error
            if (flowingData !== 'end') {
                let error = flowingData;
                if (!(error instanceof Error)) {
                    error = new FileOperationError('', FileOperationErrorType.UNKNOWN, (<any>error).nestedError && errorToMessage((<any>error).nestedError));
                }

                stream.error(error);
            }
            
            // error or end
            stream.end();
            disconnect.dispose();
        });

        stream.pause();
        return AsyncResult.ok(toReadyStream(() => {
            Promise.resolve().then(() => stream.resume());
            return stream;
        }));
    }

    public writeFile(uri: URI, bufferOrStream: DataBuffer | IReadableStream<DataBuffer>, opts?: IWriteFileOptions): AsyncResult<void, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileChannelsInternalCommands.writeFile, [uri, bufferOrStream, opts]),
        );
    }

    public exist(uri: URI): AsyncResult<boolean, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileChannelsInternalCommands.exist, [uri]),
        );
    }

    public createFile(uri: URI, bufferOrStream?: DataBuffer | IReadableStream<DataBuffer>, opts?: ICreateFileOptions): AsyncResult<void, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileChannelsInternalCommands.createFile, [uri, bufferOrStream, opts]),
        );
    }

    public createDir(uri: URI): AsyncResult<void, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileChannelsInternalCommands.createDir, [uri]),
        );
    }

    public moveTo(from: URI, to: URI, overwrite?: boolean): AsyncResult<IResolvedFileStat, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileChannelsInternalCommands.moveTo, [from, to, overwrite]),
        );
    }

    public copyTo(from: URI, to: URI, overwrite?: boolean): AsyncResult<IResolvedFileStat, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileChannelsInternalCommands.copyTo, [from, to, overwrite]),
        );
    }

    public delete(uri: URI, opts?: IDeleteFileOptions): AsyncResult<void, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileChannelsInternalCommands.delete, [uri, opts]),
        );
    }

    public watch(uri: URI, opts?: IWatchOptions): AsyncResult<IDisposable, FileOperationError> {
        this._channel.callCommand(FileChannelsInternalCommands.watch, [uri, opts]);
        const cancel = toDisposable(() => {
            return this._channel.callCommand(FileChannelsInternalCommands.unwatch, [uri]);
        });

        return AsyncResult.ok(cancel);
    }
}