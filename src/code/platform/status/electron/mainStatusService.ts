import { Disposable } from "src/base/common/dispose";
import { join } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/environment/common/environment";
import { DiskStorage, IDiskStorage } from "src/code/platform/files/common/diskStorage";
import { IMainLifecycleService } from "src/code/platform/lifeCycle/electron/mainLifecycleService";
import { NOTA_DIR_NAME } from "src/code/platform/configuration/common/abstractConfigService";

export const IMainStatusService = createDecorator<IMainStatusService>('status-service');

/**
 * An interface only for {@link MainStatusService}. The API are mainly just a
 * wrapper of a {@link IDiskStorage}. You may check the more detailed document
 * from there.
 */
export interface IMainStatusService extends Disposable {
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
 * @class The service stores and saves the user-specific and window-status
 * related data into the disk. 
 * 
 * Invoking set / setLot / delete will automatically save the data into 
 * the disk and the process is asynchronous.
 * 
 * Code implementation mainly is just a wrapper of a {@link IDiskStorage}.
 * 
 * When setting value with `null`, it will be replace with undefined for
 * simplicity.
 * 
 * You may await for the set / setLot / delete to ensure that the saving
 * operation has finished (if sync is on).
 * 
 * @note Service will be initialized at the very beginning of the program.
 * You may assume the service is initialized properly and invoke `init()`
 * only if you need to re-initialize.
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
        @IMainLifecycleService private readonly lifeCycleService: IMainLifecycleService,
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
        } catch (error: any) {
            this.logService.warn(error);
        }
    }

    public async setLot(items: readonly { key: string, val: any }[]): Promise<void> {
        try {
            return this._storage.setLot(items);
        } catch (error: any) {
            this.logService.warn(error);
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
        } catch (error: any) {
            this.logService.warn(error);
        }
        return false;
    }

    public has(key: string): boolean {
        return this._storage.has(key);
    }

    public async init(): Promise<void> {
        try {
            await this._storage.init();
            this.logService.trace(`Main#StatusService#initialized at ${this._storage.resource.toString()}.`);
        } catch (error: any) {
            this.logService.error(error);
            throw error;
        }
    }

    public async close(): Promise<void> {
        try {
            return this._storage.close();
        } catch (error: any) {
            this.logService.error(error);
            throw error;
        }
    }

    private registerListeners(): void {
        this.logService.trace(`Main#MainStatusService#registerListeners()`);
        this.lifeCycleService.onWillQuit((e) => e.join(this.close()));
    }
}