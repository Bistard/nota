import { File, IFileOpenOptions, FileSystemProviderCapability, FileType, IFileSystemProviderWithFileReadWrite, IFileSystemProviderWithOpenReadWriteClose, IStat, IWriteFileOptions } from "src/base/common/file/file";
import { URI } from "src/base/common/file/uri";
import * as fs from "fs";
import { fileExists, FileMode } from "src/base/node/io";
import { retry } from "src/base/common/async";

export class DiskFileSystemProvider implements 
    IFileSystemProviderWithFileReadWrite,
    IFileSystemProviderWithOpenReadWriteClose {

    /**
     * @readonly DiskFileSystemProvider has fully permission to deal with disk
     * fileSystems.
     */
    public readonly capabilities: FileSystemProviderCapability = 
        FileSystemProviderCapability.FileReadWrite |
        FileSystemProviderCapability.FileOpenReadWriteClose |
        FileSystemProviderCapability.FileReadStream |
        FileSystemProviderCapability.FileFolderCopy;

    // empty
    constructor() {}

    public async readFile(uri: URI): Promise<Uint8Array> {
        try {
            const path = URI.toFsPath(uri);
            return fs.readFileSync(path);
        } 
        
        catch (err) {
            throw err;
        }
    }

	public async writeFile(
        uri: URI, 
        content: Uint8Array, 
        opts: IWriteFileOptions): Promise<void> 
    {
        let fd: number | undefined = undefined;
        
        try {
            const path = URI.toFsPath(uri);

            // validation
            if (opts.create == false || opts.overwrite == false) {
                const exist = fileExists(path);
                
                if (exist && opts.overwrite == false) {
                    throw 'File already exists';
                } 
                
                else if (!exist && opts.create == false) {
                    throw 'File does not exist';
                }
            }
            
            // open the file
            fd = await this.open(uri, { create: true, unlock: opts.unlock });
            
            // write the content at once (write from beginning)
            await this.write(fd, 0, content, 0, content.byteLength);
        } 
        
        catch (error) {
            throw "provider write file error";
        }
        
        finally {
            if (typeof fd === 'number') {
                await this.close(fd);
            }
        }

    }

    /**
     * @description open a file.
     * 
     * @returns fd (file descriptor)
     */
    public async open(uri: URI, opts: IFileOpenOptions): Promise<number> {
        
        try {
            const path = URI.toFsPath(uri);

            // determine wether to unlock the file (write mode only)
            if (opts.create === true && opts.unlock === true) {
                try {
                    const stat = fs.statSync(path);
                    /* File mode indicating writable by owner */
                    if (!(stat.mode & 0o200)) {
                        fs.chmodSync(path, stat.mode | FileMode.writable);
                    }
                } catch(err) {
                    // ignore any errors here and try to just write
                    // TODO: this.logService.trace(error);
                }

            }

            // Determine file flags for opening (read vs write)
            let flag: string | undefined = undefined;
            if (opts.create === true) {
                flag = 'w';
            } else {
                flag = 'r';
            }

            const fd = fs.openSync(path, flag);
            return fd;
        } 
        
        catch(err) {
            throw err;
        }
    }
	
    /**
     * @description close the file.
     * @param fd file descriptor
     */
    public async close(fd: number): Promise<void> {
        try {
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

	public async write(
        fd: number, 
        pos: number, 
        buffer: Uint8Array, 
        offset: number, 
        length: number): Promise<number> 
    {
        /**
         * @readonly Retry for maximum 3 times for writing to a file to ensure 
         * the write operation succeeds.
         */
        return retry(() => this.__write(fd, pos, buffer, offset, length), 100, 3);
    }

    public async copy(from: string, to: string): Promise<void> {
        return;
    }

    public async stat(uri: URI): Promise<IStat> {
        return new File('undefined');
    }

	public async mkdir(uri: URI): Promise<void> {
        return;
    }

	public async readdir(uri: URI): Promise<[string, FileType][]> {
        return[];
    }
	
    public async delete(uri: URI): Promise<void> {
        return;
    }

	public async rename(from: string, to: string): Promise<void> {
        return;
    }

    /***************************************************************************
     * Helper Functions
     **************************************************************************/

    private async __write(
        fd: number, 
        pos: number, 
        data: Uint8Array, 
        offset: number, 
        length: number): Promise<number> 
    {
		try {
			const written = fs.writeSync(fd, data, offset, length, pos);
			return written;
		} 
        
        catch (error) {
			throw error;
		} 
        
    }
}