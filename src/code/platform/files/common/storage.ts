import { Disposable } from "src/base/common/dispose";
import { DataBuffer } from "src/base/common/file/buffer";
import { FileOperationError } from "src/base/common/file/file";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { ifOrDefault, IndexSignature, mockType, ObjectMappedType } from "src/base/common/util/type";
import { IFileService } from "src/code/common/service/fileService/fileService";

type Sign = IndexSignature;

/**
 * An interface only for {@link DiskStorage}.
 */
export interface IDiskStorage extends Disposable {

    /**
     * Tell the storage if to sync the internal data into the disk.
     */
    setSync(val: boolean): void;

    /**
     * @description Sets a pair of key and value into the storage. If the 
     * storage is sync, the storage will start writing to disk asynchronously.
     * @note If `val` is null, it will be stored and replaced with `undefined`.
     */
    set<K extends Sign = Sign, V = any>(key: K, val: V): void;

    /**
     * @description Sets pairs of key and value into the storage. Works the 
     * same as {@link IDiskStorage.set}.
     */
    setLot<K extends Sign = Sign, V = any>(items: readonly { key: K, val: V }[]): void;

    /**
     * @description Try to get the corresponding value of the given key.
     * @param key The given key.
     * @param defaultVal If key is `undefined`, this value will be returned.
     */
    get<K extends Sign = Sign, V = any>(key: K, defaultVal?: V): V | undefined;

    /**
     * @description Try to get the corresponding values of the given keys. Works
     * the same as {@link IDiskStorage.get}.
     */
    getLot<K extends Sign = Sign, V = any>(keys: K[], defaultVal?: V[]): (V | undefined)[];

    /**
     * @description Try to delete a corresponding value with the given key. The 
     * storage will only sync if the deletion was taken (value does exists).
     * @param key The given key.
     * @returns Returns a boolean to tell if the deletion is taken.
     */
    delete<K extends Sign = Sign>(key: K): boolean;

    /**
     * @description Check if storage has a corresponding value of the given key.
     * @param key The given key.
     */
    has<K extends Sign = Sign>(key: K): boolean;

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
     * @description // TODO
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
 * simplicity.
 */
export class DiskStorage extends Disposable implements IDiskStorage {

    // [field]

    private _storage: ObjectMappedType<any> = Object.create(null);
    private _lastSaveStorage: string = '';
    private _operating?: Promise<void>;
    
    // [constructor]

    constructor(
        private readonly path: URI,
        private sync: boolean,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
    }

    // [public methods]

    public setSync(val: boolean): void {
        this.sync = val;
    }

    public set<K extends Sign = Sign, V = any>(key: K, val: V): void {
        this.setLot([{ key, val }]);
    }

    public setLot<K extends Sign = Sign, V = any>(items: readonly { key: K, val: V }[]): void {
        let save = false;

        for (const { key, val } of items) {
            if (this._storage[key] === val) {
                return;
            }
            this._storage[key] = ifOrDefault(val, undefined!!);
        }

        if (save && this.sync) {
            this.__save();
        }
    }

    public get<K extends Sign = Sign, V = any>(key: K, defaultVal?: V): V | undefined {
        return this.getLot([key], [defaultVal!!])[0];
    }

    public getLot<K extends Sign = Sign, V = any>(keys: K[], defaultVal: V[] = []): (V | undefined)[] {
        let result: (V | undefined)[] = [];
        
        let i = 0;
        for (i = 0; i < keys.length; i++) {
            const val = ifOrDefault(this._storage[keys[i]!], defaultVal[i] ?? undefined!!);
            result.push(val);
        }

        return result;
    }

    public delete<K extends Sign = Sign>(key: K): boolean {
        if (this._storage[key] !== undefined) {
            this._storage[key] = undefined;
            if (this.sync) {
                this.__save();
            }
            return true;
        }
        return false;
    }

    public has<K extends Sign = Sign>(key: K): boolean {
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
        // reading work
        try {
            this._lastSaveStorage = (await this.fileService.readFile(this.path)).toString();
            if (this._lastSaveStorage.length) {
                this._storage = JSON.parse(this._lastSaveStorage);
            }
        } catch (error) {
            this.logService.error(mockType(error));
            throw error;
        }
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
            // no diff, we quit indvance
            return;
        }

        // writing work
        try {
            this._operating = this.fileService.writeFile(this.path, DataBuffer.fromString(serialized), { create: false, overwrite: true, unlock: false });
            this._lastSaveStorage = serialized;
        } catch (error) {
            this.logService.error(mockType(error));
            throw error;
        }

        return this._operating;
    }

    private async __close(): Promise<void> {
        return Promise.resolve().then(async () => {
            await this.__save();
            this._operating = undefined;
        });
    }
}