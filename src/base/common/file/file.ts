import { URI } from "src/base/common/file/uri";
import { getFileType } from "src/base/common/string";

export enum FileType {
    MARKDOWN,
    OTHERS,
}

export interface IStat {

	readonly type: FileType;
	readonly createTime: number;
    readonly modifyTime: number;
	readonly byteSize: number;
	readonly readonly?: boolean;
}

export class File implements IStat {

	readonly type: FileType;
	readonly createTime: number;
	readonly modifyTime: number;
	readonly byteSize: number;

	readonly name: string;
	plainText: string;

	constructor(name: string, plainText?: string) {
		this.type = getFileType(name);
		this.createTime = Date.now();
		this.modifyTime = Date.now();
		this.byteSize = 0;
		this.name = name;

        this.plainText = plainText || '';
	}
}

export class Directory implements IStat {

	readonly type: FileType;
	readonly createTime: number;
	readonly modifyTime: number;
	readonly byteSize: number;

	readonly name: string;
	entries: Map<string, File | Directory>;

	constructor(name: string) {
		this.type = getFileType(name);
		this.createTime = Date.now();
		this.modifyTime = Date.now();
		this.byteSize = 0;
		this.name = name;
		
        this.entries = new Map();
	}
}

/** @description the base interface for any other FileSystemProvider. */
export interface IFileSystemProvider {

	readonly capabilities: FileSystemProviderCapability;
	
	// readonly onDidChangeCapabilities: Event<void>;
	// readonly onDidErrorOccur?: Event<string>;
	// readonly onDidChangeFile: Event<readonly IFileChange[]>;
	// watch(resource: string, opts: IWatchOptions): IDisposable;

	stat(resource: URI): Promise<IStat>;
	mkdir(resource: URI): Promise<void>;
	readdir(resource: URI): Promise<[string, FileType][]>;
	delete(resource: URI): Promise<void>;

	rename(from: string, to: string): Promise<void>;
	copy?(from: string, to: string): Promise<void>;

	readFile?(resource: URI): Promise<Uint8Array>;
	writeFile?(resource: URI, content: Uint8Array): Promise<void>;

	readFileStream?(resource: URI, opt?: IReadFileOptions): any;

	open?(resource: URI, opts?: IFileOpenOptions): Promise<number>;
	close?(fd: number): Promise<void>;
	read?(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number>;
	write?(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number>;
}

/*******************************************************************************
 * Specific FileSystemProviders
 ******************************************************************************/

export interface IFileSystemProviderWithFileReadWrite extends IFileSystemProvider {
	readFile(resource: URI): Promise<Uint8Array>;
	writeFile(resource: URI, content: Uint8Array): Promise<void>;
}

export interface IFileSystemProviderWithOpenReadWriteClose extends IFileSystemProvider {
	open(resource: URI, opts: IFileOpenOptions): Promise<number>;
	close(fd: number): Promise<void>;
	read(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number>;
	write(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number>;
}

export interface IFileSystemProviderWithCopy extends IFileSystemProvider {
	copy(from: string, to: string): Promise<void>;
}

export type FileSystemProviderAbleToRead = 
	IFileSystemProviderWithFileReadWrite | 
	IFileSystemProviderWithOpenReadWriteClose;

/*******************************************************************************
 * FileSystemProviders Types
 ******************************************************************************/

export const enum FileSystemProviderCapability {
	/**
	 * Provider supports unbuffered read/write.
	 */
	FileReadWrite = 1 << 1,

	/**
	 * Provider supports open/read/write/close low level file operations.
	 */
	FileOpenReadWriteClose = 1 << 2,

	/**
	 * Provider supports copy operation.
	 */
	FileFolderCopy = 1 << 3,

	/**
	 * Provider is path case sensitive.
	 */
	PathCaseSensitive = 1 << 4,

	/**
	 * Provider supports stream based reading.
	 */
	FileReadStream = 1 << 5,
}

/*******************************************************************************
 * FileSystemProvider Capability Validation Helper Functions
 ******************************************************************************/

export function hasReadWriteCapability(provider: IFileSystemProvider): provider is IFileSystemProviderWithFileReadWrite {
	return !!(provider.capabilities & FileSystemProviderCapability.FileReadWrite);
}

export function hasOpenReadWriteCloseCapability(provider: IFileSystemProvider): provider is IFileSystemProviderWithOpenReadWriteClose {
	return !!(provider.capabilities & FileSystemProviderCapability.FileOpenReadWriteClose);
}

export function hasCopyCapability(provider: IFileSystemProvider): provider is IFileSystemProviderWithCopy {
	return !!(provider.capabilities & FileSystemProviderCapability.FileFolderCopy);
}

/*******************************************************************************
 * Options
 ******************************************************************************/

export interface IFileOpenOptions {

	/**
	 * false: file should be opened for reading.
	 * true:file should be opened for reading and writing.
	 */
	 readonly create: boolean;

	/**
	 * Set to `true` to try to remove any write locks the file might
	 * have. A file that is write locked will throw an error for any
	 * attempt to write to unless `unlock: true` is provided.
	 */
	 readonly unlock: boolean;
}

export interface IReadFileOptions {

	/**
	 * Is an integer specifying where to begin reading from in the file. If 
	 * position is undefined, data will be read from the current file position.
	 */
	readonly position?: number;

	/**
	 * Is an integer specifying how many bytes to read from the file. By default, 
	 * all bytes will be read.
	 */
	readonly length?: number;

	/**
	 * If provided, the size of the file will be checked against the limits.
	 */
	limits?: {
		readonly size?: number;
		readonly memory?: number;
	};
}

export interface ICreateReadStreamOptions extends IReadFileOptions {

	/**
	 * The size of the buffer to use before sending to the stream.
	 */
	bufferSize: number;
}