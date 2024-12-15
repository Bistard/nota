import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { createMenuRecentOpenTemplate } from "src/platform/app/common/menu.register";
import { IRecentOpenedTarget, RecentOpenUtility } from "src/platform/app/common/recentOpen";
import { IHostService } from "src/platform/host/common/hostService";
import { createService, IService } from "src/platform/instantiation/common/decorator";
import { IMenuRegistrant } from "src/platform/menu/browser/menuRegistrant";
import { MenuTypes } from "src/platform/menu/common/menu";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { AllCommands } from "src/workbench/services/workbench/commandList";

export const IRecentOpenService = createService<IRecentOpenService>('recent-open-service');

/**
 * An interface only for {@link RecentOpenService}.
 */
export interface IRecentOpenService extends IService {

    /**
     * Fires whenever any new recent opened added. Event will be `undefined` if
     * the recent opened list is cleared.
     */
    readonly onRecentOpenedChange: Register<IRecentOpenedTarget | undefined>;

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

    private readonly _onRecentOpenedChange = this.__register(new Emitter<IRecentOpenedTarget | undefined>());
    public readonly onRecentOpenedChange = this._onRecentOpenedChange.registerListener;

    private readonly _menuRegistrant: IMenuRegistrant;

    // [constructor]

    constructor(
        @IHostService private readonly hostService: IHostService,
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        super();
        this._menuRegistrant = registrantService.getRegistrant(RegistrantType.Menu);
    }

    // [public methods]

    public async addToRecentOpened(target: IRecentOpenedTarget): Promise<boolean> {
        const taken = await RecentOpenUtility.addToRecentOpened(this.hostService, target);
        if (taken) {
            await this.__onRecentOpenChange(target);
        }
        return taken;
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
        const taken = await RecentOpenUtility.clearRecentOpened(this.hostService);
        if (taken) {
            await this.__onRecentOpenChange(undefined);
        }
        return taken;
    }

    // [private helper methods]

    private async __onRecentOpenChange(target?: IRecentOpenedTarget): Promise<void> {
        await this.__refreshMenuOpenRecent();
        this._onRecentOpenedChange.fire(target);
    }

    private async __refreshMenuOpenRecent(): Promise<void> {
        this._menuRegistrant.clearMenuItems(MenuTypes.FileRecentOpen);
        const recentOpened = await this.getRecentOpenedAll();
        
        // fixed (basic)
        for (const item of createMenuRecentOpenTemplate()) {
            this._menuRegistrant.registerMenuItem(MenuTypes.FileRecentOpen, item);
        }

        // dynamic (recent opened)
        for (const { target } of recentOpened) {
            const name = URI.toFsPath(target);
            this._menuRegistrant.registerMenuItem(MenuTypes.FileRecentOpen, {
                group: '2_recent_open',
                title: name,
                command: {
                    commandID: AllCommands.fileTreeOpenFolder,
                    args: [target],
                },
            });
        }
    }
}