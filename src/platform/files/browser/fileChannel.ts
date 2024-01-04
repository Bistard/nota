import { Disposable, IDisposable, toDisposable } from "src/base/common/dispose";
import { AsyncResult, Result, errorToMessage, ok } from "src/base/common/error";
import { Emitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationError, FileOperationErrorType, FileType, ICreateFileOptions, IDeleteFileOptions, IFileSystemProvider, IReadFileOptions, IResolvedFileStat, IResolveStatOptions, IWatchOptions, IWriteFileOptions } from "src/base/common/files/file";
import { IReadableStream, IReadyReadableStream, newWriteableBufferStream, toReadyStream } from "src/base/common/files/stream";
import { URI } from "src/base/common/files/uri";
import { Mutable } from "src/base/common/utilities/type";
import { IFileService } from "src/platform/files/common/fileService";
import { FileCommand, ReadableStreamDataFlowType } from "src/platform/files/electron/mainFileChannel";
import { IIpcService } from "src/platform/ipc/browser/ipcService";
import { IChannel, IpcChannel } from "src/platform/ipc/common/channel";
import { IRawResourceChangeEvents } from "src/platform/files/common/watcher";
import { ResourceChangeEvent } from "src/platform/files/common/resourceChangeEvent";
import { IReviverRegistrant } from "src/platform/ipc/common/revive";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { RegistrantType } from "src/platform/registrant/common/registrant";

export class BrowserFileChannel extends Disposable implements IFileService {

    declare _serviceMarker: undefined;

    // [event]

    private readonly _onDidResourceChange = this.__register(new Emitter<IRawResourceChangeEvents>());
    public readonly onDidResourceChange = this._onDidResourceChange.registerListener;

    // TODO
    private readonly _onDidResourceClose = this.__register(new Emitter<URI>());
    public readonly onDidResourceClose = this._onDidResourceClose.registerListener;

    // TODO
    private readonly _onDidAllResourceClosed = this.__register(new Emitter<void>());
    public readonly onDidAllResourceClosed = this._onDidAllResourceClosed.registerListener;

    // [field]

    private readonly _channel: IChannel;
    private readonly _reviver: IReviverRegistrant;

    // [constructor]

    constructor(
        @IIpcService ipcService: IIpcService,
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        super();
        this._channel = ipcService.getChannel(IpcChannel.DiskFile);
        this._reviver = registrantService.getRegistrant(RegistrantType.Reviver);

        this.__register(this._channel.registerListener<IRawResourceChangeEvents>(FileCommand.onDidResourceChange)(event => {
            if (event instanceof Error) {
                throw event;
            }
            this._onDidResourceChange.fire({
                ...event,
                wrap: function (ignoreCase?: boolean) { return new ResourceChangeEvent(this, ignoreCase); }
            });
        }));

        this.__register(this._channel.registerListener<URI>(FileCommand.onDidResourceClose)(event => {
            if (event instanceof Error) {
                throw event;
            }
            this._onDidResourceClose.fire(URI.revive(event, this._reviver));
        }));

        this.__register(this._channel.registerListener<void | Error>(FileCommand.onDidAllResourceClosed)(error => {
            if (error) {
                throw error;
            }
            this._onDidAllResourceClosed.fire();
        }));
    }

    // [public methods]

    public registerProvider(_scheme: string, _provider: IFileSystemProvider): void {
        console.warn('Cannot register a provider to the file service in the renderer process');
    }

    public getProvider(_scheme: string): IFileSystemProvider | undefined {
        return undefined;
    }

    public stat(uri: URI, opts?: IResolveStatOptions): AsyncResult<IResolvedFileStat, FileOperationError> {
        return Result.fromPromise<IResolvedFileStat, FileOperationError>(
            () => this._channel.callCommand(FileCommand.stat, [uri, opts]),
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
            () => this._channel.callCommand(FileCommand.readFile, [uri, opts]),
        );
    }

    public readDir(uri: URI): AsyncResult<[string, FileType][], FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileCommand.readDir, [uri]),
        );
    }

    public readFileStream(uri: URI, opts?: IReadFileOptions | undefined): AsyncResult<IReadyReadableStream<DataBuffer>, FileOperationError> {
        const stream = newWriteableBufferStream();

        const listener = this._channel.registerListener<ReadableStreamDataFlowType<DataBuffer>>(FileCommand.readFileStream, [uri, opts]);
        const disconnect = listener((flowingData) => {

            // normal data
            if (flowingData instanceof DataBuffer) {
                stream.write(flowingData);
            }

            // end or error
            else {
                if (flowingData === 'end') {
                    stream.end();
                }

                else {
                    let error = flowingData;
                    if (!(error instanceof Error)) {
                        error = new FileOperationError('', FileOperationErrorType.UNKNOWN, (<any>error).nestedError && errorToMessage((<any>error).nestedError));
                    }

                    stream.error(error);
                    stream.end();
                }

                disconnect.dispose();
            }
        });

        stream.pause();
        
        return AsyncResult.ok(toReadyStream(() => {
            stream.resume();
            return stream;
        }));
    }

    public writeFile(uri: URI, bufferOrStream: DataBuffer | IReadableStream<DataBuffer>, opts?: IWriteFileOptions): AsyncResult<void, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileCommand.writeFile, [uri, bufferOrStream, opts]),
        );
    }

    public exist(uri: URI): AsyncResult<boolean, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileCommand.exist, [uri]),
        );
    }

    public createFile(uri: URI, bufferOrStream?: DataBuffer | IReadableStream<DataBuffer>, opts?: ICreateFileOptions): AsyncResult<void, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileCommand.createFile, [uri, bufferOrStream, opts]),
        );
    }

    public createDir(uri: URI): AsyncResult<void, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileCommand.createDir, [uri]),
        );
    }

    public moveTo(from: URI, to: URI, overwrite?: boolean): AsyncResult<IResolvedFileStat, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileCommand.moveTo, [from, to, overwrite]),
        );
    }

    public copyTo(from: URI, to: URI, overwrite?: boolean): AsyncResult<IResolvedFileStat, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileCommand.copyTo, [from, to, overwrite]),
        );
    }

    public delete(uri: URI, opts?: IDeleteFileOptions): AsyncResult<void, FileOperationError> {
        return Result.fromPromise(
            () => this._channel.callCommand(FileCommand.delete, [uri, opts]),
        );
    }

    public watch(uri: URI, opts?: IWatchOptions): Result<IDisposable, FileOperationError> {
        this._channel.callCommand(FileCommand.watch, [uri, opts]);
        return ok(toDisposable(() => {
            return this._channel.callCommand(FileCommand.unwatch, [uri]);
        }));
    }
}