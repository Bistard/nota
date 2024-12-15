import { Disposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { Emitter, Register } from "src/base/common/event";
import { FileType } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { Result } from "src/base/common/result";
import { Arrays } from "src/base/common/utilities/array";
import { Strings } from "src/base/common/utilities/string";
import { IHostService } from "src/platform/host/common/hostService";
import { createService, IService } from "src/platform/instantiation/common/decorator";
import { StatusKey } from "src/platform/status/common/status";

export const IRecentOpenService = createService<IRecentOpenService>('recent-open-service');

/**
 * Represents an entry in the recently opened list.
 */
export interface IRecentOpenedTarget {
    /**
     * The resource of the recently opened target.
     */
    readonly target: URI;
    /**
     * If the target is a file or directory.
     */
    readonly targetType: FileType;
    /**
     * Specifies whether the target should be pinned in the recently opened list.
     * @default false
     */
    readonly pinned: boolean;
    /**
     * Optional. Specifies the line number to navigate to when reopening the 
     * target.
     * @note Only support when the target is a file.
     */
    readonly gotoLine?: number;
}

/**
 * An interface only for {@link RecentOpenService}.
 */
export interface IRecentOpenService extends IService {

    /**
     * Fires whenever any new recent opened added.
     * // FIX: this only get triggered when the changes happens in the same process.
     */
    readonly recentOpenedChange: Register<IRecentOpenedTarget>;

    /**
     * Adds a target to the recently opened list. This target will be treated
     * as the most recent opened.
     */
    addToRecentOpened(target: IRecentOpenedTarget): Promise<void>;

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

    private readonly _recentOpenedChange = this.__register(new Emitter<IRecentOpenedTarget>());
    public readonly recentOpenedChange = this._recentOpenedChange.registerListener;

    public static readonly MAX_SIZE = 100;

    // [constructor]

    constructor(
        @IHostService private readonly hostService: IHostService,
    ) {
        super();
    }

    // [public methods]

    public async addToRecentOpened(target: IRecentOpenedTarget): Promise<void> {
        let recentOpened = await this.getRecentOpenedAll();

        // append to the first then remove duplicate
        recentOpened.unshift(target);
        recentOpened = Arrays.unique(recentOpened, each => URI.toString(each.target));
        recentOpened = recentOpened.slice(0, RecentOpenService.MAX_SIZE);

        // write back to disk
        const serialization = recentOpened.map(each => this.__serialize(each));
        
        return Result.fromPromise(
            () => this.hostService.setApplicationStatus(StatusKey.OpenRecent, serialization),
        ).match(
            () => this._recentOpenedChange.fire(target),
            err => ErrorHandler.onUnexpectedError(err),
        );
    }

    public async getRecentOpened(): Promise<IRecentOpenedTarget | undefined> {
        return this.getRecentOpenedAll()[0];
    }

    public async getRecentOpenedDirectory(): Promise<IRecentOpenedTarget | undefined> {
        return (await this.getRecentOpenedAll()).find(each => each.targetType === FileType.DIRECTORY);
    }

    public async getRecentOpenedFile(): Promise<IRecentOpenedTarget | undefined> {
        return (await this.getRecentOpenedAll()).find(each => each.targetType === FileType.FILE);
    }

    public async getRecentOpenedAll(): Promise<IRecentOpenedTarget[]> {
        return Result.fromPromise(
            () => this.hostService.getApplicationStatus(StatusKey.OpenRecent)
        ).match(
            recentOpened => {
                if (!Array.isArray(recentOpened)) {
                    return [];
                }
                const deserialization = recentOpened.map(raw => this.__deserialize(raw));
                return Arrays.coalesce(deserialization);
            }, 
            err => {
                ErrorHandler.onUnexpectedError(err);
                return [];
            }
        );
    }

    // [private methods]

    private __deserialize(raw: string): IRecentOpenedTarget | undefined {
        const parts = raw.split('|');

        const [target, attributes] = parts;

        // target and target type cannot be undefined or empty.
        if (!target || !attributes) {
            return undefined;
        }

        return Strings.jsonParseSafe<object>(attributes)
            .match<IRecentOpenedTarget | undefined>(
                attribute => {
                    const type = attribute['targetType'];
                    if (type !== 'directory' && type !== 'file') {
                        return undefined;
                    }

                    const isDir =  (type === 'directory') ? FileType.DIRECTORY : FileType.UNKNOWN;
                    const isFile = (type === 'file')      ? FileType.FILE      : FileType.UNKNOWN;
                    const isPinned = attribute['pinned'] === true;

                    const lineNumber = attribute['gotoLine'];
                    const gotoLine = lineNumber || parseInt(lineNumber);

                    return {
                        target: URI.fromFile(target),
                        targetType: isDir | isFile,
                        pinned: isPinned,
                        gotoLine: gotoLine,
                    };
                }, 
                error => {
                    ErrorHandler.onUnexpectedError(error);
                    return undefined;
                }
            );
    }

    private __serialize(target: IRecentOpenedTarget): string {
        const type = target.targetType === FileType.DIRECTORY 
            ? 'directory' 
            : target.targetType === FileType.FILE 
                ? 'file' 
                : 'unknown';
        
        const attributes = {
            targetType: type,
            pinned: target.pinned,
            gotoLine: target.gotoLine,
        };

        const attributesRaw = Strings.stringifySafe(attributes, err => ErrorHandler.onUnexpectedError(err), undefined, '');
        const serialized = `${URI.toFsPath(target.target)}|${attributesRaw}`;

        return serialized;
    }
}