import { ICreateReadStreamOptions, IFileSystemProviderWithFileReadWrite, IFileSystemProviderWithOpenReadWriteClose, IReadFileOptions } from 'src/base/common/file/file';
import { URI } from 'src/base/common/file/uri';
import { IDataConverter, IWriteableStream } from 'src/base/common/file/stream';
import { DataBuffer } from 'src/base/common/file/buffer';

/** 
 * @description Helper functions for read file unbuffered operation. 
 */
export async function readFileIntoStreamAsync(
    provider: IFileSystemProviderWithFileReadWrite, 
    resource: URI, 
    stream: IWriteableStream<DataBuffer>, 
    opts?: IReadFileOptions): Promise<void> 
{
    try {
        let buffer = await provider.readFile(resource);

        // respect position option
        if (typeof opts?.position === 'number') {
            buffer = buffer.slice(opts.position);
        }

        // respect length option
        if (typeof opts?.length === 'number') {
            buffer = buffer.slice(0, opts.length);
        }

        stream.end(DataBuffer.wrap(buffer));
    } catch (err: any) {
        stream.error(err);
        stream.end();
    }
}

/** 
 * @description Helper functions for read file buffered operation.
 */
export async function readFileIntoStream<T>(
    provider: IFileSystemProviderWithOpenReadWriteClose, 
    resource: URI, 
    stream: IWriteableStream<T>, 
    dataConverter: IDataConverter<DataBuffer, T>, 
    options: ICreateReadStreamOptions): Promise<void> 
{
    let error: Error | undefined = undefined;
    try {
        await __readFileIntoStream(provider, resource, stream, dataConverter, options);
    } catch(err: any) {
        error = err;
    } finally {
        if (error) {
            stream.error(error);
        }
        stream.end();
    }
}

async function __readFileIntoStream<T>(
    provider: IFileSystemProviderWithOpenReadWriteClose, 
    resource: URI, 
    stream: IWriteableStream<T>, 
    dataConverter: IDataConverter<DataBuffer, T>, 
    options: ICreateReadStreamOptions): Promise<void> 
{    
    const fd = await provider.open(resource, { create: false, unlock: false } );

    try {
        
        // REVIEW: unused for now. Or can be used in options to limit the reading in file size.
        let totalBytesRead = 0;
        let bytesRead = 0;
        let allowedRemainingBytes = (options && typeof options.length === 'number') ? options.length : undefined;

        let buffer = DataBuffer.alloc(Math.min(options.bufferSize, typeof allowedRemainingBytes === 'number' ? allowedRemainingBytes : options.bufferSize));

        let posInFile = options && typeof options.position === 'number' ? options.position : 0;
        let posInBuffer = 0;

        do {
            // read from source (fd) at current position (posInFile) into buffer (buffer) at
			// buffer position (posInBuffer) up to the size of the buffer (buffer.byteLength).
			bytesRead = await provider.read(fd, posInFile, buffer.buffer, posInBuffer, buffer.bufferLength - posInBuffer);

            posInFile += bytesRead;   
            posInBuffer += bytesRead;
            totalBytesRead += bytesRead;

            if (typeof allowedRemainingBytes === 'number') {
				allowedRemainingBytes -= bytesRead;
			}

            // when buffer full, create a new one and emit it through stream
			if (posInBuffer === buffer.bufferLength) {
                await stream.write(dataConverter(buffer));
				buffer = DataBuffer.alloc(Math.min(options.bufferSize, typeof allowedRemainingBytes === 'number' ? allowedRemainingBytes : options.bufferSize));
				posInBuffer = 0;
			}

        } while(bytesRead > 0 
                && (typeof allowedRemainingBytes !== 'number' || allowedRemainingBytes > 0));

        // wrap up with last buffer and write to the stream
		if (posInBuffer > 0) {
			let lastChunkLength = posInBuffer;
			if (typeof allowedRemainingBytes === 'number') {
				lastChunkLength = Math.min(posInBuffer, allowedRemainingBytes);
			}
			stream.write(dataConverter(buffer.slice(0, lastChunkLength)));
		}

    } catch(err) {
        
        throw err;

    } finally {

        await provider.close(fd);

    }
}
