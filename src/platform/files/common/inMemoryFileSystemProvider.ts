import { Disposable, IDisposable, toDisposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { FileOperationErrorType, FileSystemProviderCapability, FileSystemProviderError, FileType, IDeleteFileOptions, IFileStat, IOverwriteFileOptions, IWatchOptions, IWriteFileOptions } from "src/base/common/files/file";
import { IFileSystemProviderWithFileReadWrite } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { Scheduler } from "src/base/common/utilities/async";
import { ResourceMap } from "src/base/common/structures/map";
import { IRawResourceChangeEvent, IRawResourceChangeEvents, ResourceChangeType } from "src/platform/files/common/watcher";
import { createRawResourceChangeEvents } from "src/platform/files/node/watcher";

type Entry = File | Directory;

class File implements IFileStat {

	public type = FileType.FILE;
	public createTime = Date.now();
	public modifyTime = Date.now();
	public byteSize = 0;

	public name: string;
	public data?: Uint8Array;

	constructor(name: string) {
		this.name = name;
	}
}

class Directory implements IFileStat {

	public type = FileType.DIRECTORY;
	public createTime = Date.now();
	public modifyTime = Date.now();
	public byteSize = 0;

	public name: string;
	public entries: Map<string, File | Directory> = new Map();

	constructor(name: string) {
		this.name = name;
	}
}

export interface IInMemoryFileSystemProviderOptions {
	readonly throwWhenNotSupport?: boolean;
}

export class InMemoryFileSystemProvider extends Disposable implements
	IFileSystemProviderWithFileReadWrite {

	// [fields]

	public readonly capabilities: FileSystemProviderCapability = FileSystemProviderCapability.FileReadWrite;

	private readonly _root = new Directory('');
	private readonly _watchers = new ResourceMap<IDisposable>();

	// [event]

	private readonly _onDidResourceChangeScheduler: Scheduler<IRawResourceChangeEvent>;

	private readonly _onDidResourceChange = this.__register(new Emitter<IRawResourceChangeEvents>());
	public readonly onDidResourceChange = this._onDidResourceChange.registerListener;

	private readonly _onDidResourceClose = this.__register(new Emitter<URI>()); // unused
	public readonly onDidResourceClose = this._onDidResourceClose.registerListener;

	// [constructor]

	constructor() {
		super();

		this._onDidResourceChangeScheduler = new Scheduler(5, (rawEvents) => {

			let anyDirectory = false, anyFiles = false, anyAdded = false, anyDeleted = false, anyUpdated = false;
			for (const raw of rawEvents) {
				if (raw.isDirectory) {
					anyDirectory = true;
				} else if (raw.isDirectory === false) {
					anyFiles = true;
				}
				if (raw.type === ResourceChangeType.ADDED) {
					anyAdded = true;
				} else if (raw.type === ResourceChangeType.DELETED) {
					anyDeleted = true;
				} else {
					anyUpdated = true;
				}
			}

			this._onDidResourceChange.fire(createRawResourceChangeEvents(rawEvents, anyAdded, anyDeleted, anyUpdated, anyDirectory, anyFiles));
		});
	}

	// [public methods]

	/**
	 * @note Does not support recursive watching.
	 */
	public watch(uri: URI, opts?: IWatchOptions): IDisposable {
		if (opts) {
			throw new Error('[InMemoryFileSystemProvider] does not provide options for `watch`.');
		}

		if (this._watchers.has(uri)) {
			throw new Error(`Already watching URI: '${URI.toString(uri)}'`);
		}

		const watcher = toDisposable(() => {
			this._watchers.delete(uri);
		});
		this._watchers.set(uri, watcher);

		return watcher;
	}

	public async stat(uri: URI): Promise<IFileStat> {
		return this.__lookup(uri, false);
	}

	public async mkdir(uri: URI): Promise<void> {
		if (this.__lookup(uri, true)) {
			throw new FileSystemProviderError(`file exists already: ${URI.toString(uri)}`, FileOperationErrorType.FILE_EXISTS);
		}

		const baseName = URI.basename(uri);
		const dirName = URI.dirname(uri);

		const parent = this.__lookupDirectory(dirName, false);

		const entry = new Directory(baseName);
		parent.entries.set(entry.name, entry);
		parent.modifyTime = Date.now();
		parent.byteSize += 1;

		this.__triggerWatchers(uri, [ResourceChangeType.ADDED, ResourceChangeType.UPDATED], false);
	}

	public async readdir(uri: URI): Promise<[string, FileType][]> {
		const entry = this.__lookupDirectory(uri, false);
		const result: [string, FileType][] = [];
		entry.entries.forEach((child, name) => result.push([name, child.type]));
		return result;
	}

	public async delete(uri: URI, opts: IDeleteFileOptions): Promise<void> {
		const baseName = URI.basename(uri);
		const dirName = URI.dirname(uri);

		const parent = this.__lookupDirectory(dirName, false);
		if (!parent.entries.has(baseName)) {
			return;
		}
		const target = parent.entries.get(baseName)!;

		parent.entries.delete(baseName);
		parent.modifyTime = Date.now();
		parent.byteSize -= 1;

		this.__triggerWatchers(uri, [ResourceChangeType.UPDATED, ResourceChangeType.DELETED], target.type === FileType.FILE);
	}

	public async rename(from: URI, to: URI, opts: IOverwriteFileOptions): Promise<void> {
		if (!opts.overwrite && this.__lookup(to, true)) {
			throw new FileSystemProviderError(`file exists already: ${URI.toString(to)}`, FileOperationErrorType.FILE_EXISTS);
		}

		const entry = this.__lookup(from, false);
		const oldParent = this.__lookupDirectory(URI.dirname(from));

		const newParent = this.__lookupDirectory(URI.dirname(to));
		const newName = URI.basename(to);

		oldParent.entries.delete(entry.name);
		entry.name = newName;
		newParent.entries.set(newName, entry);

		const isFile = entry.type === FileType.FILE;
		this.__triggerWatchers(from, ResourceChangeType.DELETED, isFile);
		this.__triggerWatchers(to, ResourceChangeType.ADDED, isFile);
	}

	public async readFile(uri: URI): Promise<Uint8Array> {
		const entry = this.__lookupFile(uri, false);
		if (entry?.data) {
			return entry.data;
		}
		throw new FileSystemProviderError(`file not found: ${URI.toString(uri)}`, FileOperationErrorType.FILE_NOT_FOUND);
	}

	public async writeFile(uri: URI, content: Uint8Array, opts: IWriteFileOptions): Promise<void> {
		const basename = URI.basename(uri);
		const parent = this.__lookupDirectory(URI.dirname(uri), false);
		let entry = parent.entries.get(basename);

		if (entry instanceof Directory) {
			throw new FileSystemProviderError(`file is directory: ${URI.toString(uri)}`, FileOperationErrorType.FILE_IS_DIRECTORY);
		}

		if (!entry && !opts.create) {
			throw new FileSystemProviderError(`file not found: ${URI.toString(uri)}`, FileOperationErrorType.FILE_NOT_FOUND);
		}

		if (entry && opts.create && !opts.overwrite) {
			throw new FileSystemProviderError(`file already exists: ${URI.toString(uri)}`, FileOperationErrorType.FILE_EXISTS);
		}

		if (!entry) {
			entry = new File(basename);
			parent.entries.set(basename, entry);
			this.__triggerWatchers(uri, ResourceChangeType.ADDED, true);
		}

		entry.modifyTime = Date.now();
		entry.byteSize = content.byteLength;
		entry.data = content;

		this.__triggerWatchers(uri, ResourceChangeType.UPDATED, true);
	}

	public override dispose(): void {
		super.dispose();
		for (const [path, disposable] of this._watchers) {
			disposable.dispose();
		}
	}

	// [private helper methods]

	private __lookup(uri: URI, silent: false): Entry;
	private __lookup(uri: URI, silent: boolean): Entry | undefined;
	private __lookup(uri: URI, silent: boolean): Entry | undefined {
		let entry: Entry = this._root;

		const parts = uri.path.split('/');
		for (const part of parts) {
			if (!part) {
				continue;
			}

			let child: Entry | undefined;
			if (entry instanceof Directory) {
				child = entry.entries.get(part);
			}

			if (!child) {
				if (!silent) {
					throw new FileSystemProviderError(`file not found: ${URI.toString(uri)}`, FileOperationErrorType.FILE_NOT_FOUND);
				} else {
					return undefined;
				}
			}
			entry = child;
		}

		return entry;
	}

	private __lookupDirectory(uri: URI, silent: boolean = false): Directory {
		const entry = this.__lookup(uri, silent);
		if (entry instanceof Directory) {
			return entry;
		}
		throw new FileSystemProviderError(`file not a directory: ${URI.toString(uri)}`, FileOperationErrorType.FILE_IS_NOT_DIRECTORY);
	}

	private __lookupFile(uri: URI, silent: boolean = false): File {
		const entry = this.__lookup(uri, silent);
		if (entry instanceof File) {
			return entry;
		}
		throw new FileSystemProviderError(`file is a directory: ${URI.toString(uri)}`, FileOperationErrorType.FILE_IS_DIRECTORY);
	}

	private __triggerWatchers(uri: URI, types: ResourceChangeType | ResourceChangeType[], isFile: boolean): void {
		if (!this._watchers.has(uri)) {
			return;
		}

		if (!Array.isArray(types)) {
			types = [types];
		}

		const rawEvents: IRawResourceChangeEvent[] = [];
		for (const type of types) {
			rawEvents.push({
				resource: URI.toString(uri),
				type: type,
				isDirectory: !isFile,
			});
		}

		this._onDidResourceChangeScheduler.schedule(rawEvents);
	}
}