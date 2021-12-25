import { shell } from 'electron';
import { Abortable } from 'events';
import * as fs from 'fs';
import * as Path from 'path';
import { nameIncludeCheckWithRule, getFileType, pathJoin } from 'src/base/common/string';
import { FileType, ICreateReadStreamOptions, IFileSystemProviderWithFileReadWrite, IFileSystemProviderWithOpenReadWriteClose, IReadFileOptions } from 'src/base/common/file/file';
import { FileNode } from 'src/base/node/fileTree';
import { URI } from 'src/base/common/file/uri';
import { IDataConverter, IWriteableStream } from 'src/base/common/file/stream';
import { DataBuffer } from 'src/base/common/file/buffer';

/*******************************************************************************
 *                              file related code
 ******************************************************************************/

/** @deprecated The method should not be used */
export function isMarkdownFile(filename: string): boolean {
    return getFileType(filename) === FileType.MARKDOWN;
}

/** @deprecated The method should not be used */
export type readFileOption = 
    | ({
        encoding: BufferEncoding;
        flag?: string | undefined;
    } & Abortable)
    | BufferEncoding;

export type readMarkdownFileOption = readFileOption;

/** @deprecated The method should not be used */
const defaultReadFileOpt: readMarkdownFileOption = {
    encoding: 'utf-8',
    flag: 'r'
};

/** @deprecated The method should not be used */
/**
 * @description asynchronously reads a single .md file and stores the text into FileNode.
 */
export async function readMarkdownFile(
    nodeInfo: FileNode, 
    opt: readMarkdownFileOption = defaultReadFileOpt): Promise<void | string> 
{
    return new Promise((resolve, reject) => {
        
        if (!nodeInfo || nodeInfo.isFolder) {
            reject('given wrong nodeInfo or it is a folder');
        } else if (!isMarkdownFile(nodeInfo.baseName)) {
            reject('not a markdown file');
        }

        fs.readFile(nodeInfo.path, opt, (err, text: string) => {
            if (err) {
                reject(err);
            }
            nodeInfo.file!.plainText = text;
            resolve();
        });
    });
}

/** @deprecated The method should not be used */
/**
 * @description synchronously reads .md file and stores the text into FileNode.
 * 
 * NOT RECOMMENDED TO USE THIS.
 */
 export function readMarkdownFileSync(
     nodeInfo: FileNode, 
     opt: readMarkdownFileOption): void    
{
    if (!nodeInfo || nodeInfo.isFolder) {
        throw 'given wrong nodeInfo or it is a folder';
    } else if (!isMarkdownFile(nodeInfo.baseName)) {
        // do log here
        return;
    }

    // const err = new Error("Found an error");
    // this.fileLogService.error(err);
    
    nodeInfo.file!.plainText = fs.readFileSync(nodeInfo.path, opt);
}

/** @deprecated The method should not be used */
/**
 * @description asynchronously saves .md file.
 */
export async function saveMarkdownFile(
    nodeInfo: FileNode, 
    newPlainText: string): Promise<void> 
{
    return new Promise((resolve, reject) => {
        if (nodeInfo !== undefined && !nodeInfo.isFolder) {

            let writeOption: fs.WriteFileOptions = {
                encoding: 'utf-8',
                flag: 'w'
            };
    
            fs.writeFile(nodeInfo.path, newPlainText, writeOption, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        } else {
            reject('given wrong nodeInfo or it is a folder');
        }
    });
}

/** @deprecated The method should not be used */
/**
 * @description asynchronously check the existance of given file in the given path.
 * 
 * @param path eg. D:\dev\AllNote
 */
export async function isFileExisted(
    path: string, 
    fileName: string): Promise<boolean>
{
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files: string[]) => {
            if (err) {
                reject(err);
            }

            files.forEach((file: string) => {
                if (file == fileName) {
                    resolve(true);
                }
            });
            resolve(false);
        });
    });
}

/** @deprecated The method should not be used */
/**
 * @description asynchronously creates a file.
 * 
 * @param path eg. D:\dev\AllNote
 * @param fileName eg. log.json
 * @param content plainText ready to be written
 */
