import { AsyncResult, err } from "src/base/common/result";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationError, FileOperationErrorType } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { Dictionary, isObject } from "src/base/common/utilities/type";
import { IFileService } from "src/platform/files/common/fileService";
import { errorToMessage } from "src/base/common/utilities/panic";
import { Strings } from "src/base/common/utilities/string";

/**
 * An interface only for {@link DiskStorage}.
 */
export interface IDiskStorage {

    /**
     * The resource file linked to this storage.
     */
    readonly resource: URI;

    /**
     * @description Sets a pair of key and value into the storage. If the 
     * storage is sync, the storage will start writing to disk asynchronously.
     * @note If `val` is null, it will be stored and replaced with `undefined`.
     */
    set<K extends string, V = any>(key: K, val: V): AsyncResult<void, FileOperationError>;

    /**
     * @description Sets pairs of key and value into the storage.
     */
    setLot<K extends string, V = any>(items: readonly { key: K, val: V; }[]): AsyncResult<void, FileOperationError>;

    /**
     * @description Try to get the corresponding value of the given key.
     * @param key The given key.
     * @param defaultVal If key is `undefined`, this value will be returned.
     */
    get<K extends string, V = any>(key: K, defaultVal?: V): V | undefined;

    /**
     * @description Try to get the corresponding values of the given keys. Works
     * the same as {@link IDiskStorage.get}.
     */
    getLot<K extends string, V = any>(keys: K[], defaultVal?: V[]): (V | undefined)[];

    /**
     * @description Try to delete a corresponding value with the given key. The 
     * storage will only sync if the deletion was taken (value does exists).
     * @param key The given key.
     * @returns Returns a boolean to tell if the deletion is taken.
     */
    delete<K extends string>(key: K): AsyncResult<boolean, FileOperationError>;

    /**
     * @description Check if storage has a corresponding value of the given key.
     * @param key The given key.
     */
    has<K extends string>(key: K): boolean;

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

    /**
     * @description Returns the in-memory reference of the storage.
     */
    getStorage(): Dictionary<string, any>;
}

export class DiskStorage implements IDiskStorage {
    
    // [fields]

    private _storage: Dictionary<string, any> = Object.create(null);
    
    /**
     * Indicating if the storage is currently working. Represents the current
     * operation.
     */
    private _operating?: AsyncResult<void, FileOperationError>;

    // [constructor]

    constructor(
        private readonly path: URI,
        @IFileService private readonly fileService: IFileService,
    ) { }

    // [public methods]

    get resource(): URI { return this.path; }

    public get<K extends string, V = any>(key: K, defaultVal?: V): V | undefined {
        return this.getLot([key], [defaultVal])[0];
    }

    public getLot<K extends string, V = any>(keys: K[], defaultVal: V[] = []): (V | undefined)[] {
        const result: (V | undefined)[] = [];

        let i = 0;
        for (i = 0; i < keys.length; i++) {
            const val = this._storage[keys[i]!] ?? defaultVal[i] ?? undefined!;
            result.push(val);
        }

        return result;
    }

    public has<K extends string>(key: K): boolean {
        return !!this.get(key);
    }

    public set<K extends string, V = any>(key: K, val: V): AsyncResult<void, FileOperationError> {
        return this.setLot([{ key, val }]);
    }

    public setLot<K extends string, V = any>(items: readonly { key: K, val: V; }[]): AsyncResult<void, FileOperationError> {
        let save = false;

        for (const { key, val } of items) {
            if (this._storage[key] === val) {
                return AsyncResult.ok();
            }
            this._storage[key] = val;
            save = true;
        }

        if (save) {
            return this.__save();
        }

        return AsyncResult.ok();
    }

    public delete<K extends string>(key: K): AsyncResult<boolean, FileOperationError> {
        if (this._storage[key] === undefined) {
            return AsyncResult.ok(false);
        }

        delete this._storage[key];
        return this.__save().map(() => true);
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
            .andThen(() => this.__save()
            .map(() => this._operating = undefined));
    }

    public getStorage(): Dictionary<string, any> {
        return this._storage;
    }

    // [private helper methods]

    private __init(): AsyncResult<void, FileOperationError> {
        return this.fileService.readFile(this.path)
            .andThen(buffer => this.__onInitFileRead(buffer))
            .orElse(error => this.__onInitReadError(error))
            .andThen(reinitialize => reinitialize ? this.__init() : AsyncResult.ok());
    }

    private __save(): AsyncResult<void, FileOperationError> {

        // never got initialized or already closed, we should never save.
        if (!this._operating) {
            return AsyncResult.ok();
        }

        // ensure 'init', 'close' or previous 'save' are completed
        return this._operating.andThen(() => {
            const serialized = Strings.stringifySafe(this._storage, undefined, undefined, 4);

            // eslint-disable-next-line local/code-must-handle-result
            this._operating = this.fileService.writeFile(this.path, DataBuffer.fromString(serialized), { create: true, overwrite: true, unlock: false });
            return this._operating;
        });
    }

    private __onInitFileRead(buffer: DataBuffer): AsyncResult<boolean, FileOperationError> {
        const raw = buffer.toString();

        // If the file is empty, no further action is needed.
        if (!raw.length) {
            return AsyncResult.ok(false);
        }
    
        // Parse the file content
        return Strings.jsonParseSafe<any>(raw)
            .toAsync()
            .map(parsed => {
                // invalid reading data, reinitialize it.
                if (isObject(parsed) === false) {
                    return true;
                }
                this._storage = parsed;
                return false;
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