import { Disposable, IDisposable, toDisposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { FileType, ICreateFileOptions, IDeleteFileOptions, IFileSystemProvider, IReadFileOptions, IResolvedFileStat, IResolveStatOptions, IWatchOptions, IWriteFileOptions } from "src/base/common/file/file";
import { IReadableStream, newWriteableBufferStream } from "src/base/common/file/stream";
import { URI } from "src/base/common/file/uri";
import { IFileService } from "src/code/platform/files/common/fileService";
import { FileCommand } from "src/code/platform/files/electron/mainFileChannel";
import { IResourceChangeEvent } from "src/code/platform/files/node/watcher";
import { IIpcService } from "src/code/platform/ipc/browser/ipcService";
import { IChannel, IpcChannel } from "src/code/platform/ipc/common/channel";

export class BrowserFileChannel extends Disposable implements IFileService {

    // [event]

    private readonly _onDidResourceChange = this.__register(new Emitter<IResourceChangeEvent>());
    public  readonly onDidResourceChange = this._onDidResourceChange.registerListener;

    // TODO
    private readonly _onDidResourceClose = this.__register(new Emitter<URI>());
    public readonly onDidResourceClose = this._onDidResourceClose.registerListener;

    // TODO
    private readonly _onDidAllResourceClosed = this.__register(new Emitter<void>());
    public readonly onDidAllResourceClosed = this._onDidAllResourceClosed.registerListener;

    // [field]

    private readonly _channel: IChannel;

    // [constructor]

    constructor(ipcService: IIpcService) {
        super();
        this._channel = ipcService.getChannel(IpcChannel.DiskFile);

        this.__register(this._channel.registerListener<IResourceChangeEvent>(FileCommand.onDidResourceChange)(event => {
            if (event instanceof Error) {
                // FIX: what if an error is thrown
                return;
            } 
            this._onDidResourceChange.fire(event);
        }));

        this.__register(this._channel.registerListener<URI>(FileCommand.onDidResourceClose)(event => {
            if (event instanceof Error) {
                // FIX: what if an error is thrown
                return;
            }
            this._onDidResourceClose.fire(event);
        }));

        this.__register(this._channel.registerListener<void | Error>(FileCommand.onDidAllResourceClosed)(error => {
            if (error) {
                // FIX: what if an error is thrown
                return;
            };
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

    public stat(uri: URI, opts?: IResolveStatOptions): Promise<IResolvedFileStat> {
        return this._channel.callCommand(FileCommand.stat, [uri, opts]);
    }
 
    public readFile(uri: URI, opts?: IReadFileOptions): Promise<DataBuffer> {
        return this._channel.callCommand(FileCommand.readFile, [uri, opts]);
    }
 
    public readDir(uri: URI): Promise<[string, FileType][]> {
        return this._channel.callCommand(FileCommand.readDir, [uri]);
    }
 
    public async readFileStream(uri: URI, opts?: IReadFileOptions | undefined): Promise<IReadableStream<DataBuffer>> {
        const wrapperStream = newWriteableBufferStream();

        // TODO
        // FIX
        const listener = this._channel.registerListener(FileCommand.readFileStream, [uri, opts]);

        return wrapperStream;
    }
 
    public writeFile(uri: URI, bufferOrStream: DataBuffer | IReadableStream<DataBuffer>, opts?: IWriteFileOptions): Promise<void> {
        return this._channel.callCommand(FileCommand.writeFile, [uri, bufferOrStream, opts]);
    }
 
    public exist(uri: URI): Promise<boolean> {
        return this._channel.callCommand(FileCommand.exist, [uri]);
    }
 
    public createFile(uri: URI, bufferOrStream?: DataBuffer | IReadableStream<DataBuffer>, opts?: ICreateFileOptions): Promise<void> {
        return this._channel.callCommand(FileCommand.createFile, [uri, bufferOrStream, opts]);
    }
     
    public createDir(uri: URI): Promise<void> {
        return this._channel.callCommand(FileCommand.createDir, [uri]);
    }
     
    public moveTo(from: URI, to: URI, overwrite?: boolean): Promise<IResolvedFileStat> {
        return this._channel.callCommand(FileCommand.moveTo, [from, to, overwrite]);
    }
    
    public copyTo(from: URI, to: URI, overwrite?: boolean): Promise<IResolvedFileStat> {
        return this._channel.callCommand(FileCommand.copyTo, [from, to, overwrite]);
    }
    
    public delete(uri: URI, opts?: IDeleteFileOptions): Promise<void> {
        return this._channel.callCommand(FileCommand.delete, [uri, opts]);
    }
    
    public watch(uri: URI, opts?: IWatchOptions): IDisposable {
        this._channel.callCommand(FileCommand.watch, [uri, opts]);
        return toDisposable(() => {
            return this._channel.callCommand(FileCommand.unwatch, [uri]);
        });
    }
}