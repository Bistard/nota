import { DataBuffer } from "src/base/common/file/buffer";
import { File, IFileOpenOptions, FileSystemProviderCapability, FileType, IFileSystemProviderWithFileReadStream, IFileSystemProviderWithFileReadWrite, IFileSystemProviderWithOpenReadWriteClose, IStat, IFileReadStreamOptions } from "src/base/common/file/file";
import { IStream, newStream, readFileIntoStream } from "src/base/common/file/stream";
import { URI } from "src/base/common/file/uri";
import * as fs from "fs";
import { FileMode } from "src/base/node/io";

export class DiskFileSystemProvider implements 
    IFileSystemProviderWithFileReadWrite,
    IFileSystemProviderWithOpenReadWriteClose,
    IFileSystemProviderWithFileReadStream {

    /**
     * @readonly DiskFileSystemProvider has fully permission to deal with disk
     * fileSystems.
     */
    public readonly capabilities: FileSystemProviderCapability = 
        FileSystemProviderCapability.FileReadWrite |
        FileSystemProviderCapability.FileOpenReadWriteClose |
        FileSystemProviderCapability.FileReadStream |
        FileSystemProviderCapability.FileFolderCopy;

    private readonly bufferSize = 64 * 1024;

    // empty
    constructor() {}

    public async readFile(resource: URI): Promise<Uint8Array> {
        return new Uint8Array();
    }

	public async writeFile(resource: URI, content: Uint8Array): Promise<void> {
        return;
    }

    /**
     * @description open a file.
     * 
     * @returns fd (file descriptor)
     */
    public async open(resource: URI, opts: IFileOpenOptions): Promise<number> {
        
        try {
            const filePath = URI.toFsPath(resource);

            // determine wether to unlock the file (write mode only)
            if (opts.create === true && opts.unlock === true) {
                
                try {
                    let stat = fs.statSync(filePath);
                
                    /* File mode indicating writable by owner */
                    if (!(stat.mode & 0o200)) {
                        fs.chmodSync(filePath, stat.mode | FileMode.writable);
                    }
                } catch(err) {
                    throw err;
                }

            }

            // Determine file flags for opening (read vs write)
            let flag: string | undefined = undefined;
            if (opts.create === true) {
                flag = 'w';
            } else {
                flag = 'r';
            }

            const fd = fs.openSync(filePath, flag);

            return fd;

        } catch(err) {
            throw err;
        }
    }
	
    /**
     * @description close the file.
     * 
     * @param fd file descriptor
     */
    public async close(fd: number): Promise<void> {
        try {
            // fs.fdatasyncSync(fd);
            fs.closeSync(fd);
        } catch(err) {
            throw err;
        }
    }
	
    /**
     * @description read bytes from the file.
     * 
     * @param fd file descriptor
     * @param pos position in file
     * @param buffer buffer to store the bytes
     * @param offset position in buffer
     * @param length length of bytes to read
     * @returns number of bytes were read
     */
    public async read(fd: number, pos: number, buffer: Uint8Array, offset: number, length: number): Promise<number> {
    
        let bytesRead: number | null = null;

        try {
            const read = fs.readSync(fd, buffer, offset, length, pos);            
            
            bytesRead = read;
            return bytesRead;

        } catch(err) {
            throw err;
        }
    }

	public async write(fd: number, pos: number, buffer: Uint8Array, offset: number, length: number): Promise<number> {
        return -1;
    }

    public async copy(from: string, to: string): Promise<void> {
        return;
    }

    public readFileStream(resource: URI, opts: IFileReadStreamOptions): IStream<Uint8Array>  {
        const stream = newStream<Uint8Array>(data => DataBuffer.concat(data.map((data: Uint8Array) => DataBuffer.wrap(data))).buffer);

        readFileIntoStream(this, resource, stream, data => data.buffer, { ...opts, bufferSize: this.bufferSize });
        return stream;
    }

    public async stat(resource: URI): Promise<IStat> {
        return new File('undefined');
    }

	public async mkdir(resource: URI): Promise<void> {
        return;
    }

	public async readdir(resource: URI): Promise<[string, FileType][]> {
        return[];
    }
	
    public async delete(resource: URI): Promise<void> {
        return;
    }

	public async rename(from: string, to: string): Promise<void> {
        return;
    }

}