import { Disposable } from "src/base/common/dispose";
import { ILogService } from "src/base/common/logger";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/environment/common/environment";
import { DiskStorage, IDiskStorage } from "src/code/platform/files/common/storage";

export const IMainStatusService = createDecorator<IMainStatusService>('status-service');

export interface IMainStatusService extends Disposable {

    /**
     * @description 
     * @note If `val` is null, it will be stored and replaced with `undefined`.
     */
    set(key: string, val: any): void;

    setLot(items: readonly { key: string, val: any }[]): void;

    get(key: string, defaultVal?: any): any | undefined;

    getLot(keys: string[], defaultVal?: any[]): (any | undefined)[];

    delete(key: string): boolean;

    has(key: string): boolean;

    init(): Promise<void>;

    close(): Promise<void>;
}

/**
 * 
 */
export class MainStatusService extends Disposable implements IMainStatusService {

    // [field]

    private _storage: IDiskStorage;

    // [constructor]

    constructor(
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
        @IEnvironmentService private readonly environmentService: IMainEnvironmentService,
    ) {
        super();
        // REVIEW: wrong path
        this._storage = new DiskStorage(environmentService.appRootPath, true, fileService, logService);
        this.init();
    }

    // [public methods]

    public set(key: string, val: any): void {
        try {
            this._storage.set(key, val);
        } catch (err) {
            console.log(err);
        }
    }

    public setLot(items: readonly { key: string, val: any }[]): void {
        try {
            this._storage.setLot(items);
        } catch (err) {
            console.log(err);
        }
    }

    public get(key: string, defaultVal?: any): any | undefined {
        return this._storage.get(key, defaultVal);
    }

    public getLot(keys: string[], defaultVal?: any[]): (any | undefined)[] {
        return this._storage.getLot(keys, defaultVal);
    }

    public delete(key: string): boolean {
        return this._storage.delete(key);
    }

    public has(key: string): boolean {
        return this._storage.has(key);
    }

    public async init(): Promise<void> {
        return this._storage.init();
    }

    public async close(): Promise<void> {
        return this._storage.close();
    }
}