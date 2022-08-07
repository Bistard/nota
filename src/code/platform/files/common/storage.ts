import { Disposable } from "src/base/common/dispose";
import { DataBuffer } from "src/base/common/file/buffer";
import { FileOperationError } from "src/base/common/file/file";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { ifOrDefault, IndexSignature, mockType, ObjectMappedType } from "src/base/common/util/type";
import { IFileService } from "src/code/common/service/fileService/fileService";

/**
 * An interface only for {@link DiskStorage}.
 */
export interface IDiskStorage<K extends IndexSignature, V = any> extends Disposable {

    set(key: K, val: V): void;

    setLot(items: readonly { key: K, val: V }[]): void;

    get(key: K, defaultVal?: V): V | undefined;

    getLot(keys: K[], defaultVal?: V[]): (V | undefined)[];

    delete(key: K): boolean;

    has(key: K): boolean;

    /**
     * @description 
     * @throws An exception thrown if file operation encounters an error with
     * type {@link FileOperationError}.
     */
    init(): Promise<void>;

    /**
     * @description 
     * @throws An exception thrown if file operation encounters an error with
     * type {@link FileOperationError}.
     */
    close(): Promise<void>;
}

/**
 * @class A storage is essentially wrapping an {@link Object} as an internal 
 * data storage to achieve data mapping. It provides read / write the object 
 * into the given path in disk using the given {@link IFileService}.
 */
export class DiskStorage<K extends IndexSignature, V = any> extends Disposable implements IDiskStorage<K, V> {

    // [field]

    private _storage: ObjectMappedType<V | undefined> = Object.create(null);
    private _lastSaveStorage: string = '';
    private _operating?: Promise<void>;
    
    // [constructor]

    constructor(
        private readonly path: URI,
        private readonly sync: boolean,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
    }

    // [public methods]

    public set(key: K, val: V): void {
        this.setLot([{ key, val }]);
    }

    public setLot(items: readonly { key: K, val: V }[]): void {
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

    public get(key: K, defaultVal?: V): V | undefined {
        return this.getLot([key], [defaultVal!!])[0];
    }

    public getLot(keys: K[], defaultVal: V[] = []): (V | undefined)[] {
        let result: (V | undefined)[] = [];
        
        let i = 0;
        for (i = 0; i < keys.length; i++) {
            const val = ifOrDefault(this._storage[keys[i]!], defaultVal[i] ?? undefined!!);
            result.push(val);
        }

        return result;
    }

    public delete(key: K): boolean {
        if (this._storage[key] !== undefined) {
            this._storage[key] = undefined;
            if (this.sync) {
                this.__save();
            }
            return true;
        }
        return false;
    }

    public has(key: K): boolean {
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

    public async close(): Promise<void> {
        // never initialized
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