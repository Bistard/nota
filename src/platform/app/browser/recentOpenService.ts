import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { IRecentOpenedTarget, RecentOpenUtility } from "src/platform/app/common/recentOpen";
import { IHostService } from "src/platform/host/common/hostService";
import { createService, IService } from "src/platform/instantiation/common/decorator";

export const IRecentOpenService = createService<IRecentOpenService>('recent-open-service');

/**
 * An interface only for {@link RecentOpenService}.
 */
export interface IRecentOpenService extends IService {

    /**
     * Fires whenever any new recent opened added. Event will be `undefined` if
     * the recent opened list is cleared.
     * // FIX: this only get triggered when the changes happens in the same process.
     */
    readonly recentOpenedChange: Register<IRecentOpenedTarget | undefined>;

    /**
     * @description Adds a target to the recently opened list. This target will 
     * be treated as the most recent opened.
     * @returns A boolean indicates if the operation succeed.
     */
    addToRecentOpened(target: IRecentOpenedTarget): Promise<boolean>;

    /**
     * @description Retrieves all items from the recently opened list. The most
     * recent opened is at the first, the least recent opened is at the last.
     */
    getRecentOpenedAll(): Promise<IRecentOpenedTarget[]>;

    /**
     * @description Retrieves the most recent DIRECTORY or FILE from the 
     * recently opened list. or undefined if the list is empty.
     */
    getRecentOpened(): Promise<IRecentOpenedTarget | undefined>;

    /**
     * @description Retrieves the most recent DIRECTORY from the recently 
     * opened list. or undefined if the list is empty.
     */
    getRecentOpenedDirectory(): Promise<IRecentOpenedTarget | undefined>;
    
    /**
     * @description Retrieves the most recent FILE from the recently 
     * opened list. or undefined if the list is empty.
     */
    getRecentOpenedFile(): Promise<IRecentOpenedTarget | undefined>;

    /**
     * @description Clears all the recent opened list.
     * @returns A boolean indicates if the operation succeed.
     */
    clearRecentOpened(): Promise<boolean>;
}

/**
 * {@link RecentOpenService} provides a service for managing a list of 
 * recently opened files and directories.
 *      - Maintains a list of recently opened files and directories.
 *      - Supports pinning items for quick access.
 *      - Automatically removes duplicates and trims the list to a maximum size.
 *      - Emits events when new items are added.
 *      - Provides serialization and deserialization mechanisms for persistent storage.
 * 
 * @note Every recent opened target will be serialized into string and stored in 
 * the following format: target_path|{attribute_map}
 * 
 * @example Given a recently opened file with the following properties:
 * ```ts
 * const recentTarget: IRecentOpenedTarget = {
 *     target: URI.fromFile('/path/to/file.txt'),
 *     targetType: FileType.FILE,
 *     pinned: true,
 *     gotoLine: 42,
 * };
 * // The serialized string would look like:
 * // /path/to/file.txt|{"targetType":"file","pinned":true,"gotoLine":42}
 * ```
 */
export class RecentOpenService extends Disposable implements IRecentOpenService {

    declare _serviceMarker: undefined;

    // [field]

    private readonly _recentOpenedChange = this.__register(new Emitter<IRecentOpenedTarget | undefined>());
    public readonly recentOpenedChange = this._recentOpenedChange.registerListener;

    // [constructor]

    constructor(
        @IHostService private readonly hostService: IHostService,
    ) {
        super();
    }

    // [public methods]

    public async addToRecentOpened(target: IRecentOpenedTarget): Promise<boolean> {
        return RecentOpenUtility.addToRecentOpened(this.hostService, target);
    }

    public async getRecentOpened(): Promise<IRecentOpenedTarget | undefined> {
        return this.getRecentOpenedAll()[0];
    }

    public async getRecentOpenedDirectory(): Promise<IRecentOpenedTarget | undefined> {
        return RecentOpenUtility.getRecentOpenedDirectory(this.hostService);
    }

    public async getRecentOpenedFile(): Promise<IRecentOpenedTarget | undefined> {
        return RecentOpenUtility.getRecentOpenedFile(this.hostService);
    }

    public async getRecentOpenedAll(): Promise<IRecentOpenedTarget[]> {
        return RecentOpenUtility.getRecentOpenedAll(this.hostService);
    }

    public async clearRecentOpened(): Promise<boolean> {
        return RecentOpenUtility.clearRecentOpened(this.hostService);
    }
}