import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { FileSystemProviderAbleToRead, hasOpenReadWriteCloseCapability, hasReadWriteCapability, IReadFileOptions, IFileSystemProvider, IFileSystemProviderWithFileReadWrite, IFileSystemProviderWithOpenReadWriteClose, IWriteFileOptions, IFileStat, FileType, FileOperationErrorType, FileSystemProviderCapability, IDeleteFileOptions, IResolveStatOptions, IResolvedFileStat, hasReadFileStreamCapability, IFileSystemProviderWithReadFileStream, ICreateFileOptions, FileOperationError, hasCopyCapability, IWatchOptions } from "src/base/common/file/file";
import { basename, dirname, join } from "src/base/common/file/path";
import { bufferToStream, IReadableStream, listenStream, newWriteableBufferStream, streamToBuffer, transformStream } from "src/base/common/file/stream";
import { isAbsoluteURI, URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { Iterable } from "src/base/common/util/iterable";
import { Mutable } from "src/base/common/util/type";
import { readFileIntoStream, readFileIntoStreamAsync } from "src/base/common/file/io";
import { IRawResourceChangeEvents } from "src/code/platform/files/common/watcher";
import { IMicroService, createService } from "src/code/platform/instantiation/common/decorator";

export const IFileService = createService<IFileService>('file-service');

export interface IFileService extends IDisposable, IMicroService {
    
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
    stat(uri: URI, opts?: IResolveStatOptions): Promise<IResolvedFileStat>;

    /** 
     * @description Read the file unbuffered. 
     * @note Options is set to false if it is not given.
     */
    readFile(uri: URI, opts?: IReadFileOptions): Promise<DataBuffer>;

    /**
     * @description Reads the directory by a given URI.
     */
    readDir(uri: URI): Promise<[string, FileType][]>;
    
    /** 
     * @description Read the file buffered using stream. 
     * @note Options is set to false if it is not given.
     */
    readFileStream(uri: URI, opts?: IReadFileOptions): Promise<IReadableStream<DataBuffer>>;

    /** 
     * @description Write to the file. 
     * @note Options is set to false if it is not given.
     */
    writeFile(uri: URI, bufferOrStream: DataBuffer | IReadableStream<DataBuffer>, opts?: IWriteFileOptions): Promise<void>;
    
    /** 
     * @description Determines if the file/directory exists. 
     */
    exist(uri: URI): Promise<boolean>;
    
    /** 
     * @description Creates a file described by a given URI. 
     * @note Options is set to false if it is not given.
     */
    createFile(uri: URI, bufferOrStream?: DataBuffer | IReadableStream<DataBuffer>, opts?: ICreateFileOptions): Promise<void>;
    
    /** 
     * @description Creates a directory described by a given URI. 
     */
    createDir(uri: URI): Promise<void>;
    
    /** 
     * @description Moves a file/directory to a new location described by a given URI. 
     */
    moveTo(from: URI, to: URI, overwrite?: boolean): Promise<IResolvedFileStat>;
    
    /** 
     * @description Copys a file/directory to a new location. 
     */
    copyTo(from: URI, to: URI, overwrite?: boolean): Promise<IResolvedFileStat>;
    
    /** 
     * @description Deletes a file/directory described by a given URI. 
     */
    delete(uri: URI, opts?: IDeleteFileOptions): Promise<void>;
    
    /**
     * @description Watch the given target and events will be fired by listening 
     * to file service.
     */
    watch(uri: URI, opts?: IWatchOptions): IDisposable;
}

/**
 * @class // TODO
 */
export class FileService extends Disposable implements IFileService {

    _microserviceIdentifier: undefined;

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
            this.logService.trace('Main#FileService# stop watching on ' + URI.toString(uri));
            
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
    
    public async stat(uri: URI, opts?: IResolveStatOptions): Promise<IResolvedFileStat> {
        const provider = this.__getProvider(uri);
        const stat = await provider.stat(uri);
        return this.__resolveStat(uri, provider, stat, opts);
    }

    public async readFile(uri: URI, opts?: IReadFileOptions): Promise<DataBuffer> {
        const provider = await this.__getReadProvider(uri);
        return this.__readFile(provider, uri, opts);
    }

    public async readFileStream(uri: URI, opts?: IReadFileOptions): Promise<IReadableStream<DataBuffer>> {
        const provider = await this.__getReadProvider(uri);
        return this.__readFileStream(provider, uri, opts);
    }
    
    public async writeFile(uri: URI, bufferOrStream: DataBuffer | IReadableStream<DataBuffer>, opts?: IWriteFileOptions): Promise<void> 
    {
        const provider = await this.__getWriteProvider(uri);
        
        try {
            // validate write operation, returns the stat of the file.
            const stat = await this.__validateWrite(provider, uri, opts);
            
            // create recursive directory if necessary.
            if (!stat) {
                await this.__mkdirRecursive(provider, URI.fromFile(dirname(URI.toFsPath(uri))));
            }
            
            // REVIEW: optimization?

            /**
             * write file: unbuffered (only if data to write is a buffer, or the 
             * provider has no buffered write capability).
             */
			if ((hasReadWriteCapability(provider) && bufferOrStream instanceof DataBuffer) ||
                !hasOpenReadWriteCloseCapability(provider))
            {
                await this.__writeUnbuffered(provider, uri, opts, bufferOrStream);
			}

			// write file: buffered
			else {
				await this.__writeBuffered(provider, uri, opts, bufferOrStream instanceof DataBuffer ? bufferToStream(bufferOrStream) : bufferOrStream);
			}
        }

        catch (error) {
            throw new FileOperationError(`unable to write file to ${URI.toFsPath(uri)}`, FileOperationErrorType.UNKNOWN, error);
        }

    }

    public async exist(uri: URI): Promise<boolean> {
        const provider = this.__getProvider(uri);
        
        try {
            const stat = await provider.stat(uri);
        } catch (err) {
            return false;
        }

        return true;
    }

    public async createFile(
        uri: URI, 
        bufferOrStream: DataBuffer | IReadableStream<DataBuffer> = DataBuffer.alloc(0), 
        opts?: ICreateFileOptions): Promise<void> 
    {
        // validation
        await this.__validateCreate(uri, opts);

        // write operation
        await this.writeFile(uri, bufferOrStream, { create: true, overwrite: !!opts?.overwrite, unlock: false });
    }

    public async readDir(uri: URI): Promise<[string, FileType][]> {
        const provider = this.__throwIfProviderIsReadonly(this.__getProvider(uri));
        
        return provider.readdir(uri);
    }

    public async createDir(uri: URI): Promise<void> {
        // get access to a provider
        const provider = this.__throwIfProviderIsReadonly(this.__getProvider(uri));

        // create directory recursively
        await this.__mkdirRecursive(provider, uri);
    }

    public async moveTo(from: URI, to: URI, overwrite?: boolean): Promise<IResolvedFileStat> {
        const fromProvider = this.__throwIfProviderIsReadonly(await this.__getWriteProvider(from));
        const toProvider = this.__throwIfProviderIsReadonly(await this.__getWriteProvider(to));

        // move operation
        await this.__doMoveTo(from, fromProvider, to, toProvider, overwrite);

        const stat = await this.stat(to);
        return stat;
    }

    public async copyTo(from: URI, to: URI, overwrite?: boolean): Promise<IResolvedFileStat> {
        const fromProvider = this.__throwIfProviderIsReadonly(await this.__getWriteProvider(from));
        const toProvider = this.__throwIfProviderIsReadonly(await this.__getWriteProvider(to));

        // copy operation
        await this.__doCopyTo(from, fromProvider, to, toProvider, overwrite);

        const stat = await this.stat(to);
        return stat;
    }

    public async delete(uri: URI, opts?: IDeleteFileOptions): Promise<void> {
        // validation
        const provider = await this.__validateDelete(uri, opts);
        
        // delete operation
        await provider.delete(uri, { useTrash: !!opts?.useTrash, recursive: !!opts?.recursive });
    }

    public watch(uri: URI, opts?: IWatchOptions): IDisposable {
        if (this._activeWatchers.has(uri)) {
            this.logService.warn('file service - duplicate watching on the same resource', URI.toString(uri));
            return Disposable.NONE;
        }
        
        this.logService.trace('Main#FileService#watch()#Watching on ' + URI.toString(uri) + '...');
        
        const provider = this.__getProvider(uri);
        const disposable = provider.watch(uri, opts);
        this._activeWatchers.set(uri, disposable);
        
        return disposable;
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
        opts?: IReadFileOptions): Promise<DataBuffer> 
    {
        const stream = await this.__readFileStream(provider, uri, { ...opts, preferUnbuffered: true });
        return streamToBuffer(stream);
    }

    private async __readFileStream(
        provider: FileSystemProviderAbleToRead, 
        uri: URI, 
        opts?: IReadFileOptions & { preferUnbuffered?: boolean; }
    ): Promise<IReadableStream<DataBuffer>>  
    {
        await this.__validateRead(provider, uri, opts);
        
        let stream: IReadableStream<DataBuffer> | undefined = undefined;
        try {

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

            return stream;   
        } 
        
        catch(err) {
            throw new FileOperationError(`unable to read the file ${URI.toFsPath(uri)}`, FileOperationErrorType.UNKNOWN, err);
        }
    }

    /** @description Read the file directly into the memory in one time. */
    private __readFileUnbuffered(
        provider: IFileSystemProviderWithFileReadWrite, 
        uri: URI,
        opts?: IReadFileOptions
    ): IReadableStream<DataBuffer> 
    {
        const stream = newWriteableBufferStream();
        readFileIntoStreamAsync(provider, uri, stream, opts);
        return stream;
    }

    private __readFileStreamed(
        provider: IFileSystemProviderWithReadFileStream,
        uri: URI,
        opts?: IReadFileOptions
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
        opts?: IReadFileOptions): IReadableStream<DataBuffer> 
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
        bufferOrStream: DataBuffer | IReadableStream<DataBuffer>): Promise<void> 
    {
        let buffer: DataBuffer;
        if (bufferOrStream instanceof DataBuffer) {
            buffer = bufferOrStream;
        } else {
            buffer = await streamToBuffer(bufferOrStream);
        }

        // write through a provider
        await provider.writeFile(uri, buffer.buffer, { create: opts?.create ?? false, overwrite: opts?.overwrite ?? false, unlock: opts?.unlock ?? false });
    }

    private async __writeBuffered(
        provider: IFileSystemProviderWithOpenReadWriteClose, 
        uri: URI, 
        opts: IWriteFileOptions | undefined, 
        stream: IReadableStream<DataBuffer>): Promise<void>
    {
        // open the file
        const fd = await provider.open(uri, { create: true, unlock: opts?.unlock ?? false });

        try {
            let posInFile = 0;

            return new Promise((resolve, reject) => {
                listenStream(stream, {
                    onData: async (chunk: DataBuffer) => {
    
                        // pause stream to perform async write operation
                        stream.pause();
    
                        try {
                            await this.__writeBuffer(provider, fd, chunk, chunk.bufferLength, posInFile, 0);
                        } catch (error) {
                            return reject(error);
                        }
    
                        posInFile += chunk.bufferLength;
    
                        // resume stream now that we have successfully written
                        // run this on the next tick to prevent increasing the
                        // execution stack because resume() may call the event
                        // handler again before finishing.
                        setTimeout(() => stream.resume());
                    },
                    onError: error => reject(error),
                    onEnd: () => resolve()
                });
            });
        } 
   
        catch (error) {
            throw new FileOperationError(`unable to write the file buffered ${URI.toFsPath(uri)}`, FileOperationErrorType.UNKNOWN, error);
        } 
        
        finally {
            // alaways close the file
            await provider.close(fd);    
        }
    }

    private async __writeBuffer(
        provider: IFileSystemProviderWithOpenReadWriteClose, 
        fs: number, 
        buffer: DataBuffer, 
        length: number, 
        posInFile: number, 
        posInBuffer: number): Promise<void> 
    {
		let written = 0;
		while (written < length) {
			written += await provider.write(fs, posInFile + written, buffer.buffer, posInBuffer + written, length - written);
		}
	}

    /**
     * @description Create directory recursively if not existed.
     */
    private async __mkdirRecursive(provider: IFileSystemProvider, dir: URI): Promise<void> {
        
        const dirWaitToBeCreate: string[] = [];
        let path = dir;
        
        while (true) {
            try {
                // try to find a directory that exists
                let stat = await provider.stat(path);

                // not a directory
                if ((stat.type & FileType.DIRECTORY) === 0) {
                    throw new FileOperationError('undable to create directory that already exists but is not a directory', FileOperationErrorType.FILE_IS_DIRECTORY);
                }

                // we reaches a existed directory, we break the loop.
                break;

            } catch (err) {
                // we reaches a not existed directory, we remember it.
                dirWaitToBeCreate.push(URI.basename(path));
                path = URI.dirname(path);
            }
        }

        for (let i = dirWaitToBeCreate.length - 1; i >= 0; i--) {
            path = URI.join(path, dirWaitToBeCreate[i]!);

            try {
                await provider.mkdir(path);
            } catch (err) {
                throw new FileOperationError(`cannot make directory '${URI.toString(path, true)}'`, FileOperationErrorType.UNKNOWN, err);
            }
        }
    }

    /**
     * @description Resolves the {@link IFileStat} and returns as {@link IResolvedFileStat}.
     */
    private async __resolveStat(
        uri: URI, 
        provider: IFileSystemProvider, 
        stat: IFileStat, 
        opts?: IResolveStatOptions
    ): Promise<IResolvedFileStat> {
        
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
            
            const children = await provider.readdir(uri);
            const resolvedChildren = await Promise.all(
                children.map(async ([name, _type]) => {
                    try {
                        const childUri = URI.fromFile(join(URI.toFsPath(uri), name));
                        const childStat = await provider.stat(childUri);
                        return await this.__resolveStat(childUri, provider, childStat, { resolveChildren: opts.resolveChildrenRecursive });
                    } catch (err) {
                        return undefined;
                    }
                })
            );

            (<Mutable<Iterable<IResolvedFileStat>>>resolved.children) = Iterable.filter(resolvedChildren, (child) => !!child);
        }

        return resolved;
    }

    private async __doMoveTo(from: URI, fromProvider: IFileSystemProvider, to: URI, toProvider: IFileSystemProvider, overwrite?: boolean): Promise<void> {
        if (URI.toString(from) === URI.toString(to)) {
            return;
        }

        const exist = await this.__validateMoveOrCopy(to, overwrite);
        if (exist && overwrite) {
            await this.delete(to, { recursive: true });
        }

        const toUriDir = URI.fromFile(dirname(URI.toFsPath(to)));
        await this.__mkdirRecursive(toProvider, toUriDir);

        await this.__doCopyTo(from, fromProvider, to, toProvider, overwrite);
        await this.delete(from, { recursive: true });
    }

    private async __doCopyTo(from: URI, fromProvider: IFileSystemProvider, to: URI, toProvider: IFileSystemProvider, overwrite?: boolean): Promise<void> {
        if (URI.toString(from) === URI.toString(to)) {
            return;
        }

        const exist = await this.__validateMoveOrCopy(to, overwrite);
        if (exist && overwrite) {
            await this.delete(to, { recursive: true });
        }

        const toUriDir = URI.fromFile(dirname(URI.toFsPath(to)));
        await this.__mkdirRecursive(toProvider, toUriDir);

        if (hasCopyCapability(fromProvider)) {
            await fromProvider.copy(from, to, { overwrite: !!overwrite });
        } else {
            throw new FileOperationError(`Unable to move / copy to the target path ${URI.toString(to)} because the provider does not provide move / copy functionality.`, FileOperationErrorType.UNKNOWN);
        }
    }

    private async __validateMoveOrCopy(to: URI, overwrite?: boolean): Promise<boolean> {
        const exist = await this.exist(to);
        if (exist && overwrite === false) {
            throw new FileOperationError(`Unable to move / copy to the target path ${URI.toString(to)} because already exists.`, FileOperationErrorType.FILE_EXISTS);
        }
        return exist;
    }

    /***************************************************************************
     * Provider related helper methods.
     **************************************************************************/

    private async __getReadProvider(uri: URI): 
        Promise<IFileSystemProviderWithFileReadWrite | 
        IFileSystemProviderWithOpenReadWriteClose> 
    {
		const provider = this.__getProvider(uri);

		if (hasOpenReadWriteCloseCapability(provider) || hasReadWriteCapability(provider)) {
			return provider;
		}

		throw new Error(`Filesystem provider for scheme '${uri.scheme}' neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the read operation.`);
	}

    private async __getWriteProvider(uri: URI): 
        Promise<IFileSystemProviderWithFileReadWrite | 
                IFileSystemProviderWithOpenReadWriteClose> 
    {
		const provider = this.__throwIfProviderIsReadonly(this.__getProvider(uri));

		if (hasOpenReadWriteCloseCapability(provider) || hasReadWriteCapability(provider)) {
			return provider;
		}

		throw new Error(`filesystem provider for scheme '${uri.scheme}' neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the write operation.`);
	}

    private __getProvider(uri: URI): IFileSystemProvider {
        
		// Assert path is absolute
        if (isAbsoluteURI(uri) === false) {
			throw new Error(`unable to resolve filesystem provider with relative file path '${uri.path}`);
		}

		// Assert provider
		const provider = this._providers.get(uri.scheme);
		if (!provider) {
			throw new FileOperationError(`no provider found given ${uri.scheme}`, FileOperationErrorType.FILE_INVALID_PATH);
		}

		return provider;
	}

    /***************************************************************************
     * Validation
     **************************************************************************/

     private async __validateRead(
        provider: IFileSystemProvider, 
        uri: URI, 
        opts?: IReadFileOptions): Promise<void> 
    {
        const stat = await provider.stat(uri);
        if (!stat) {
            throw new FileOperationError('target URI does not exist', FileOperationErrorType.FILE_INVALID_PATH);
        } else if (stat.type & FileType.DIRECTORY) {
            throw new FileOperationError('unable to read file which is actually a directory', FileOperationErrorType.FILE_IS_DIRECTORY);
        }

        this.__validateReadLimit(stat.byteSize, opts);
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
        opts?: IWriteFileOptions): Promise<IFileStat | undefined> 
    {
        // REVIEW: Validate unlock support (use `opts`)

        // get the stat of the file
        let stat: IFileStat | undefined = undefined;
		try {
			stat = await provider.stat(uri);
		} catch (error) {
			return undefined; // file might not exist
		}

        // cannot be a directory
        if (stat.type & FileType.DIRECTORY) {
            throw new FileOperationError('unable to write file which is actually a directory', FileOperationErrorType.FILE_IS_DIRECTORY);
        }

        // cannot be readonly file
        if (stat.readonly ?? false) {
            throw new FileOperationError('unable to write file which is readonly', FileOperationErrorType.FILE_READONLY);
        }

        return stat;
    }
    
    private __validateReadLimit(size: number, opts?: IReadFileOptions): void {
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
                    throw new FileOperationError('read file exceeds memory limit', tooLargeErrorResult);
                } else {
                    throw new FileOperationError('read file is too large', tooLargeErrorResult);
                }
			}
        }
    }

    private async __validateCreate(uri: URI, opts?: ICreateFileOptions): Promise<void> 
    {
        // if file exists and is not allowed to overwrite, we throw
        if (await this.exist(uri) && opts?.overwrite === false) {
            throw new FileOperationError('file already exists', FileOperationErrorType.FILE_EXISTS);
        }
    }

    private async __validateDelete(uri: URI, opts?: IDeleteFileOptions): Promise<IFileSystemProvider> {
        const provider = this.__throwIfProviderIsReadonly(await this.__getWriteProvider(uri));
        
        // delete validation
        let stat: IFileStat | undefined = undefined;
        try {
            stat = await provider.stat(uri);
        } catch (err) {
            throw new FileOperationError('file or directory does not exist', FileOperationErrorType.FILE_NOT_FOUND);
        }

        // validate if it is readonly
        this.__throwIfFileIsReadonly(stat);
        
        return provider;
    }

    private __throwIfProviderIsReadonly(provider: IFileSystemProvider): IFileSystemProvider {
        if (provider.capabilities & FileSystemProviderCapability.Readonly) {
            throw new FileOperationError('file system provider is readonly', FileOperationErrorType.FILE_READONLY);
        }
        return provider;
    }

    private __throwIfFileIsReadonly(stat: IFileStat): void {
        if (typeof stat.readonly === 'boolean' && stat.readonly === true) {
            throw new FileOperationError('unable to modify a readonly file', FileOperationErrorType.FILE_READONLY);
        }
    }

}