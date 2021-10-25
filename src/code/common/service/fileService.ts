import { DataBuffer } from "src/base/common/file/buffer";
import { FileSystemProviderAbleToRead, hasFileReadStreamCapability, hasOpenReadWriteCloseCapability, hasReadWriteCapability, IFileReadStreamOptions, IFileSystemProvider, IFileSystemProviderWithFileReadStream, IFileSystemProviderWithFileReadWrite, IFileSystemProviderWithOpenReadWriteClose } from "src/base/common/file/file";
import { IStream, newBufferStream, newStream, readFileIntoStream, streamToBuffer } from "src/base/common/file/stream";
import { URI } from "src/base/common/file/uri";
import { isAbsolutePath } from "src/base/common/string";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const IFileService = createDecorator<IFileService>('file-service');

export interface IFileService {
    // TODO:
}

export class FileService implements IFileService {

    private readonly _providers: Map<string, IFileSystemProvider> = new Map();

    private readonly bufferSize = 64 * 1024;

    constructor(
        /* IFileLogService private readonly fileLogService: IFileLogService */
    ) {

    }

    /***************************************************************************
     * public API
     **************************************************************************/
    
    public async readFileStream(resource: URI, opts: IFileReadStreamOptions = Object.create(null)): Promise<IStream<DataBuffer>> {
        const provider = await this._getReadProvider(resource);
        return this._doReadFileStream(provider, resource, opts);
    }

    public async readFile(resource: URI, opts: IFileReadStreamOptions = Object.create(null)): Promise<DataBuffer> {
        const provider = await this._getReadProvider(resource);
        return this._doReadFile(provider, resource, opts);
    }
    
    public async writeFile(resource: URI): Promise<void> {
        const provider = await this._getWriteProvider(resource);
        // TODO
    }

    public async createFile(resource: URI): Promise<void> {
    
    }

    public async isFileExist(resource: URI): Promise<boolean> {
        return false;
    }

    public async isFolderExist(resource: URI): Promise<boolean> {
        return false;
    }

    public registerProvider(scheme: string, provider: IFileSystemProvider): void {
        this._providers.set(scheme, provider);
    }

    public getProvider(scheme: string): IFileSystemProvider | undefined {
        return this._providers.get(scheme);
    }

    /***************************************************************************
     * private/helper API
     **************************************************************************/
    
    private async _getReadProvider(resource: URI): 
        Promise<IFileSystemProviderWithFileReadWrite | 
        IFileSystemProviderWithOpenReadWriteClose> 
    {
		const provider = await this._getProvider(resource);

		if (hasOpenReadWriteCloseCapability(provider) || hasReadWriteCapability(provider)) {
			return provider;
		}

		throw new Error(`Filesystem provider for scheme '${resource.scheme}' neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the read operation.`);
	}

    private async _getWriteProvider(resource: URI): 
        Promise<IFileSystemProviderWithFileReadWrite | 
        IFileSystemProviderWithOpenReadWriteClose> 
    {
		const provider = await this._getProvider(resource);

		if (hasOpenReadWriteCloseCapability(provider) || hasReadWriteCapability(provider)) {
			return provider;
		}

		throw new Error(`Filesystem provider for scheme '${resource.scheme}' neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the write operation.`);
	}

    private async _getProvider(resource: URI): Promise<IFileSystemProvider> {

		// Assert path is absolute
        if (!isAbsolutePath(resource.path)) {
			throw new Error(`Unable to resolve filesystem provider with relative file path '${resource.path}`);
		}

        // REVIEW: figure out what this process is actually doing here in vscode, if no such functionality is required,
        // this function then is NO need to by async.
        // this.activateProvider(resource.scheme);

		// Assert provider
		const provider = this._providers.get(resource.scheme);
		if (!provider) {
			throw new Error(`noProviderFound given ${resource.scheme.toString()}`);
		}

		return provider;
	}

    private async _doReadFile(
        provider: FileSystemProviderAbleToRead, 
        resource: URI,
        opts: IFileReadStreamOptions
    ): Promise<DataBuffer> {
        const stream = await this._doReadFileStream(provider, resource, opts);

        return streamToBuffer(stream);
    }

    private async _doReadFileStream(
        provider: FileSystemProviderAbleToRead, 
        resource: URI, 
        opts: IFileReadStreamOptions
    ): Promise<IStream<DataBuffer>> {
        
        const validateStat = this._validateURI(resource);

        let stream: IStream<DataBuffer> | undefined = undefined;

        try {

            if (!(hasOpenReadWriteCloseCapability(provider) || hasFileReadStreamCapability(provider)) || (hasReadWriteCapability(provider))) {
                
                // read unbuffered (only if either preferred, or the provider has no buffered read capability)
                // DEBUG: stream = this._readFileUnbuffered(provider, resource);
                stream = this._readFileBuffered(provider as any, resource, opts);

            } else if (hasFileReadStreamCapability(provider)) {
                
                // read streamed
                stream = this._readFileStreamed(provider, resource ,opts);

            } else {

                // read buffered
                stream = this._readFileBuffered(provider, resource, opts);

            }

            await validateStat;
            return stream;
            
        } catch(err) {

            throw err;

        }

    }

    private _readFileUnbuffered(
        provider: IFileSystemProviderWithFileReadWrite, 
        resource: URI,
        opts: IFileReadStreamOptions
    ): IStream<DataBuffer> {
        const readableStream = newBufferStream();
        // TODO:
        return readableStream;
    }

    private _readFileStreamed(
        provider: IFileSystemProviderWithFileReadStream, 
        resource: URI,
        opts: IFileReadStreamOptions
    ): IStream<DataBuffer> {
        const readableStream = provider.readFileStream(resource);
        
        // return transform(fileStream, {
		// 	data: data => data instanceof VSBuffer ? data : VSBuffer.wrap(data),
		// 	error: error => new FileOperationError(localize('err.read', "Unable to read file '{0}' ({1})", this.resourceForError(resource), ensureFileSystemProviderError(error).toString()), toFileOperationResult(error), options)
		// }, data => VSBuffer.concat(data));
        return readableStream;
    }

    private _readFileBuffered(
        provider: IFileSystemProviderWithOpenReadWriteClose, 
        resource: URI,
        opts: IFileReadStreamOptions
    ): IStream<DataBuffer> {
        const readableStream = newBufferStream();

        readFileIntoStream(provider, resource, readableStream, data => data, { ...opts, bufferSize: this.bufferSize });

        return readableStream;
    }

    private async _validateURI(resource: URI): Promise<void> {
        return;
    }

}