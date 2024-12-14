import { AsyncResult, err, ok } from "src/base/common/result";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationError, FileOperationErrorType } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { Dictionary, If } from "src/base/common/utilities/type";
import { IFileService } from "src/platform/files/common/fileService";
import { errorToMessage } from "src/base/common/utilities/panic";
import { Strings } from "src/base/common/utilities/string";

/**
 * An interface only for {@link DiskStorage}.
 */
export interface IDiskStorage<TSync extends boolean> {

    /**
     * The resource of the storage.
     */
    readonly resource: URI;

    /**
     * @description Sets a pair of key and value into the storage. If the 
     * storage is sync, the storage will start writing to disk asynchronously.
     * @note If `val` is null, it will be stored and replaced with `undefined`.
     */
    set<K extends PropertyKey = PropertyKey, V = any>(key: K, val: V): If<TSync, AsyncResult<void, FileOperationError>, void>;

    /**
     * @description Sets pairs of key and value into the storage.
     */
    setLot<K extends PropertyKey = PropertyKey, V = any>(items: readonly { key: K, val: V; }[]): If<TSync, AsyncResult<void, FileOperationError>, void>;

    /**
     * @description Try to get the corresponding value of the given key.
     * @param key The given key.
     * @param defaultVal If key is `undefined`, this value will be returned.
     */
    get<K extends PropertyKey = PropertyKey, V = any>(key: K, defaultVal?: V): V | undefined;

    /**
     * @description Try to get the corresponding values of the given keys. Works
     * the same as {@link IDiskStorage.get}.
     */
    getLot<K extends PropertyKey = PropertyKey, V = any>(keys: K[], defaultVal?: V[]): (V | undefined)[];

    /**
     * @description Try to delete a corresponding value with the given key. The 
     * storage will only sync if the deletion was taken (value does exists).
     * @param key The given key.
     * @returns Returns a boolean to tell if the deletion is taken.
     */
    delete<K extends PropertyKey = PropertyKey>(key: K): If<TSync, AsyncResult<boolean, FileOperationError>, boolean>;

    /**
     * @description Check if storage has a corresponding value of the given key.
     * @param key The given key.
     */
    has<K extends PropertyKey = PropertyKey>(key: K): boolean;

    /**
     * @description Initialize the storage and will read the file content into
     * memory through the path which passed inside the constructor.
     * 
     * @note `init()` must be called before taking any operations.
     * @note after `close()` is invoked. Caller may re-invoke `init()`.
     */
    init(): AsyncResult<void, FileOperationError>;

    /**
     * @description Manually save the storage into the memory.
     */
    save(): AsyncResult<void, FileOperationError>;

    /**
     * @description Close the storage and save the current data into the disk.
     * @note Any operations after `close()` will be ignored except `init()` again.
     */
    close(): AsyncResult<void, FileOperationError>;
}

class DiskStorageBase {
    
    // [fields]

    protected _storage: Dictionary<PropertyKey, Omit<any, 'null'>> = Object.create(null);
    protected _lastSaveStorage: string = '';
    protected _operating?: AsyncResult<void, FileOperationError>;

    // [constructor]

    constructor(
        protected readonly path: URI,
        @IFileService protected readonly fileService: IFileService,
    ) { }

    // [public methods]

    get resource(): URI { return this.path; }

    public get<K extends PropertyKey = PropertyKey, V = any>(key: K, defaultVal?: V): V | undefined {
        return this.getLot([key], [defaultVal!!])[0];
    }

    public getLot<K extends PropertyKey = PropertyKey, V = any>(keys: K[], defaultVal: V[] = []): (V | undefined)[] {
        const result: (V | undefined)[] = [];

        let i = 0;
        for (i = 0; i < keys.length; i++) {
            const val = this._storage[keys[i]!] ?? defaultVal[i] ?? undefined!;
            result.push(val);
        }

        return result;
    }

    public has<K extends PropertyKey = PropertyKey>(key: K): boolean {
        return !!this.get(key);
    }

    public init(): AsyncResult<void, FileOperationError> {
        // already initialized
        if (this._operating) {
            return AsyncResult.ok();
        }

        // eslint-disable-next-line local/code-must-handle-result
        this._operating = this.__init();
        return this._operating;
    }

    public save(): AsyncResult<void, FileOperationError> {
        // never initialized or already closed
        if (this._operating === undefined) {
            return AsyncResult.ok();
        }

        return this.__save();
    }

