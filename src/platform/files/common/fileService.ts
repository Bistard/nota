import { Disposable, IDisposable } from "src/base/common/dispose";
import { AsyncResult, Result, err, errorToMessage, ok } from "src/base/common/error";
import { Emitter, Register } from "src/base/common/event";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileSystemProviderAbleToRead, hasOpenReadWriteCloseCapability, hasReadWriteCapability, IReadFileOptions, IFileSystemProvider, IFileSystemProviderWithFileReadWrite, IFileSystemProviderWithOpenReadWriteClose, IWriteFileOptions, IFileStat, FileType, FileOperationErrorType, FileSystemProviderCapability, IDeleteFileOptions, IResolveStatOptions, IResolvedFileStat, hasReadFileStreamCapability, IFileSystemProviderWithReadFileStream, ICreateFileOptions, FileOperationError, hasCopyCapability, IWatchOptions, FileSystemProviderError } from "src/base/common/files/file";
import { basename, dirname, join } from "src/base/common/files/path";
import { bufferToStream, IReadableStream, listenStream, newWriteableBufferStream, readFileIntoStream, readFileIntoStreamAsync, streamToBuffer, transformStream } from "src/base/common/files/stream";
import { isAbsoluteURI, URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { Blocker } from "src/base/common/utilities/async";
import { Iterable } from "src/base/common/utilities/iterable";
import { Mutable, Pair } from "src/base/common/utilities/type";
import { IRawResourceChangeEvents } from "src/platform/files/common/watcher";
import { IService, createService } from "src/platform/instantiation/common/decorator";

export const IFileService = createService<IFileService>('file-service');

export interface IFileService extends IDisposable, IService {

    /**
     * Fires when the watched resources are either added, deleted or updated.
     */
    readonly onDidResourceChange: Register<IRawResourceChangeEvents>;

    /**
     * Fires when any watched resource is closed.
     */
    readonly onDidResourceClose: Register<URI>;

    /**
     * Fires when all the watched resources are closed.
     */
    readonly onDidAllResourceClosed: Register<void>;

    /** 
     * @description Registers a file system provider for a given scheme. 
     */
    registerProvider(scheme: string, provider: IFileSystemProvider): void;

    /** 
     * @description Gets a file system provider for a given scheme. 
     */
    getProvider(scheme: string): IFileSystemProvider | undefined;

    /**
     * @description Resolves the properties of a file/folder identified by the 
     * given URI.
     * @param uri The given URI.
     * @param opts Option of the operation.
     * @returns The properties of the specified file/folder.
     */
    stat(uri: URI, opts?: IResolveStatOptions): AsyncResult<IResolvedFileStat, FileOperationError>;

    /** 
     * @description Read the file unbuffered. 
     * @note Options is set to false if it is not given.
     */
    readFile(uri: URI, opts?: IReadFileOptions): AsyncResult<DataBuffer, FileOperationError>;

    /**
     * @description Reads the directory by a given URI.
     */
    readDir(uri: URI): AsyncResult<Pair<string, FileType>[], FileOperationError>;

    /** 
     * @description Read the file buffered using stream. 
     * @note Options is set to false if it is not given.
     */
    readFileStream(uri: URI, opts?: IReadFileOptions): AsyncResult<IReadableStream<DataBuffer>, FileOperationError>;

    /** 
     * @description Write to the file. 
     * @note Options is set to false if it is not given.
     */
    writeFile(uri: URI, bufferOrStream: DataBuffer | IReadableStream<DataBuffer>, opts?: IWriteFileOptions): AsyncResult<void, FileOperationError>;

    /** 
     * @description Determines if the file/directory exists. 
     */
    exist(uri: URI): AsyncResult<boolean, FileOperationError>;

    /** 
     * @description Creates a file described by a given URI. 
     * @note Options is set to false if it is not given.
     */
    createFile(uri: URI, bufferOrStream?: DataBuffer | IReadableStream<DataBuffer>, opts?: ICreateFileOptions): AsyncResult<void, FileOperationError>;

    /** 
     * @description Creates a directory described by a given URI. 
     */
    createDir(uri: URI): AsyncResult<void, FileOperationError>;

    /** 
     * @description Moves a file/directory to a new location described by a given URI. 
     */
    moveTo(from: URI, to: URI, overwrite?: boolean): AsyncResult<IResolvedFileStat, FileOperationError>;

    /** 
     * @description Copys a file/directory to a new location. 
     */
    copyTo(from: URI, to: URI, overwrite?: boolean): AsyncResult<IResolvedFileStat, FileOperationError>;

    /** 
     * @description Deletes a file/directory described by a given URI. 
     */
    delete(uri: URI, opts?: IDeleteFileOptions): AsyncResult<void, FileOperationError>;

    /**
     * @description Watch the given target and events will be fired by listening 
     * to file service.
     */
    watch(uri: URI, opts?: IWatchOptions): Result<IDisposable, FileOperationError>;
}

/**
 * @class Provides a high-level abstraction layer for file system operations. 
 * This service allows for reading, writing, creating, and manipulating files 
 * and directories in a file system. 
 * 
 * It supports registering multiple {@link IFileSystemProvider}, each associated 
 * with a specific URI scheme.
 * 
 * The detailed implementation of every file operations is implemented by
 * {@link IFileSystemProvider}. The class acts as a central point for file 
 * system operations, allowing for a unified way to interact with different file 
 * systems.
 */
export class FileService extends Disposable implements IFileService {

    declare _serviceMarker: undefined;

    // [event]

    private readonly _onDidResourceChange = this.__register(new Emitter<IRawResourceChangeEvents>());
    public readonly onDidResourceChange = this._onDidResourceChange.registerListener;

    private readonly _onDidResourceClose = this.__register(new Emitter<URI>());
    public readonly onDidResourceClose = this._onDidResourceClose.registerListener;

    private readonly _onDidAllResourceClosed = this.__register(new Emitter<void>());
    public readonly onDidAllResourceClosed = this._onDidAllResourceClosed.registerListener;

    private readonly _activeWatchers = new Map<URI, IDisposable>();

    // [fields]

    private readonly _providers: Map<string, IFileSystemProvider> = new Map();

    /** @readonly read into chunks of 256KB each to reduce IPC overhead. */
    public static readonly bufferSize = 256 * 1024;

    // [constructor]

    constructor(@ILogService private readonly logService: ILogService) {
        super();
    }

    /***************************************************************************
     * public API - Provider Operations
     **************************************************************************/

    public registerProvider(scheme: string, provider: IFileSystemProvider): void {
        this._providers.set(scheme, provider);

        this.__register(provider.onDidResourceChange(e => this._onDidResourceChange.fire(e)));
        this.__register(provider.onDidResourceClose(uri => {
            this.logService.trace('[FileService] stop watching on ' + URI.toString(uri));

            this._activeWatchers.delete(uri);
            this._onDidResourceClose.fire(uri);

            if (!this._activeWatchers.size) {
                this._onDidAllResourceClosed.fire();
            }
        }));
    }

    public getProvider(scheme: string): IFileSystemProvider | undefined {
        return this._providers.get(scheme);
    }

    /***************************************************************************
     * public API - File Operations
     **************************************************************************/

    public async stat(uri: URI, opts?: IResolveStatOptions): AsyncResult<IResolvedFileStat, FileOperationError> {
        const get = this.__getProvider(uri);
        if (get.isErr()) {
            return err(get.error);
        }
        const provider = get.data;

        const ifStat = await Result.fromPromise(
            () => provider.stat(uri),
            (error) => new FileOperationError(errorToMessage(error), getFileErrorCode(error)),
        );
        if (ifStat.isErr()) {
            return err(ifStat.error);
        }
        const stat = ifStat.data;

        const ifResolved = await this.__resolveStat(uri, provider, stat, opts);
        if (ifResolved.isErr()) {
            return err(ifResolved.error);
        }

        const resolvedStat = ifResolved.data;
        return ok(resolvedStat);
    }

    public async readFile(uri: URI, opts?: IReadFileOptions): AsyncResult<DataBuffer, FileOperationError> {
        const get = this.__getReadProvider(uri);
        if (get.isErr()) {
            return err(get.error);
        }
        const provider = get.data;

        return await this.__readFile(provider, uri, opts);
    }

    public async readFileStream(uri: URI, opts?: IReadFileOptions): AsyncResult<IReadableStream<DataBuffer>, FileOperationError> {
        const get = this.__getReadProvider(uri);
        if (get.isErr()) {
            return err(get.error);
        }
        const provider = get.data;

        return this.__readFileStream(provider, uri, opts);
    }

    public async writeFile(uri: URI, bufferOrStream: DataBuffer | IReadableStream<DataBuffer>, opts?: IWriteFileOptions): AsyncResult<void, FileOperationError> {
        const get = this.__getWriteProvider(uri);
        if (get.isErr()) {
            return err(get.error);
        }
        const provider = get.data;

        // validate write operation, returns the stat of the file.
        const validate = await this.__validateWrite(provider, uri, opts);
        if (validate.isErr()) {
            return err(validate.error);
        }
        
        // create recursive directory if necessary
        const stat = validate.data;
        if (!stat) {
            const result = await this.__mkdirRecursive(provider, URI.fromFile(dirname(URI.toFsPath(uri))));
            if (result.isErr()) {
                return err(result.error);
            }
        }

        // REVIEW: optimization?

        /**
         * write file: unbuffered (only if data to write is a buffer, or the 
         * provider has no buffered write capability).
         */
        if ((hasReadWriteCapability(provider) && bufferOrStream instanceof DataBuffer) ||
            !hasOpenReadWriteCloseCapability(provider)
        ) {
            const result = await this.__writeUnbuffered(provider, uri, opts, bufferOrStream);
            if (result.isErr()) {
                return err(result.error);
            }
        }

        // write file: buffered
        else {
            const result = await this.__writeBuffered(provider, uri, opts, bufferOrStream instanceof DataBuffer ? bufferToStream(bufferOrStream) : bufferOrStream);
            if (result.isErr()) {
                return err(result.error);
            }
        }

        return ok();
    }

    public async exist(uri: URI): AsyncResult<boolean, FileOperationError> {
        const get = this.__getProvider(uri);
        if (get.isErr()) {
            return err(get.error);
        }

        const provider = get.data;

        const statResult = await Result.fromPromise(
            () => provider.stat(uri),
            error => new FileOperationError(errorToMessage(error), getFileErrorCode(error)),
        );

        if (statResult.isErr()) {
            return ok(false);
        }

        return ok(true);
    }

    public async createFile(
        uri: URI,
        bufferOrStream: DataBuffer | IReadableStream<DataBuffer> = DataBuffer.alloc(0),
        opts?: ICreateFileOptions,
    ): AsyncResult<void, FileOperationError>
    {
        // validation
        const validate = await this.__validateCreate(uri, opts);
        if (validate.isErr()) {
            return err(validate.error);
        }
        
        // write operation
        const result = await this.writeFile(uri, bufferOrStream, { create: true, overwrite: !!opts?.overwrite, unlock: false });
        if (result.isErr()) {
            return err(result.error);
        }

        return ok();
    }

    public async readDir(uri: URI): AsyncResult<Pair<string, FileType>[], FileOperationError> {
        const get = this.__getProvider(uri);
        if (get.isErr()) {
            return err(get.error);
        }
        
        const provider = get.data;
        const readResult = await Result.fromPromise(
            () => provider.readdir(uri),
            error => new FileOperationError(errorToMessage(error), getFileErrorCode(error)),
        );

        if (readResult.isErr()) {
            return err(readResult.error);
        }

        const dir = readResult.data;
        return ok(dir);
    }

    public async createDir(uri: URI): AsyncResult<void, FileOperationError> {
        const get = this.__getWriteProvider(uri);
        if (get.isErr()) {
            return err(get.error);
        }

        const provider = get.data;

        // create directory recursively
        const result = await this.__mkdirRecursive(provider, uri);
        if (result.isErr()) {
            return err(result.error);
        }

        return ok(result.data);
    }

    public async moveTo(from: URI, to: URI, overwrite?: boolean): AsyncResult<IResolvedFileStat, FileOperationError> {
        const fromResult = this.__getWriteProvider(from);
        if (fromResult.isErr()) {
            return err(fromResult.error);
        }
        
        const toResult = this.__getWriteProvider(from);
        if (toResult.isErr()) {
            return err(toResult.error);
        }

        const fromProvider = fromResult.data;
        const toProvider = toResult.data;

        // move operation
        const moveResult = await this.__doMoveTo(from, fromProvider, to, toProvider, overwrite);
        if (moveResult.isErr()) {
            return err(moveResult.error);
        }

        const stat = await this.stat(to);
        return stat;
    }

    public async copyTo(from: URI, to: URI, overwrite?: boolean): AsyncResult<IResolvedFileStat, FileOperationError> {
        const fromResult = this.__getWriteProvider(from);
        if (fromResult.isErr()) {
            return err(fromResult.error);
        }
        
        const toResult = this.__getWriteProvider(from);
        if (toResult.isErr()) {
            return err(toResult.error);
        }

        const fromProvider = fromResult.data;
        const toProvider = toResult.data;

        // copy operation
        const copyResult = await this.__doCopyTo(from, fromProvider, to, toProvider, overwrite);
        if (copyResult.isErr()) {
            return err(copyResult.error);
        }

        const stat = await this.stat(to);
        return stat;
    }

    public async delete(uri: URI, opts?: IDeleteFileOptions): AsyncResult<void, FileOperationError> {
        
        // validation
        const validate = await this.__validateDelete(uri, opts);
        if (validate.isErr()) {
            return err(validate.error);
        }

        const provider = validate.data;

        // delete operation
        return Result.fromPromise(
            () => provider.delete(uri, { useTrash: !!opts?.useTrash, recursive: !!opts?.recursive }),
            error => new FileOperationError(`unable to delete uri: '${URI.toFsPath(uri)}'`, getFileErrorCode(error), error),
        );
    }

    public watch(uri: URI, opts?: IWatchOptions): Result<IDisposable, FileOperationError> {
        if (this._activeWatchers.has(uri)) {
            this.logService.warn('[FileService] duplicate watching on the same resource', URI.toString(uri));
            return ok(Disposable.NONE);
        }

        this.logService.trace(`[FileService] Watching on '${URI.toString(uri)}'`);

        const get = this.__getProvider(uri);
        if (get.isErr()) {
            return err(get.error);
        }
        const provider = get.data;

        const result = Result.fromThrowable(
            () => provider.watch(uri, opts),
            error => new FileOperationError(errorToMessage(error), getFileErrorCode(error)),
        );
        
        if (result.isErr()) {
            return err(result.error);
        }

        const disposable = result.data;
        this._activeWatchers.set(uri, disposable);

        return ok(disposable);
    }

    public override dispose(): void {
        for (const active of this._activeWatchers.values()) {
            active.dispose();
        }
        // have to unregister listeners after everything is done
        this.onDidAllResourceClosed(() => super.dispose());
    }

    /***************************************************************************
     * Reading files related helper methods.
     **************************************************************************/

    private async __readFile(
        provider: FileSystemProviderAbleToRead,
        uri: URI,
        opts?: IReadFileOptions,
    ): AsyncResult<DataBuffer, FileOperationError> 
    {
        const result = await this.__readFileStream(provider, uri, { ...opts, preferUnbuffered: true });
        if (result.isErr()) {
            return err(result.error);
        }

        const stream = result.data;
        const buffer = await streamToBuffer(stream);
        
        return ok(buffer);
    }

    private async __readFileStream(
        provider: FileSystemProviderAbleToRead,
        uri: URI,
        opts?: IReadFileOptions & { preferUnbuffered?: boolean; },
    ): AsyncResult<IReadableStream<DataBuffer>, FileOperationError> 
    {
        const validate = await this.__validateRead(provider, uri, opts);
        if (validate.isErr()) {
            return err(validate.error);
        }

        let stream: IReadableStream<DataBuffer> | undefined = undefined;

        /**
         * read unbuffered:
         *  - the provider has no buffered capability
         *  - prefer unbuffered
         */
        if (!(hasOpenReadWriteCloseCapability(provider) ||
            hasReadFileStreamCapability(provider)) ||
            (hasReadWriteCapability(provider) && opts?.preferUnbuffered)
        ) {
            stream = this.__readFileUnbuffered(provider, uri, opts);
        }

        // read streamed
        else if (hasReadFileStreamCapability(provider)) {
            stream = this.__readFileStreamed(provider, uri, opts);
        }

        // read buffered
        else {
            stream = this.__readFileBuffered(provider, uri, opts);
        }

        return ok(stream);
    }

    /** @description Read the file directly into the memory in one time. */
    private __readFileUnbuffered(
        provider: IFileSystemProviderWithFileReadWrite,
        uri: URI,
        opts?: IReadFileOptions,
    ): IReadableStream<DataBuffer> 
    {
        const stream = newWriteableBufferStream();
        readFileIntoStreamAsync(provider, uri, stream, opts);
        return stream;
    }

    private __readFileStreamed(
        provider: IFileSystemProviderWithReadFileStream,
        uri: URI,
        opts?: IReadFileOptions,
    ): IReadableStream<DataBuffer> 
    {
        const stream = provider.readFileStream(uri, opts);
        return transformStream(
            stream, {
            data: data => DataBuffer.wrap(data)
        },
            data => DataBuffer.concat(data)
        );
    }

    /** @description Read the file using buffer I/O. */
    private __readFileBuffered(
        provider: IFileSystemProviderWithOpenReadWriteClose,
        uri: URI,
        opts?: IReadFileOptions,
    ): IReadableStream<DataBuffer> 
    {
        const stream = newWriteableBufferStream();
        readFileIntoStream(provider, uri, stream, data => data, { ...opts, bufferSize: FileService.bufferSize });
        return stream;
    }

    /***************************************************************************
     * Writing files related helper methods.
     **************************************************************************/

    private async __writeUnbuffered(
        provider: IFileSystemProviderWithFileReadWrite,
        uri: URI,
        opts: IWriteFileOptions | undefined,
        bufferOrStream: DataBuffer | IReadableStream<DataBuffer>,
    ): AsyncResult<void, FileOperationError> 
    {
        const buffer: DataBuffer = bufferOrStream instanceof DataBuffer ? bufferOrStream : await streamToBuffer(bufferOrStream);
        
        // write through a provider
        return Result.fromPromise(
            async () => { await provider.writeFile(uri, buffer.buffer, { create: opts?.create ?? false, overwrite: opts?.overwrite ?? false, unlock: opts?.unlock ?? false }); },
            error => new FileOperationError(errorToMessage(error), getFileErrorCode(error)),
        );
    }

    private async __writeBuffered(
        provider: IFileSystemProviderWithOpenReadWriteClose,
        uri: URI,
        opts: IWriteFileOptions | undefined,
        stream: IReadableStream<DataBuffer>,
    ): AsyncResult<void, FileOperationError>
    {
        // open the file
        const opened = await Result.fromPromise(
            async () => await provider.open(uri, { create: true, unlock: opts?.unlock ?? false }),
            error => new FileOperationError(errorToMessage(error), getFileErrorCode(error)),
        );
        
        if (opened.isErr()) {
            return err(opened.error);
        }
        const fd = opened.data;

        const blocker = new Blocker<void>();
        let posInFile = 0;

        listenStream(stream, {
            onData: async (chunk: DataBuffer) => {

                // pause stream to perform async write operation
                stream.pause();

                const writeResult = await this.__writeBuffer(provider, fd, chunk, chunk.bufferLength, posInFile, 0);
                if (writeResult.isErr()) {
                    return blocker.reject(writeResult.error);
                }
                
                posInFile += chunk.bufferLength;

                /**
                 * resume stream now that we have successfully written run this 
                 * on the next tick to prevent increasing the execution stack 
                 * because resume() may call the event handler again before 
                 * finishing.
                 */
                setTimeout(() => stream.resume());
            },
            onError: error => blocker.reject(error),
            onEnd: () => blocker.resolve(),
        });

        return Result.fromPromise(
            () => blocker.waiting().finally(() => provider.close(fd)),
            error => new FileOperationError(`unable to write the file buffered ${URI.toFsPath(uri)}`, getFileErrorCode(error), error),
        );
    }

    private async __writeBuffer(
        provider: IFileSystemProviderWithOpenReadWriteClose,
        fs: number,
        buffer: DataBuffer,
        length: number,
        posInFile: number,
        posInBuffer: number,
    ): AsyncResult<void, Error> 
    {
        return Result.fromPromise(
            async () => {
                let written = 0;
                while (written < length) {
                    written += await provider.write(fs, posInFile + written, buffer.buffer, posInBuffer + written, length - written);
                }
            },
            err => <Error>err,
        );
    }

    /**
     * @description Create directory recursively if not existed.
     */
    private async __mkdirRecursive(provider: IFileSystemProvider, dir: URI): AsyncResult<void, FileOperationError> {

        const dirWaitToBeCreate: string[] = [];
        let path = dir;

        while (true) {
            const statResult = await Result.fromPromise(
                async () => await provider.stat(path),
                error => undefined,
            );

            // we reaches a not existed directory, we remember it.
            if (statResult.isErr()) {
                dirWaitToBeCreate.push(URI.basename(path));
                path = URI.dirname(path);
                continue;
            }

            // not a directory
            const stat = statResult.data;
            if ((stat.type & FileType.DIRECTORY) === 0) {
                return err(new FileOperationError('undable to create directory that already exists but is not a directory', FileOperationErrorType.FILE_IS_DIRECTORY));
            }

            // we reaches a existed directory, we break the loop.
            break;
        }

        for (let i = dirWaitToBeCreate.length - 1; i >= 0; i--) {
            path = URI.join(path, dirWaitToBeCreate[i]!);

            const res = await Result.fromPromise(
                async () => provider.mkdir(path),
                error => new FileOperationError(errorToMessage(error), getFileErrorCode(error)),
            );

            if (res.isErr()) {
                return err(res.error);
            }
        }

        return ok();
    }

    /**
     * @description Resolves the {@link IFileStat} and returns as {@link IResolvedFileStat}.
     */
    private async __resolveStat(
        uri: URI,
        provider: IFileSystemProvider,
        stat: IFileStat,
        opts?: IResolveStatOptions,
    ): AsyncResult<IResolvedFileStat, FileOperationError> 
    {
        // the resolved file stat
        const resolved: IResolvedFileStat = {
            ...stat,
            name: basename(URI.toFsPath(uri)),
            uri: uri,
            readonly: stat.readonly || Boolean(provider.capabilities & FileSystemProviderCapability.Readonly),
            children: undefined,
        };

        // resolves the children if needed
        if (stat.type === FileType.DIRECTORY && opts && (opts.resolveChildren || opts.resolveChildrenRecursive)) {

            const dirResult = await Result.fromPromise(
                () => provider.readdir(uri),
                error => new FileOperationError(errorToMessage(error), getFileErrorCode(error)),
            );
            
            if (dirResult.isErr()) {
                return err(dirResult.error);
            }

            const children = dirResult.data;
            const resolvedChildren = await Promise.all(
                children.map(async ([name, _type]) => {
                    const childUri = URI.fromFile(join(URI.toFsPath(uri), name));

                    const statResult = await Result.fromPromise(
                        () => provider.stat(childUri),
                        error => error,
                    );

                    if (statResult.isErr()) {
                        return undefined;
                    }
                    
                    const childStat = statResult.data;
                    const recursive = await this.__resolveStat(childUri, provider, childStat, { resolveChildren: opts.resolveChildrenRecursive });
                    if (recursive.isErr()) {
                        return undefined;
                    }

                    return recursive.data;
                })
            );

            (<Mutable<Iterable<IResolvedFileStat>>>resolved.children) = Iterable.filter(resolvedChildren, (child) => !!child);
        }

        return ok(resolved);
    }

    private async __doMoveTo(from: URI, fromProvider: IFileSystemProvider, to: URI, toProvider: IFileSystemProvider, overwrite?: boolean): AsyncResult<void, FileOperationError> {
        if (URI.toString(from) === URI.toString(to)) {
            return ok();
        }

        const validate = await this.__validateMoveOrCopy(to, overwrite);
        if (validate.isErr()) {
            return err(validate.error);
        }
        
        const exist = validate.data;
        if (exist && overwrite) {
            const res = await this.delete(to, { recursive: true });
            if (res.isErr()) {
                return err(res.error);
            }
        }

        const toUriDir = URI.fromFile(dirname(URI.toFsPath(to)));
        const mkdirResult = await this.__mkdirRecursive(toProvider, toUriDir);
        if (mkdirResult.isErr()) {
            return err(mkdirResult.error);
        }

        const copyResult = await this.__doCopyTo(from, fromProvider, to, toProvider, overwrite);
        if (copyResult.isErr()) {
            return err(copyResult.error);
        }

        const deleteResult = await this.delete(from, { recursive: true });
        if (deleteResult.isErr()) {
            return err(deleteResult.error);
        }

        return ok();
    }

    private async __doCopyTo(from: URI, fromProvider: IFileSystemProvider, to: URI, toProvider: IFileSystemProvider, overwrite?: boolean): AsyncResult<void, FileOperationError> {
        if (URI.toString(from) === URI.toString(to)) {
            return ok();
        }

        const validate = await this.__validateMoveOrCopy(to, overwrite);
        if (validate.isErr()) {
            return err(validate.error);
        }

        const exist = validate.data;
        if (exist && overwrite) {
            const res = await this.delete(to, { recursive: true });
            if (res.isErr()) {
                return err(res.error);
            }
        }

        const toUriDir = URI.fromFile(dirname(URI.toFsPath(to)));
        const mkdirResult = await this.__mkdirRecursive(toProvider, toUriDir);
        if (mkdirResult.isErr()) {
            return err(mkdirResult.error);
        }

        if (!hasCopyCapability(fromProvider)) {
            return err(new FileOperationError(`Unable to move / copy to the target path ${URI.toString(to)} because the provider does not provide move / copy functionality.`, FileOperationErrorType.OTHERS));
        } 

        return Result.fromPromise(
            () => fromProvider.copy(from, to, { overwrite: !!overwrite }),
            error => new FileOperationError(errorToMessage(error), getFileErrorCode(error)),
        );
    }

    private async __validateMoveOrCopy(to: URI, overwrite?: boolean): AsyncResult<boolean, FileOperationError> {
        const result = await this.exist(to);
        if (result.isErr()) {
            return err(result.error);
        }

        const exist = result.data;
        if (exist && overwrite === false) {
            return err(new FileOperationError(`Unable to move / copy to the target path ${URI.toString(to)} because already exists.`, FileOperationErrorType.FILE_EXISTS));
        }

        return ok(exist);
    }

    /***************************************************************************
     * Provider related helper methods.
     **************************************************************************/

    private __getReadProvider(uri: URI): Result<IFileSystemProviderWithFileReadWrite | IFileSystemProviderWithOpenReadWriteClose, FileOperationError> 
    {
        const get = this.__getProvider(uri);
        if (get.isErr()) {
            return err(get.error);
        }

        const provider = get.data;

        if (hasOpenReadWriteCloseCapability(provider) || hasReadWriteCapability(provider)) {
            return ok(provider);
        }

        return err(new FileOperationError(`Filesystem provider for scheme '${uri.scheme}' neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the read operation.`, FileOperationErrorType.OTHERS));
    }

    private __getWriteProvider(uri: URI): Result<IFileSystemProviderWithFileReadWrite | IFileSystemProviderWithOpenReadWriteClose, FileOperationError> 
    {
        const get = this.__getProvider(uri);
        if (get.isErr()) {
            return err(get.error);
        }
        
        const readonlyResult = this.__errIfProviderReadonly(get.data);
        if (readonlyResult.isErr()) {
            return err(readonlyResult.error);
        }

        const provider = readonlyResult.data;

        if (hasOpenReadWriteCloseCapability(provider) || hasReadWriteCapability(provider)) {
            return ok(provider);
        }

        return err(new FileOperationError(`filesystem provider for scheme '${uri.scheme}' neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the write operation.`, FileOperationErrorType.OTHERS));
    }

    private __getProvider(uri: URI): Result<IFileSystemProvider, FileOperationError> {

        // Assert path is absolute
        if (isAbsoluteURI(uri) === false) {
            return err(new FileOperationError(`unable to resolve filesystem provider with relative file path '${uri.path}`, FileOperationErrorType.OTHERS));
        }

        // Assert provider
        const provider = this._providers.get(uri.scheme);
        if (!provider) {
            return err(new FileOperationError(`no provider found given ${uri.scheme}`, FileOperationErrorType.OTHERS));
        }

        return ok(provider);
    }

    /***************************************************************************
     * Validation
     **************************************************************************/

    private async __validateRead(
        provider: IFileSystemProvider,
        uri: URI,
        opts?: IReadFileOptions,
    ): AsyncResult<void, FileOperationError> 
    {
        const result = await Result.fromPromise(
            () => provider.stat(uri),
            error => new FileOperationError(errorToMessage(error), getFileErrorCode(error)),
        );
        if (result.isErr()) {
            return err(result.error);
        }

        const stat = result.data;
        if (!stat) {
            return err(new FileOperationError('target URI does not exist', FileOperationErrorType.FILE_INVALID_PATH));
        } else if (stat.type & FileType.DIRECTORY) {
            return err(new FileOperationError('unable to read file which is actually a directory', FileOperationErrorType.FILE_IS_DIRECTORY));
        }

        const validate = this.__validateReadLimit(stat.byteSize, opts);
        if (validate.isErr()) {
            return err(validate.error);
        }

        return ok();
    }

    /**
     * @description Validates if the write operation is legal under the given 
     * provider. Returns the stat of the file. Throws if it is a directory or it 
     * is a readonly file.
     * @returns The stat of the file. Returns undefined if file does not exists.
     */
    private async __validateWrite(
        provider: IFileSystemProvider,
        uri: URI,
        opts?: IWriteFileOptions,
    ): AsyncResult<IFileStat | undefined, FileOperationError>
    {
        // todo: Validate unlock support (use `opts`)

        // get the stat of the file
        let stat: IFileStat | undefined = undefined;
        
        const statResult = await Result.fromPromise(
            async () => await provider.stat(uri),
            error => undefined, // file might not exist
        );

        if (statResult.isErr()) {
            return ok(undefined);
        }
        stat = statResult.data;

        // cannot be a directory
        if (stat.type & FileType.DIRECTORY) {
            return err(new FileOperationError('unable to write file which is actually a directory', FileOperationErrorType.FILE_IS_DIRECTORY));
        }

        // cannot be readonly file
        if (stat.readonly ?? false) {
            return err(new FileOperationError('unable to write file which is readonly', FileOperationErrorType.FILE_READONLY));
        }

        return ok(stat);
    }

    private __validateReadLimit(size: number, opts?: IReadFileOptions): Result<void, FileOperationError> {
        if (opts?.limits) {

            let tooLargeErrorResult: FileOperationErrorType | undefined = undefined;

            if (typeof opts.limits.memory === 'number' && size > opts.limits.memory) {
                tooLargeErrorResult = FileOperationErrorType.FILE_EXCEEDS_MEMORY_LIMIT;
            }

            if (typeof opts.limits.size === 'number' && size > opts.limits.size) {
                tooLargeErrorResult = FileOperationErrorType.FILE_TOO_LARGE;
            }

            if (typeof tooLargeErrorResult === 'number') {
                if (tooLargeErrorResult === FileOperationErrorType.FILE_EXCEEDS_MEMORY_LIMIT) {
                    return err(new FileOperationError('read file exceeds memory limit', tooLargeErrorResult));
                } else {
                    return err(new FileOperationError('read file is too large', tooLargeErrorResult));
                }
            }
        }

        return ok();
    }

    private async __validateCreate(uri: URI, opts?: ICreateFileOptions): AsyncResult<void, FileOperationError> {
        const check = await this.exist(uri);
        const ifExist = (check.isOk() && check.unwrap() === true);
        
        // if file exists and is not allowed to overwrite, we throw
        if (ifExist && opts?.overwrite === false) {
            return err(new FileOperationError('file already exists', FileOperationErrorType.FILE_EXISTS));
        }
        return ok();
    }

    private async __validateDelete(uri: URI, opts?: IDeleteFileOptions): AsyncResult<IFileSystemProvider, FileOperationError> {
        const get = this.__getWriteProvider(uri);
        if (get.isErr()) {
            return err(get.error);
        }
        
        const ifReadonly = this.__errIfProviderReadonly(get.data);
        if (ifReadonly.isErr()) {
            return err(ifReadonly.error);
        }
        
        const provider = ifReadonly.data;
        
        // delete validation
        const statResult = await Result.fromPromise(
            async () => provider.stat(uri),
            _err => new FileOperationError('file or directory does not exist', FileOperationErrorType.FILE_NOT_FOUND),
        );
        
        if (statResult.isErr()) {
            return err(statResult.error);
        }
        const stat = statResult.data;
        
        // validate if it is readonly
        const fileResult = this.__errIfFileIsReadonly(stat);
        if (fileResult.isErr()) {
            return err(fileResult.error);
        }

        return ok(provider);
    }

    private __errIfProviderReadonly(provider: IFileSystemProvider): Result<IFileSystemProvider, FileOperationError> {
        if (provider.capabilities & FileSystemProviderCapability.Readonly) {
            return err(new FileOperationError('file system provider is readonly', FileOperationErrorType.FILE_READONLY));
        }
        return ok(provider);
    }

    private __errIfFileIsReadonly(stat: IFileStat): Result<void, FileOperationError> {
        if (typeof stat.readonly === 'boolean' && stat.readonly === true) {
            return err(new FileOperationError('unable to modify a readonly file', FileOperationErrorType.FILE_READONLY));
        }
        return ok();
    }
}

function getFileErrorCode(error: unknown): FileOperationErrorType {
    if (error instanceof FileSystemProviderError) {
        return error.code;
    }

    if (error instanceof FileOperationError) {
        return error.code;
    }

    return FileOperationErrorType.UNKNOWN;
}