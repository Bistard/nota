import { AsyncResult, Result, err, ok } from "src/base/common/error";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationError, FileOperationErrorType } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { Dictionary, ifOrDefault } from "src/base/common/utilities/type";
import { IFileService } from "src/platform/files/common/fileService";

/**
 * An interface only for {@link DiskStorage}.
 */
export interface IDiskStorage {

    /**
     * The resource of the storage.
     */
    readonly resource: URI;

    /**
     * Tell the storage if to sync the internal data into the disk.
     */
    setSync(val: boolean): void;

    /**
     * @description Sets a pair of key and value into the storage. If the 
     * storage is sync, the storage will start writing to disk asynchronously.
     * @note If `val` is null, it will be stored and replaced with `undefined`.
     * @throws An exception thrown if file operation encounters an error with
     * type {@link FileOperationError}.
     */
    set<K extends PropertyKey = PropertyKey, V = any>(key: K, val: V): void | AsyncResult<void, FileOperationError>;

    /**
     * @description Sets pairs of key and value into the storage. Works the 
     * same as {@link DiskStorage.set}.
     */
    setLot<K extends PropertyKey = PropertyKey, V = any>(items: readonly { key: K, val: V; }[]): void | AsyncResult<void, FileOperationError>;

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
    delete<K extends PropertyKey = PropertyKey>(key: K): boolean | AsyncResult<boolean, FileOperationError>;

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

/**
 * @class A storage is essentially wrapping an {@link Object} as an internal 
 * data storage to achieve data mapping. It provides read / write the object 
 * into the given path in disk using the given {@link IFileService}.
 * 
 * Supporting feature:
 *      - sync data
 *      - re-initialization
 * 
 * K: generic type of the key mapping
 * V: generic type of the value mapping
 * 
 * @note When setting value with `null`, it will be replace with undefined for
 * simplicity and generality.
 * @note You may await for the set / setLot / delete to ensure that the saving
 * operation has finished (if sync is on).
 */
export class DiskStorage implements IDiskStorage {

    // [field]

    private _storage: Dictionary<PropertyKey, Omit<any, 'null'>> = Object.create(null);
    private _lastSaveStorage: string = '';
    private _operating?: AsyncResult<void, FileOperationError>;

    // [constructor]

    constructor(
        private readonly path: URI,
        private sync: boolean,
        @IFileService private readonly fileService: IFileService,
    ) { }

    // [public methods]

    get resource(): URI { return this.path; }

    public setSync(val: boolean): void {
        this.sync = val;
    }

    public set<K extends PropertyKey = PropertyKey, V = any>(key: K, val: V): void | AsyncResult<void, FileOperationError> {
        return this.setLot([{ key, val }]);
    }

    public setLot<K extends PropertyKey = PropertyKey, V = any>(items: readonly { key: K, val: V; }[]): void | AsyncResult<void, FileOperationError> {
        let save = false;

        for (const { key, val } of items) {
            if (this._storage[key] === val) {
                return;
            }
            this._storage[key] = ifOrDefault(val, undefined!!);
            save = true;
        }

        if (save && this.sync) {
            return this.__save();
        }
    }

    public get<K extends PropertyKey = PropertyKey, V = any>(key: K, defaultVal?: V): V | undefined {
        return this.getLot([key], [defaultVal!!])[0];
    }

    public getLot<K extends PropertyKey = PropertyKey, V = any>(keys: K[], defaultVal: V[] = []): (V | undefined)[] {
        const result: (V | undefined)[] = [];

        let i = 0;
        for (i = 0; i < keys.length; i++) {
            const val = ifOrDefault(this._storage[keys[i]!], defaultVal[i] ?? undefined!!);
            result.push(val);
        }

        return result;
    }

    public delete<K extends PropertyKey = PropertyKey>(key: K): boolean | AsyncResult<boolean, FileOperationError> {
        if (this._storage[key] === undefined) {
            return false;
        }

        this._storage[key] = undefined!;
        if (this.sync) {
            return this.__save().then(res => res.map(() => true));
        }

        return true;
    }

    public has<K extends PropertyKey = PropertyKey>(key: K): boolean {
        return !!this.get(key);
    }

    public async init(): AsyncResult<void, FileOperationError> {
        // already initialized
        if (this._operating) {
            return ok();
        }

        this._operating = this.__init();
        return this._operating;
    }

    public async save(): AsyncResult<void, FileOperationError> {
        // never initialized or already closed
        if (this._operating === undefined) {
            return ok();
        }

        return this.__save();
    }

    public async close(): AsyncResult<void, FileOperationError> {
        // never initialized or already closed
        if (this._operating === undefined) {
            return ok();
        }

        const success = await this._operating;
        if (success.isErr()) {
            return success;
        }

        return this.__close();
    }

    // [private helper methods]

    private async __init(): AsyncResult<void, FileOperationError> {
        
        const readSuccess = await this.fileService.readFile(this.path);
        if (readSuccess.isOk()) {
            // file exists, try to read the existing file.
            
            const buffer = readSuccess.data;
            this._lastSaveStorage = buffer.toString();
            
            if (this._lastSaveStorage.length) {
                const parse = Result.fromThrowable(
                    () => JSON.parse(this._lastSaveStorage),
                    error => error,
                );
                
                if (parse.isErr()) {
                    return err(new FileOperationError(`Cannot parse the file correctly`, FileOperationErrorType.OTHERS));
                }

                this._storage = parse.data;
            }

            return ok();
        }

        // only report error when it is not expected (file not found is expected)
        const error = readSuccess.error;
        if (error.code !== FileOperationErrorType.FILE_NOT_FOUND) {
            return err(readSuccess.error);
        }
        
        // file does not exist, try to create one and re-initialize.
        const writeSuccess = await this.fileService.writeFile(this.path, DataBuffer.alloc(0), { create: true, overwrite: false, unlock: false });
        if (writeSuccess.isErr()) {
            return writeSuccess;
        }

        return this.__init();
    }

    private async __save(): AsyncResult<void, FileOperationError> {

        // never got initialized or already closed, we should never save.
        if (this._operating === undefined) {
            return ok();
        }

        // ensure 'init', 'close' or 'save' are completed
        const success = await this._operating;
        if (success.isErr()) {
            return err(success.error);
        }

        const serialized = JSON.stringify(this._storage, null, 4);
        if (this._lastSaveStorage === serialized) {
            // no diff, we quit in advance.
            return ok();
        }

        // writing work
        this._operating = this.fileService.writeFile(this.path, DataBuffer.fromString(serialized), { create: false, overwrite: true, unlock: false });
        this._lastSaveStorage = serialized;

        return this._operating;
    }

    private async __close(): AsyncResult<void, FileOperationError> {
        const success = await this.__save();
        this._operating = undefined;
        return success;
    }
}