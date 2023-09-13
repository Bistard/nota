import { IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileType, hasReadFileStreamCapability, ICreateFileOptions, IDeleteFileOptions, IReadFileOptions, IResolvedFileStat, IResolveStatOptions, IWatchOptions, IWriteFileOptions } from "src/base/common/files/file";
import { IReadableStream, listenStream } from "src/base/common/files/stream";
import { Schemas, URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { CancellationToken } from "src/base/common/utilities/cacellation";
import { IFileService } from "src/platform/files/common/fileService";
import { IRawResourceChangeEvents } from "src/platform/files/common/watcher";
import { IServerChannel } from "src/platform/ipc/common/channel";
import { IReviverRegistrant } from "src/platform/ipc/common/revive";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";

/** @internal */
export type ReadableStreamDataFlowType<TData> = TData | Error | 'end';

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

    private readonly _reviver: IReviverRegistrant;

    // [constructor]

    constructor(
        private readonly logService: ILogService,
        private readonly fileService: IFileService,
        registrantService: IRegistrantService,
    ) {
        this._reviver = registrantService.getRegistrant(RegistrantType.Reviver);
    }

    // [public methods]

    public async callCommand(_id: string, command: FileCommand, arg: any[]): Promise<any> {
        switch (command) {
            case FileCommand.stat: return this.__stat(arg[0], arg[1]);
            case FileCommand.readFile: return this.__readFile(arg[0], arg[1]);
            case FileCommand.readDir: return this.__readDir(arg[0]);
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

    public registerListener(_id: string, event: FileCommand, arg: any[]): Register<any> {
        switch (event) {
            case FileCommand.readFileStream: return this.__onReadFileStream(arg[0], arg[1]);
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

    /**
     * Reading file using stream needs to be handled specially when acrossing 
     * IPC. The channels between client and server is using `registerListener` 
     * API instead of using `callCommand` internally.
     */
    private __onReadFileStream(uri: URI, opts?: IReadFileOptions): Register<ReadableStreamDataFlowType<DataBuffer>> {
        const token = new CancellationToken();
        uri = URI.revive(uri, this._reviver);

        const emitter = new Emitter<ReadableStreamDataFlowType<DataBuffer>>({
            onLastListenerRemoved: () => token.cancel()
        });

        const provider = this.fileService.getProvider(Schemas.FILE);
        if (!provider) {
            throw new Error(`Cannot read file on stream since the corresponding provider with type ${Schemas.FILE} is not registered.`);
        }

        if (!hasReadFileStreamCapability(provider)) {
            throw new Error('The registered provider does not has read file stream capability.');
        }

        const stream = provider.readFileStream(uri, opts);
        listenStream(stream, {
            onData: (data) => emitter.fire(DataBuffer.wrap(data)),
            onError: (error) => emitter.fire(error),
            onEnd: () => {
                emitter.fire('end');
                emitter.dispose();
                token.cancel();
            }
        });

        return emitter.registerListener;
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

        /**
         * // FIX
         * Each watching request from different processes should be archived.
         * This can prevent when overlapping watch request from different 
         * processes.
         */

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

    private __onDidResourceChange(): Register<IRawResourceChangeEvents> {
        return this.fileService.onDidResourceChange;
    }

    private __onDidResourceClose(): Register<URI> {
        return this.fileService.onDidResourceClose;
    }

    private __onDidAllResourceClosed(): Register<void> {
        return this.fileService.onDidAllResourceClosed;
    }

}