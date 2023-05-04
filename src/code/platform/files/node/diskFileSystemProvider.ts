import * as fs from "fs";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { DataBuffer } from "src/base/common/file/buffer";
import { FileOperationErrorType, FileSystemProviderCapability, FileSystemProviderError, FileType, IDeleteFileOptions, IFileStat, IFileSystemProviderWithFileReadWrite, IFileSystemProviderWithOpenReadWriteClose, IFileSystemProviderWithReadFileStream, IOpenFileOptions, IOverwriteFileOptions, IReadFileOptions, IWatchOptions, IWriteFileOptions } from "src/base/common/file/file";
import { join } from "src/base/common/file/path";
import { IReadableStreamEvent, newWriteableStream } from "src/base/common/file/stream";
import { URI } from "src/base/common/file/uri";
import { retry } from "src/base/common/util/async";
import { FileService } from "src/code/platform/files/common/fileService";
import { fileExists, FileMode, readFileIntoStream } from "src/base/node/io";
import { Watcher } from "src/code/platform/files/node/watcher";
import { ILogService } from "src/base/common/logger";
import { Emitter } from "src/base/common/event";
import { IRawResourceChangeEvents, IWatcher } from "src/code/platform/files/common/watcher";

export class DiskFileSystemProvider extends Disposable implements 
    IFileSystemProviderWithFileReadWrite, 
    IFileSystemProviderWithOpenReadWriteClose, 
    IFileSystemProviderWithReadFileStream
{
    // [event]

    private readonly _onDidResourceChange = this.__register(new Emitter<IRawResourceChangeEvents>());
    public readonly onDidResourceChange = this._onDidResourceChange.registerListener;

    private readonly _onDidResourceClose = this.__register(new Emitter<URI>());
    public readonly onDidResourceClose = this._onDidResourceClose.registerListener;

    // [field]
    
    /**
     * @readonly DiskFileSystemProvider has fully permission to deal with disk
     * fileSystems.
     */
    public readonly capabilities: FileSystemProviderCapability = 
        FileSystemProviderCapability.FileReadWrite |
        FileSystemProviderCapability.FileOpenReadWriteClose |
        FileSystemProviderCapability.ReadFileStream |
        FileSystemProviderCapability.FileFolderCopy |
        FileSystemProviderCapability.PathCaseSensitive;

    private _watcher?: IWatcher;

    // [constructor]

    constructor(
        private readonly logService?: ILogService,
    ) {
        super();
    }

    /***************************************************************************
     * Unbuffered File Operations readFile/writeFile
     **************************************************************************/

    public async readFile(uri: URI): Promise<Uint8Array> {
        try {
            const path = URI.toFsPath(uri);
            return await fs.promises.readFile(path);
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
            
            // validation {overwrite, create}
            if (opts.create === false || opts.overwrite === false) {
                const exist = fileExists(path);
                
                if (exist && opts.overwrite === false) {
                    throw new FileSystemProviderError('File already exists', FileOperationErrorType.FILE_EXISTS);
                } 
                
                else if (!exist && opts.create === false) {
                    throw new FileSystemProviderError('File does not exist', FileOperationErrorType.FILE_NOT_FOUND);
                }
            }
            
            // open the file
            fd = await this.open(uri, { create: true, unlock: opts.unlock });
            
            // write the content at once (write from beginning)
            await this.write(fd, 0, content, 0, content.byteLength);
        } 
        
        catch (error) {
            throw error;
        }
        
        finally {
            if (typeof fd === 'number') {
                await this.close(fd);
            }
        }

    }

    public readFileStream(uri: URI, opt?: IReadFileOptions): IReadableStreamEvent<Uint8Array> {
        const stream = newWriteableStream<Uint8Array>(data => DataBuffer.concat(data.map(data => DataBuffer.wrap(data))).buffer);
        readFileIntoStream(this, uri, stream, data => data.buffer, {
            ...opt,
            bufferSize: FileService.bufferSize
        });
        return stream;
    }

    /***************************************************************************
     * Low Level File Operations open/read/write/close 
     **************************************************************************/

    public async open(uri: URI, opts: IOpenFileOptions): Promise<number> {
        
        try {
            const path = URI.toFsPath(uri);

            // determine wether to unlock the file (write mode only)
            if (opts.create === true && opts.unlock === true) {
                try {
                    const stat = await fs.promises.stat(path);
                    /* File mode indicating writable by owner */
                    if (!(stat.mode & 0o200)) {
                        await fs.promises.chmod(path, stat.mode | FileMode.writable);
                    }
                } catch (_err) {
                    // ignore any errors here and try to just write
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
        
        catch (err) {
            throw err;
        }
    }
	
    public async close(fd: number): Promise<void> {
        try {
            fs.closeSync(fd);
        } catch (err) {
            throw err;
        }
    }
	
    public async read(fd: number, pos: number, buffer: Uint8Array, offset: number, length: number): Promise<number> 
    {
        let bytesRead: number | null = null;
        try {
            const read = fs.readSync(fd, buffer, offset, length, pos);            
            
            bytesRead = read;
            return bytesRead;

        } catch (err) {
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

    /***************************************************************************
     * Folder Operations move/copy/delete/create
     **************************************************************************/

    public async copy(from: URI, to: URI, opts: IOverwriteFileOptions): Promise<void> {
        if (from === to) {
            return;
        }

        try {
            const fromPath = URI.toFsPath(from);
            const toPath = URI.toFsPath(to);
            const stat = await this.stat(from);
            
            if (fileExists(toPath) && opts.overwrite === false) {
                throw new FileSystemProviderError(`Target already exists at ${toPath}`, FileOperationErrorType.UNKNOWN);
            }

            if (stat.type === FileType.DIRECTORY) {
                await fs.promises.cp(fromPath, toPath, { recursive: true, force: true });
            } else {
                await fs.promises.copyFile(fromPath, toPath);
            }
        } 
        
        catch (err) {
            throw err;
        }
    }

	public async mkdir(uri: URI): Promise<void> {
        try {
            await fs.promises.mkdir(URI.toFsPath(uri), { recursive: true });
        } catch (err) {
            throw err;
        }
    }

    public async delete(uri: URI, opts: IDeleteFileOptions): Promise<void> {
        try {
            const path = URI.toFsPath(uri);
            
            if (opts.recursive) {
                await fs.promises.rm(path, { recursive: opts.recursive });
            } else {
                await fs.promises.unlink(path);
            }
        } catch (err) {
            throw err;
        }
    }

	public async rename(from: URI, to: URI, opts: IOverwriteFileOptions): Promise<void> {
        const fromPath = URI.toFsPath(from);
        const toPath = URI.toFsPath(to);

        if (fromPath === toPath) {
            return;
        }

        try {
            if (fileExists(toPath) && opts.overwrite === false) {
                throw 'file already exists';
            }
            await fs.promises.rename(fromPath, toPath);
        } catch (err) {
            throw err;
        }
    }

    /***************************************************************************
     * File Metadata Handling
     **************************************************************************/

    public async stat(uri: URI): Promise<IFileStat> {
        try {
            const stat = await fs.promises.stat(URI.toFsPath(uri));
            
            let fileType: FileType = FileType.UNKNOWN;
            if (stat.isDirectory()) {
                fileType = FileType.DIRECTORY;
            } else if (stat.isFile()) {
                fileType = FileType.FILE;
            }
            
            return {
                type: fileType,
                createTime: stat.birthtime.getTime(),
                modifyTime: stat.mtime.getTime(),
                byteSize: stat.size
            };
        } 
        
        catch (err) {
            throw err;
        }
    }

	public async readdir(uri: URI): Promise<[string, FileType][]> {
        
        try {
            // reads all the children of the current directory
            const path = URI.toFsPath(uri);
            const children = await fs.promises.readdir(path, { withFileTypes: true });

            const result: [string, FileType][] = [];

            // determines each child entry's file type
            Promise.all(children.map(
                async (child: fs.Dirent) => {
                    try {
                        let type: FileType;
                        if (child.isSymbolicLink()) {
                            type = (await this.stat(URI.fromFile(join(path, child.name)))).type;
                        } else {
                            type = this.__getFileType(child);
                        }
                        result.push([child.name, type]);
                    } catch (err) {
                        // ignores err;
                    }
                }
            ));
            
            return result;
        } 
        
        catch (err) {
            throw err;
        }
    }

    public watch(uri: URI, opts?: IWatchOptions): IDisposable {
        if (!this._watcher) {
            this._watcher = new Watcher(this.logService);
            this.__register(this._watcher.onDidChange(e => this._onDidResourceChange.fire(e)));
            this.__register(this._watcher.onDidClose(e => this._onDidResourceClose.fire(e)));
        }
        const disposable = this._watcher.watch({ resource: uri, ...opts });
        return disposable;
    }

    /***************************************************************************
     * Helper Functions
     **************************************************************************/

    private __getFileType(entry: fs.Dirent): FileType {
        if (entry.isFile()) {
            return FileType.FILE;
        } 
        
        else if (entry.isDirectory()) {
            return FileType.DIRECTORY;
        } 
        
        else {
            return FileType.UNKNOWN;
        }
    }

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