import { Disposable } from "src/base/common/dispose";
import { join } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { mockType } from "src/base/common/util/type";
import { NOTA_DIR_NAME } from "src/code/common/service/configService/configService";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/environment/common/environment";
import { DiskStorage, IDiskStorage } from "src/code/platform/files/common/storage";
import { IMainLifeCycleService, LifeCyclePhase } from "src/code/platform/lifeCycle/electron/mainLifeCycleService";

export const IMainStatusService = createDecorator<IMainStatusService>('status-service');

export interface IMainStatusService extends Disposable {

    /**
     * @description 
     * @note If `val` is null, it will be stored and replaced with `undefined`.
     */
    set(key: string, val: any): Promise<void>;

    setLot(items: readonly { key: string, val: any }[]): Promise<void>;

    get(key: string, defaultVal?: any): any | undefined;

    getLot(keys: string[], defaultVal?: any[]): (any | undefined)[];

    delete(key: string): Promise<boolean>;

    has(key: string): boolean;

    init(): Promise<void>;

    close(): Promise<void>;
}

/**
 * 
 */
export class MainStatusService extends Disposable implements IMainStatusService {

    // [field]

    public static readonly FILE_NAME = 'status.nota.json';
    private _storage: IDiskStorage;

    // [constructor]

    constructor(
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
        @IEnvironmentService private readonly environmentService: IMainEnvironmentService,
        @IMainLifeCycleService private readonly lifeCycleService: IMainLifeCycleService,
    ) {
        super();
        const path = URI.fromFile(join(URI.toFsPath(this.environmentService.userDataPath), NOTA_DIR_NAME, MainStatusService.FILE_NAME));
        this._storage = new DiskStorage(path, true, this.fileService);
        this.registerListeners();
    }

    // [public methods]

    public async set(key: string, val: any): Promise<void> {
        try {
            return this._storage.set(key, val);
        } catch (error) {
            this.logService.warn(mockType(error));
        }
    }

    public async setLot(items: readonly { key: string, val: any }[]): Promise<void> {
        try {
            return this._storage.setLot(items);
        } catch (error) {
            this.logService.warn(mockType(error));
        }
    }

    public get(key: string, defaultVal?: any): any | undefined {
        return this._storage.get(key, defaultVal);
    }

    public getLot(keys: string[], defaultVal?: any[]): (any | undefined)[] {
        return this._storage.getLot(keys, defaultVal);
    }

    public async delete(key: string): Promise<boolean> {
        try {
            return this._storage.delete(key);
        } catch (error) {
            this.logService.warn(mockType(error));
        }
        return false;
    }

    public has(key: string): boolean {
        return this._storage.has(key);
    }

    public async init(): Promise<void> {
        try {
            return this._storage.init();
        } catch (error) {
            this.logService.error(mockType(error));
            throw error;
        }
    }

    public async close(): Promise<void> {
        try {
            return this._storage.close();
        } catch (error) {
            this.logService.error(mockType(error));
            throw error;
        }
    }

    private registerListeners(): void {
        this.lifeCycleService.onWillQuit(() => this.close());
    }
}