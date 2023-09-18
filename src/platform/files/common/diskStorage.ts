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
    set<K extends PropertyKey = PropertyKey, V = any>(key: K, val: V): Promise<void>;

    /**
     * @description Sets pairs of key and value into the storage. Works the 
     * same as {@link IDiskStorage.set}.
     */
    setLot<K extends PropertyKey = PropertyKey, V = any>(items: readonly { key: K, val: V; }[]): Promise<void>;

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
    delete<K extends PropertyKey = PropertyKey>(key: K): Promise<boolean>;

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
     * @throws An exception thrown if file operation encounters an error with
     * type {@link FileOperationError}.
     */
    init(): Promise<void>;

    /**
     * @description Manually save the storage into the memory.
     * @throws An exception thrown if file operation encounters an error with
     * type {@link FileOperationError}.
     */
    save(): Promise<void>;

    /**
     * @description Close the storage and save the current data into the disk.
     * @note Any operations after `close()` will be ignored except `init()` again.
     * @throws An exception thrown if file operation encounters an error with
     * type {@link FileOperationError}.
     */
    close(): Promise<void>;
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
    private _operating?: Promise<void>;

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

    public set<K extends PropertyKey = PropertyKey, V = any>(key: K, val: V): Promise<void> {
        return this.setLot([{ key, val }]);
    }

    public async setLot<K extends PropertyKey = PropertyKey, V = any>(items: readonly { key: K, val: V; }[]): Promise<void> {
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

    public async delete<K extends PropertyKey = PropertyKey>(key: K): Promise<boolean> {
        if (this._storage[key] === undefined) {
            return false;
        }

        this._storage[key] = undefined!;
        if (this.sync) {
            await this.__save();
        }

        return true;
    }

    public has<K extends PropertyKey = PropertyKey>(key: K): boolean {
        return !!this.get(key);
    }

    public async init(): Promise<void> {
        // already initialized
        if (this._operating) {
            return;
        }

        this._operating = this.__init();
        return this._operating;
    }

    public async save(): Promise<void> {
        // never initialized or already closed
        if (this._operating === undefined) {
            return;
        }

        return this.__save();
    }

    public async close(): Promise<void> {
        // never initialized or already closed
        if (this._operating === undefined) {
            return;
        }

        await this._operating;
        return this.__close();
    }

    // [private helper methods]

    private async __init(): Promise<void> {
        // try to read the storage
        try {
            this._lastSaveStorage = (await this.fileService.readFile(this.path)).toString();
            if (this._lastSaveStorage.length) {
                this._storage = JSON.parse(this._lastSaveStorage);
            }
            return;
        } catch (err) {
            if (err instanceof FileOperationError && err.code !== FileOperationErrorType.FILE_NOT_FOUND) {
                throw err;
            }
        }

        // file does not exist, try to create one and re-initialize.
        await this.fileService.writeFile(this.path, DataBuffer.alloc(0), { create: true, overwrite: false, unlock: false });
        return this.__init();
    }

    private async __save(): Promise<void> {

        // never got initialized or already closed, we should never save.
        if (this._operating === undefined) {
            return;
        }

        // ensure 'init', 'close' or 'save' are completed
        await this._operating;

        const serialized = JSON.stringify(this._storage, null, 4);
        if (this._lastSaveStorage === serialized) {
            // no diff, we quit in advance.
            return;
        }

        // writing work
        this._operating = this.fileService.writeFile(this.path, DataBuffer.fromString(serialized), { create: false, overwrite: true, unlock: false });
        this._lastSaveStorage = serialized;

        return this._operating;
    }

    private async __close(): Promise<void> {
        return Promise.resolve().then(async () => {
            await this.__save();
            this._operating = undefined;
        });
    }
}