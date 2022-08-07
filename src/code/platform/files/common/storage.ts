import { Disposable } from "src/base/common/dispose";
import { FileOperationError } from "src/base/common/file/file";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { ifOrDefault, IndexSignature, mockType, ObjectMappedType } from "src/base/common/util/type";
import { IFileService } from "src/code/common/service/fileService/fileService";

/**
 * An interface only for {@link DiskStorage}.
 * // TODO: doc
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

    private _object: ObjectMappedType<V | undefined> = Object.create(null);
    private _operating?: Promise<void>;

    // [constructor]

    constructor(
        private readonly path: URI,
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
            if (this._object[key] === val) {
                return;
            }
            this._object[key] = ifOrDefault(val, undefined!!);
        }

        if (save) {
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
            const val = ifOrDefault(this._object[keys[i]!], defaultVal[i] ?? undefined!!);
            result.push(val);
        }

        return result;
    }

    public delete(key: K): boolean {
        if (this._object[key] !== undefined) {
            this._object[key] = undefined;
            this.__save();
            return true;
        }
        return false;
    }

    public has(key: K): boolean {
        return !!this.get(key);
    }

    public async init(): Promise<void> {
        if (this._operating) {
            return this._operating;
        }

        return this.__init();
    }

    public async close(): Promise<void> {
        if (this._operating) {
            return this._operating;
        }

        return this.__close();
    }

    // [private helper methods]

    private async __init(): Promise<void> {
        // TODO
    }

    private async __save(): Promise<void> {
        // TODO
    }

    private async __close(): Promise<void> {
        // TODO
    }

}