    public close(): AsyncResult<void, FileOperationError> {
        // never initialized or already closed
        if (this._operating === undefined) {
            return AsyncResult.ok();
        }

        return this._operating
            .andThen(() => this.__close());
    }

    // [protected helper methods]

    protected __init(): AsyncResult<void, FileOperationError> {
        return this.fileService.readFile(this.path)
            .andThen(buffer => this.__onInitFileRead(buffer))
            .orElse(error => this.__onInitReadError(error))
            .andThen(reinitialize => reinitialize ? this.__init() : AsyncResult.ok());
    }

    protected __save(): AsyncResult<void, FileOperationError> {

        return new AsyncResult((async () => {
            // never got initialized or already closed, we should never save.
            if (this._operating === undefined) {
                return ok();
            }

            // ensure 'init', 'close' or 'save' are completed
            const success = await this._operating;
            if (success.isErr()) {
                return err(success.error);
            }

            const serialized = Strings.stringifySafe(this._storage, undefined, undefined, 4);
            if (this._lastSaveStorage === serialized) {
                // no diff, we quit in advance.
                return ok();
            }

            // writing work
            // eslint-disable-next-line local/code-must-handle-result
            this._operating = this.fileService.writeFile(this.path, DataBuffer.fromString(serialized), { create: false, overwrite: true, unlock: false });
            this._lastSaveStorage = serialized;

            return this._operating;
        })());
    }

    protected __close(): AsyncResult<void, FileOperationError> {
        return this.__save()
        .andThen(() => { 
            this._operating = undefined; 
            return ok(); 
        });
    }

    // [private helper methods]

    private __onInitFileRead(buffer: DataBuffer): AsyncResult<boolean, FileOperationError> {
        this._lastSaveStorage = buffer.toString();
    
        // If the file is empty, no further action is needed
        if (!this._lastSaveStorage.length) {
            return AsyncResult.ok(false);
        }
    
        // Parse the file content
        return Strings.jsonParseSafe<any>(this._lastSaveStorage)
            .toAsync()
            .andThen(parsed => {
                this._storage = parsed;
                return ok(false);
            })
            .orElse(error => err(new FileOperationError(`Cannot parse the file correctly. Reason: ${errorToMessage(error)}`, FileOperationErrorType.OTHERS)));
    }

    private __onInitReadError(error: FileOperationError): AsyncResult<boolean, FileOperationError> {
        
        // Report unexpected errors
        if (error.code !== FileOperationErrorType.FILE_NOT_FOUND) {
            return AsyncResult.err(error);
        }
    
        // file does not exist, try to create an empty one and re-initialize.
        return this.fileService.writeFile(this.path, DataBuffer.alloc(0), { create: true, overwrite: false, unlock: false })
            .map(() => true);
    }
}

/**
 * @class The `AsyncDiskStorage` class provide an asynchronous interface for 
 * disk storage operations. It implements the `IDiskStorage` interface with a 
 * focus on asynchronous behavior, allowing for non-blocking I/O operations.
 *
 * Internally, it utilizes a dictionary-like structure for storing data in 
 * memory, allowing for rapid access and modification of key-value pairs. The 
 * asynchronous nature of the class enables operations such as reading from and 
 * writing to the disk without blocking the main execution thread, thus 
 * enhancing performance for applications that require high responsiveness.
 *
 * Features:
 * - Efficient in-memory storage using a dictionary for key-value pairs.
 * - Asynchronous disk I/O, allowing non-blocking read and write operations.
 */
export class AsyncDiskStorage extends DiskStorageBase implements IDiskStorage<true> {

    // [constructor]

    constructor(
        path: URI,
        @IFileService fileService: IFileService,
    ) {
        super(path, fileService);
    }

    // [public methods]

    public set<K extends PropertyKey = PropertyKey, V = any>(key: K, val: V): AsyncResult<void, FileOperationError> {
        return this.setLot([{ key, val }]);
    }

    public setLot<K extends PropertyKey = PropertyKey, V = any>(items: readonly { key: K, val: V; }[]): AsyncResult<void, FileOperationError> {
        let save = false;

        for (const { key, val } of items) {
            if (this._storage[key] === val) {
                return AsyncResult.ok();
            }
            this._storage[key] = val ?? undefined!;
            save = true;
        }

        if (save) {
            return this.__save();
        }

        return AsyncResult.ok();
    }

    public delete<K extends PropertyKey = PropertyKey>(key: K): AsyncResult<boolean, FileOperationError> {
        if (this._storage[key] === undefined) {
            return AsyncResult.ok(false);
        }

        this._storage[key] = undefined!;
        return this.__save().map(() => true);
    }
}
