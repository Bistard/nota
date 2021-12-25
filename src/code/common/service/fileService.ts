import { DataBuffer } from "src/base/common/file/buffer";
import { FileSystemProviderAbleToRead, hasOpenReadWriteCloseCapability, hasReadWriteCapability, IReadFileOptions, IFileSystemProvider, IFileSystemProviderWithFileReadWrite, IFileSystemProviderWithOpenReadWriteClose, IWriteFileOptions } from "src/base/common/file/file";
import { bufferToStream, IReadableStream, IWriteableStream, listenStream, newWriteableBufferStream, newWriteableStream, streamToBuffer } from "src/base/common/file/stream";
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
     * public API - Provider Operations
     **************************************************************************/

    public registerProvider(scheme: string, provider: IFileSystemProvider): void {
        this._providers.set(scheme, provider);
    }

    public getProvider(scheme: string): IFileSystemProvider | undefined {
        return this._providers.get(scheme);
    }

    /***************************************************************************
     * public API - File Operations
     **************************************************************************/
    
    public async readFile(
        uri: URI, 
        opts: IReadFileOptions = Object.create(null)): Promise<DataBuffer> 
    {
        const provider = await this.__getReadProvider(uri);
        return this.__readFile(provider, uri, opts);
    }
    
    public async writeFile(
        uri: URI, 
        bufferOrStream: DataBuffer | IReadableStream<DataBuffer>,
        opts: IWriteFileOptions): Promise<void> 
    {
        const provider = await this.__getWriteProvider(uri);
        
        try {
            // TODO
            // validateWriteOperation()

            // mkdir()

            // optimization

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

        }

    }

    public async createFile(uri: URI): Promise<void> {
        
    }

    public async isFileExist(uri: URI): Promise<boolean> {
        
        return false;
    }

    public async isFolderExist(uri: URI): Promise<boolean> {
        
        return false;
    }

    /***************************************************************************
     * Reading files related helper methods.
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
        await provider.writeFile(uri, buffer.buffer, { create: true, overwrite: true, unlock: opts?.unlock ?? false });
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
            throw error;
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
		let totalWritten = 0;
		while (totalWritten < length) {
			totalWritten += await provider.write(fs, posInFile + totalWritten, buffer.buffer, posInBuffer + totalWritten, length - totalWritten);
		}
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