export async function createFile(
    path: string, 
    fileName: string, 
    content: string = ''): Promise<void> 
{
    return new Promise((resolve, reject) => {
        fs.writeFile(pathJoin(path, fileName), content, (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

/** @deprecated The method should not be used */
/**
 * @description asynchronously deletes a file.
 * 
 * @param path eg. D:\dev\AllNote
 */
 export async function deleteFile(
    path: string): Promise<void> 
{
    return new Promise((resolve, reject) => {
        if (fs.existsSync(path)) {
            fs.unlink(path, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        } else {
            alert("This file doesn't exist, cannot delete");
        }
    });
}

/** @deprecated The method should not be used */
/**
 * @description asynchronously moves a file to trash.
 * 
 * @param path eg. D:\dev\AllNote
 */
 export async function moveFileToTrash(
    path: string): Promise<void> 
{
    return new Promise((resolve, reject) => {
        if (fs.existsSync(path)) {
            shell.trashItem(path);
            resolve();
        } else {
            alert("This file doesn't exist, cannot move to trash");
        }
    });
}

/** @deprecated The method should not be used */
/**
 * @description asynchronously reads the whole text from a general file.
 * 
 * @param path eg. D:\dev\AllNote
 */
 export async function readFromFile(
    path: string, 
    opt: readFileOption = defaultReadFileOpt): Promise<string>
{
    return new Promise((resolve, reject) => {
        fs.readFile(path, opt, (err, text: string) => {
            if (err) {
                reject(err);
            }
            resolve(text);
        });
    });
}

/** @deprecated The method should not be used */
/**
 * @description synchronously reads the whole text from a general file.
 * 
 * @param path eg. D:\dev\AllNote
 */
 export function readFromFileSync(
    path: string, 
    opt: readFileOption = defaultReadFileOpt): string
{
    return fs.readFileSync(path, opt);
}

/** @deprecated The method should not be used */
/**
 * @description asynchronously writes to a file.
 * 
 * @param path eg. D:\dev\AllNote
 * @param fileName eg. log.json
 * @param content plainText ready to be written
 */
export async function writeToFile(
    path: string, 
    fileName: string, 
    content: string): Promise<void> 
{
    return createFile(path, fileName, content);
}

/*******************************************************************************
 *                            directory related code
 ******************************************************************************/

/** @deprecated The method should not be used */
/**
 * @description asynchronously creates a directory.
 * 
 * @param path eg. D:\dev\AllNote
 * @param dirName eg. .mdnote
 * @returns {string} the path to the new directory
 */
 export async function createDir(
     path: string, 
     dirName: string): Promise<string> 
{
    return new Promise((resolve, reject) => {
        const newDir: string = pathJoin(path, dirName);
        fs.mkdir(newDir, {recursive: true}, (err) => {
            if (err) {
                reject(err);
            }
            resolve(newDir);
        });
    });
}

/** @deprecated The method should not be used */
/**
 * @description asynchronously check the existance of given directory in the given path.
 * 
 * @param path eg. D:\dev\AllNote
 * @param dirName eg. .mdnote
 */
 export async function isDirExisted(
     path: string, 
     dirName: string): Promise<boolean> 
{
    return isFileExisted(path, dirName);
}

/** @deprecated The method should not be used */
/**
 * @description asynchronously read each file/dir in the given path, filters out
 * a result with given exclude/include rules.
 * 
 * @param path rootdir, eg. D:\dev\AllNote
 * @param excludes array of folders/files to be excluded
 * @param includes array of folders/files to be included
 * @returns 
 */
export async function dirFilter(
    path: string, 
    noteBookManagerExclude: string[] = [], 
    noteBookManagerInclude: string[] = []): Promise<string[]> 
{
    let acceptableTarget: string[] = [];
    return new Promise((resolve, reject) => {
        fs.readdir(path, {withFileTypes: true}, (err, dirEntries: fs.Dirent[]) => {
            if (err) {
                reject(err);
            }

            for (let dirEntry of dirEntries) {
                
                if (dirEntry.isDirectory()) {
                    
                    // ignores the excluded directory
                    if (!nameIncludeCheckWithRule(dirEntry.name, noteBookManagerInclude) && 
                        nameIncludeCheckWithRule(dirEntry.name, noteBookManagerExclude))
                    {
                        continue;
                    }
                    acceptableTarget.push(dirEntry.name);
                } else {
                    // currently, there is no need to parser file in the rootdir
                }
            };
            
            resolve(acceptableTarget);
        });
    })
} 


/*******************************************************************************
 * File Mode Permissions
 ******************************************************************************/
 
export const FileMode = {
 
    /** @readonly Corresponds to octal: 0o400 */
    readable: fs.constants.S_IRUSR,
 
    /** @readonly Corresponds to octal: 0o200 */
    writable: fs.constants.S_IWUSR,

    /** @readonly Corresponds to octal: 0o100 */
    executable: fs.constants.S_IXUSR,
 
    /** @readonly Constant for fs.access(). File is visible to the calling process. */
    visible: fs.constants.F_OK,
 }

/*******************************************************************************
 * Path Handling
 ******************************************************************************/

/**
 * @description Check the existance of the file in the given path.
 */
export function fileExists(path: string): boolean {
    try {
        fs.accessSync(path, FileMode.visible);
        return true;
    } catch {
        return false;
    }
}

/*******************************************************************************
 * File Reading/Writing
 ******************************************************************************/

/** @description Helper functions for read file unbuffered operation. */
export async function readFileIntoStreamAsync(
    provider: IFileSystemProviderWithFileReadWrite, 
    resource: URI, 
    stream: IWriteableStream<DataBuffer>, 
    opts: IReadFileOptions): Promise<void> 
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
    } catch (err) {
        stream.error(err as any);
        stream.end();
    }
}

/** @description Helper functions for read file buffered operation. */
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

        } while(bytesRead > 0 && (typeof allowedRemainingBytes !== 'number' || allowedRemainingBytes > 0));

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
