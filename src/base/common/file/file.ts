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

/**
 * @description the base interface for any other FileSystemProvider
 */
export interface IFileSystemProvider {

	readonly capabilities: FileSystemProviderCapability;
	
	// readonly onDidChangeCapabilities: Event<void>;
	// readonly onDidErrorOccur?: Event<string>;
	// readonly onDidChangeFile: Event<readonly IFileChange[]>;
	// watch(resource: string, opts: IWatchOptions): IDisposable;

	stat(resource: string): Promise<IStat>;
	mkdir(resource: string): Promise<void>;
	readdir(resource: string): Promise<[string, FileType][]>;
	delete(resource: string, opts: any): Promise<void>;

	rename(from: string, to: string, opts: any): Promise<void>;
	copy?(from: string, to: string, opts: any): Promise<void>;

	readFile?(resource: string): Promise<Uint8Array>;
	writeFile?(resource: string, content: Uint8Array, opts: any): Promise<void>;

	readFileStream?(resource: string, opts: any, token: any): any;

	open?(resource: string, opts: any): Promise<number>;
	close?(fd: number): Promise<void>;
	read?(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number>;
	write?(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number>;
}

/*******************************************************************************
 *                        specific FileSystemProviders
 ******************************************************************************/

export interface IFileSystemProviderWithFileReadWrite extends IFileSystemProvider {
	readFile(resource: string): Promise<Uint8Array>;
	writeFile(resource: string, content: Uint8Array, opts: any): Promise<void>;
}

export interface IFileSystemProviderWithOpenReadWriteClose extends IFileSystemProvider {
	open(resource: string, opts: any): Promise<number>;
	close(fd: number): Promise<void>;
	read(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number>;
	write(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number>;
}

export interface IFileSystemProviderWithCopy extends IFileSystemProvider {
	copy(from: string, to: string, opts: any): Promise<void>;
}

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
}

/*******************************************************************************
 *                        InMemoryFileSystemProvider
 ******************************************************************************/

// export class InMemoryFileSystemProvider implements IFileSystemProviderWithFileReadWrite {

// 	public readonly capabilities = 
// 		FileSystemProviderCapability.FileReadWrite |
// 		FileSystemProviderCapability.PathCaseSensitive;
	
// 	public readonly root: Directory = new Directory('');

// 	constructor() {}

	

// }
