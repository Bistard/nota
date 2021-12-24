import { DataBuffer } from "src/base/common/file/buffer";
import { FileSystemProviderAbleToRead, hasOpenReadWriteCloseCapability, hasReadWriteCapability, IReadFileOptions, IFileSystemProvider, IFileSystemProviderWithFileReadWrite, IFileSystemProviderWithOpenReadWriteClose } from "src/base/common/file/file";
import { IWriteableStream, newWriteableBufferStream, newWriteableStream, streamToBuffer } from "src/base/common/file/stream";
import { URI } from "src/base/common/file/uri";
import { isAbsolutePath } from "src/base/common/string";
import { readFileIntoStream, readFileIntoStreamAsync } from "src/base/node/io";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const IFileService = createDecorator<IFileService>('file-service');

export interface IFileService {
    // TODO:
}

export class FileService implements IFileService {

    private readonly _providers: Map<string, IFileSystemProvider> = new Map();

    /** @readonly read into chunks of 256kb each to reduce IPC overhead */
    private readonly bufferSize = 256 * 1024;

    constructor(
        /* IFileLogService private readonly fileLogService: IFileLogService */
    ) { }

    /***************************************************************************
     * public API
     **************************************************************************/
    
    public async readFile(
        uri: URI, 
        opts: IReadFileOptions = Object.create(null)): Promise<DataBuffer> 
    {
        const provider = await this.__getReadProvider(uri);
        return this.__readFile(provider, uri, opts);
    }
    
    public async writeFile(uri: URI): Promise<void> 
    {
        const provider = await this.__getWriteProvider(uri);
        // TODO
    }

    public async createFile(uri: URI): Promise<void> {
        // TODO
    }

    public async isFileExist(uri: URI): Promise<boolean> {
        // TODO
        return false;
    }

    public async isFolderExist(uri: URI): Promise<boolean> {
        // TODO
        return false;
    }

    public registerProvider(scheme: string, provider: IFileSystemProvider): void {
        this._providers.set(scheme, provider);
    }

    public getProvider(scheme: string): IFileSystemProvider | undefined {
        return this._providers.get(scheme);
    }

    /***************************************************************************
     * Reading/Writing files related helper methods.
     **************************************************************************/

    private async __readFile(
        provider: FileSystemProviderAbleToRead, 
        uri: URI,
        opts: IReadFileOptions): Promise<DataBuffer> 
    {
        const stream = await this.__readFileStream(provider, uri, opts);

        return streamToBuffer(stream);
    }

    private async __readFileStream(
        provider: FileSystemProviderAbleToRead, 
        uri: URI, 
        opts: IReadFileOptions): Promise<IWriteableStream<DataBuffer>> 
    {
        
        const validateStat = this.__validateURI(uri);

        let writeableStream: IWriteableStream<DataBuffer> | undefined = undefined;

        try {

            if (!hasOpenReadWriteCloseCapability(provider) || 
                hasReadWriteCapability(provider))
            {    
                // read unbuffered (only if either preferred, or the provider has 
                // no buffered read capability)
                writeableStream = this.__readFileUnbuffered(provider, uri, opts);
            } 

            else {
                // read buffered
                writeableStream = this.__readFileBuffered(provider, uri, opts);
            }

            await validateStat;
            return writeableStream;
            
        } catch(err) {

            throw err;

        }

    }

    /** @description Read the file directly into the memory in one time. */
    private __readFileUnbuffered(
        provider: IFileSystemProviderWithFileReadWrite, 
        uri: URI,
        opts: IReadFileOptions): IWriteableStream<DataBuffer> 
    {
        const writeableStream = newWriteableBufferStream();
        
        readFileIntoStreamAsync(
            provider, 
            uri, 
            writeableStream, 
            opts
        );

        return writeableStream;
    }

    /** @description Read the file using buffer I/O. */
    private __readFileBuffered(
        provider: IFileSystemProviderWithOpenReadWriteClose, 
        uri: URI,
        opts: IReadFileOptions): IWriteableStream<DataBuffer> 
    {
        const writeableStream = newWriteableBufferStream();

        readFileIntoStream(
            provider, 
            uri, 
            writeableStream, 
            data => data, 
            { ...opts, bufferSize: this.bufferSize }
        );

        return writeableStream;
    }

    private async __validateURI(uri: URI): Promise<void> {
        return;
    }

    /***************************************************************************
     * Provider related helper methods.
     **************************************************************************/

    private async __getReadProvider(uri: URI): 
        Promise<IFileSystemProviderWithFileReadWrite | 
        IFileSystemProviderWithOpenReadWriteClose> 
    {
		const provider = await this.__getProvider(uri);

		if (hasOpenReadWriteCloseCapability(provider) || hasReadWriteCapability(provider)) {
			return provider;
		}

		throw new Error(`Filesystem provider for scheme '${uri.scheme}' neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the read operation.`);
	}

    private async __getWriteProvider(uri: URI): 
        Promise<IFileSystemProviderWithFileReadWrite | 
                IFileSystemProviderWithOpenReadWriteClose> 
    {
		const provider = await this.__getProvider(uri);

		if (hasOpenReadWriteCloseCapability(provider) || hasReadWriteCapability(provider)) {
			return provider;
		}

		throw new Error(`Filesystem provider for scheme '${uri.scheme}' neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the write operation.`);
	}

    private async __getProvider(uri: URI): Promise<IFileSystemProvider> {

		// Assert path is absolute
        if (!isAbsolutePath(uri.path)) {
			throw new Error(`Unable to resolve filesystem provider with relative file path '${uri.path}`);
		}

        // REVIEW: figure out what this process is actually doing here in vscode, if no such functionality is required,
        // this function then is NO need to by async.
        // this.activateProvider(uri.scheme);

		// Assert provider
		const provider = this._providers.get(uri.scheme);
		if (!provider) {
			throw new Error(`noProviderFound given ${uri.scheme.toString()}`);
		}

		return provider;
	}

}