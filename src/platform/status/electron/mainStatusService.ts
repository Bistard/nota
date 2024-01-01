import { Disposable } from "src/base/common/dispose";
import { join } from "src/base/common/files/path";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { IFileService } from "src/platform/files/common/fileService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IEnvironmentService, IMainEnvironmentService } from "src/platform/environment/common/environment";
import { DiskStorage, IDiskStorage } from "src/platform/files/common/diskStorage";
import { IMainLifecycleService } from "src/platform/lifecycle/electron/mainLifecycleService";
import { StatusKey } from "src/platform/status/common/status";
import { APP_DIR_NAME } from "src/platform/configuration/common/configuration";
import { FileOperationError } from "src/base/common/files/file";
import { AsyncResult, Result, ok } from "src/base/common/error";

export const IMainStatusService = createService<IMainStatusService>('status-service');

/**
 * An interface only for {@link MainStatusService}. The API are mainly just a
 * wrapper of a {@link IDiskStorage}. You may check the more detailed document
 * from there.
 */
export interface IMainStatusService extends Disposable, IService {
    set<T>(key: StatusKey, val: T): AsyncResult<void, FileOperationError>;
    setLot<T>(items: readonly { key: StatusKey, val: T; }[]): AsyncResult<void, FileOperationError>;
    get<T>(key: StatusKey, defaultVal?: T): T | undefined;
    getLot<T>(keys: StatusKey[], defaultVal?: T[]): (T | undefined)[];
    delete(key: StatusKey): AsyncResult<boolean, FileOperationError>;
    has(key: StatusKey): boolean;
    init(): AsyncResult<void, FileOperationError>;
    close(): AsyncResult<void, FileOperationError>;
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

    declare _serviceMarker: undefined;

    // [field]

    public static readonly FILE_NAME = 'status.nota.json';
    private _storage: IDiskStorage;

    // [constructor]

    constructor(
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
        @IEnvironmentService private readonly environmentService: IMainEnvironmentService,
        @IMainLifecycleService private readonly lifecycleService: IMainLifecycleService,
    ) {
        super();
        const path = URI.fromFile(join(URI.toFsPath(this.environmentService.userDataPath), APP_DIR_NAME, MainStatusService.FILE_NAME));
        this._storage = new DiskStorage(path, true, this.fileService);
        this.__registerListeners();
    }

    // [public methods]

    public async set<T>(key: StatusKey, val: T): AsyncResult<void, FileOperationError> {
        const success = await this._storage.set(key, val);

        if (Result.is(success)) {
            return success;
        }

        return ok();
    }

    public async setLot<T>(items: readonly { key: StatusKey, val: T; }[]): AsyncResult<void, FileOperationError> {
        const success = await this._storage.setLot(items);

        if (Result.is(success)) {
            return success;
        }

        return ok();
    }

    public get<T>(key: StatusKey, defaultVal?: T): T | undefined {
        return this._storage.get(key, defaultVal);
    }

    public getLot<T>(keys: StatusKey[], defaultVal?: T[]): (T | undefined)[] {
        return this._storage.getLot(keys, defaultVal);
    }

    public async delete(key: StatusKey): AsyncResult<boolean, FileOperationError> {
        const success = await this._storage.delete(key);
        
        if (Result.is(success)) {
            return success;
        }

        return ok(success);
    }

    public has(key: StatusKey): boolean {
        return this._storage.has(key);
    }

    public async init(): AsyncResult<void, FileOperationError> {
        const success = await this._storage.init();
        this.logService.trace(`[MainStatusService] initialized at '${URI.toString(this._storage.resource)}'`);
        return success;
    }

    public async close(): AsyncResult<void, FileOperationError> {
        return this._storage.close();
    }

    private __registerListeners(): void {
        this.logService.trace(`[MainStatusService] __registerListeners()`);
        this.lifecycleService.onWillQuit((e) => e.join(this.close()));
    }
}