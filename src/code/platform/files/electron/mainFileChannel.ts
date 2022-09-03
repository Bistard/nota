import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { FileType, ICreateFileOptions, IDeleteFileOptions, IReadFileOptions, IResolvedFileStat, IResolveStatOptions, IResourceChangeEvent, IWatchOptions, IWriteFileOptions } from "src/base/common/file/file";
import { IReadableStream } from "src/base/common/file/stream";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IServerChannel } from "src/code/platform/ipc/common/channel";

/**
 * @internal
 * Should ONLY be use between file service channel communication.
 */
export const enum FileCommand {
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
    onDidResourceChange = 'onDidResourceChange',
    onDidResourceClose = 'onDidResourceClose',
    onDidAllResourceClosed = 'onDidAllResourceClosed',
}

export class MainFileChannel implements IServerChannel {

    // [field]

    private readonly _activeWatchers = new Map<string, IDisposable>();

    // [constructor]

    constructor(
        private readonly logService: ILogService,
        private readonly fileService: IFileService,
    ) {}

    // [public methods]

    public async callCommand(_id: string, command: FileCommand, arg: any[]): Promise<any> {
        switch (command) {
            case FileCommand.stat: return this.__stat(arg[0], arg[1]);
            case FileCommand.readFile: return this.__readFile(arg[0], arg[1]);
            case FileCommand.readDir: return this.__readDir(arg[0]);
            case FileCommand.readFileStream: return this.__readFileStream(arg[0], arg[1]);
            case FileCommand.writeFile: return this.__writeFile(arg[0], arg[1], arg[2]);
            case FileCommand.exist: return this.__exist(arg[0]);
            case FileCommand.createFile: return this.__createFile(arg[0], arg[1], arg[2]);
            case FileCommand.createDir: return this.__createDir(arg[0]);
            case FileCommand.moveTo: return this.__moveTo(arg[0], arg[1], arg[2]);
            case FileCommand.copyTo: return this.__copyTo(arg[0], arg[1], arg[2]);
            case FileCommand.delete: return this.__delete(arg[0], arg[1]);
            case FileCommand.watch: return this.__watch(arg[0], arg[1]);
            case FileCommand.unwatch: return this.__unwatch(arg[0]);
        }
        throw new Error(`main file channel - unknown file command ${command}`);
    }

    public registerListener(_id: string, event: FileCommand, arg?: any[]): Register<any> {
        switch (event) {
            case FileCommand.onDidResourceChange: return this.__onDidResourceChange();
            case FileCommand.onDidResourceClose: return this.__onDidResourceClose();
            case FileCommand.onDidAllResourceClosed: return this.__onDidAllResourceClosed();
        }
        
        throw new Error(`main file channel - Event not found: ${event}`);
    }

    // [private helper methods]

    private async __stat(uri: URI, opts?: IResolveStatOptions): Promise<IResolvedFileStat> {
        return this.fileService.stat(uri, opts);
    }

    private async __readFile(uri: URI, opts?: IReadFileOptions): Promise<DataBuffer> {
        return this.fileService.readFile(uri, opts);
    }

    private async __readDir(uri: URI): Promise<[string, FileType][]> {
        return this.fileService.readDir(uri);
    }

    private async __readFileStream(uri: URI, opts?: IReadFileOptions): Promise<IReadableStream<DataBuffer>> {
        return this.fileService.readFileStream(uri, opts);
    }

    private async __writeFile(uri: URI, bufferOrStream: DataBuffer | IReadableStream<DataBuffer>, opts?: IWriteFileOptions): Promise<void> {
        return this.fileService.writeFile(uri, bufferOrStream, opts);
    }

    private async __exist(uri: URI): Promise<boolean> {
        return this.fileService.exist(uri);
    }

    private async __createFile(uri: URI, bufferOrStream?: DataBuffer | IReadableStream<DataBuffer>, opts?: ICreateFileOptions): Promise<void> {
        return this.fileService.createFile(uri, bufferOrStream, opts);
    }

    private async __createDir(uri: URI): Promise<void> {
        return this.fileService.createDir(uri);
    }

    private async __moveTo(from: URI, to: URI, overwrite?: boolean): Promise<IResolvedFileStat> {
        return this.fileService.moveTo(from, to, overwrite);
    }

    private async __copyTo(from: URI, to: URI, overwrite?: boolean): Promise<IResolvedFileStat> {
        return this.fileService.copyTo(from, to, overwrite);
    }

    private async __delete(uri: URI, opts?: IDeleteFileOptions): Promise<void> {
        return this.fileService.delete(uri, opts);
    }

    private __watch(uri: URI, opts?: IWatchOptions): void {
        const raw = URI.toString(uri);
        const exist = this._activeWatchers.get(raw);
        if (exist) {
            this.logService.warn('file service - duplicate watching on the same resource', URI.toString(uri));
            return;
        }
        const disposable = this.fileService.watch(uri, opts);
        this._activeWatchers.set(raw, disposable);
    }

    private __unwatch(uri: URI): void {
        const raw = URI.toString(uri);
        const watchInstance = this._activeWatchers.get(raw);
        if (watchInstance) {
            watchInstance.dispose();
            this._activeWatchers.delete(raw);
        }
    }

    private __onDidResourceChange(): Register<readonly IResourceChangeEvent[]> {
        return this.fileService.onDidResourceChange;
    }

    private __onDidResourceClose(): Register<URI> {
        return this.fileService.onDidResourceClose;
    }

    private __onDidAllResourceClosed(): Register<void> {
        return this.fileService.onDidAllResourceClosed;
    }

}