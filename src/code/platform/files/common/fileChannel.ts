import { IDisposable, toDisposable } from "src/base/common/dispose";
import { DataBuffer } from "src/base/common/file/buffer";
import { FileType, ICreateFileOptions, IDeleteFileOptions, IFileSystemProvider, IReadFileOptions, IResolvedFileStat, IResolveStatOptions, IWriteFileOptions } from "src/base/common/file/file";
import { IReadableStream, newWriteableBufferStream } from "src/base/common/file/stream";
import { URI } from "src/base/common/file/uri";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IIpcService } from "src/code/platform/ipc/browser/ipcService";
import { IChannel, IpcChannel } from "src/code/platform/ipc/common/channel";

const enum FileCommand {
    stat = 'stat',
    readFile = 'readFile',
    readDir = 'readDir',
    readFileStream = 'readFileStream',
    writeFile = 'writeFile',
    exist = 'exist',
    createFile = 'createFile',
    createDir = 'createDir',
    moveTo = 'moveTo',
    copyTo = 'copyTo',
    delete = 'delete',
    watch = 'watch',
    unwatch = 'unwatch',
}

export class BrowserFileChannel implements IFileService {

    // [field]

    private readonly _channel: IChannel;

    // [constructor]

    constructor(ipcService: IIpcService) {
        this._channel = ipcService.getChannel(IpcChannel.DiskFile);
    }

    // [public methods]

    public registerProvider(scheme: string, provider: IFileSystemProvider): void {
        console.warn('Cannot register a provider to the file service in the renderer process');
    }

    public getProvider(scheme: string): IFileSystemProvider | undefined {
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
    
    public watch(uri: URI): IDisposable {
        this._channel.callCommand(FileCommand.watch, [uri]);
        return toDisposable(() => {
            this._channel.callCommand(FileCommand.unwatch, [uri]);
        });
    }

    public dispose(): void {
        // noop
    }
}