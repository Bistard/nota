import { Time } from "src/base/common/date";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { AsyncResult, ok } from "src/base/common/result";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationError } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { jsonSafeStringify, jsonSafeParse } from "src/base/common/json";
import { ILogService } from "src/base/common/logger";
import { ResourceMap } from "src/base/common/structures/map";
import { Arrays } from "src/base/common/utilities/array";
import { UnbufferedScheduler } from "src/base/common/utilities/async";
import { generateMD5Hash } from "src/base/common/utilities/hash";
import { CompareOrder } from "src/base/common/utilities/type";
import { IFileService } from "src/platform/files/common/fileService";
import { IFileItem, defaultFileItemCompareFn } from "src/workbench/services/fileTree/fileItem";

/**
 * @internal
 */
const enum Resources {
    Accessed,
    Scheduler,
    Order
}

export const enum OrderChangeType {
    Add,
    Remove,
    Update,
    Swap
}

/**
 * An interface only for {@link FileTreeCustomSorter}
 */
export interface IFileTreeCustomSorter<TItem extends IFileItem<TItem>> extends IDisposable {

    /**
     * @description Compares two file tree items based on a custom sort order or
     * the default comparison function if no custom order is defined.
     * @param a The first file tree item
     * @param b The second file tree item
     * @returns negative, 0, positive int if a is ahead, same place, after b 
     */
    compare(a: TItem, b: TItem): number;

    /**
     * @description // TODO
     */
    changeMetadataBy(changeType: OrderChangeType, item: TItem, index1: number, index2: number | undefined): AsyncResult<void, FileOperationError | SyntaxError>

    /**
     * @description // TODO
     * @note Only invoke this when the folder is never synced (first time call)
     */
    syncMetadataWithDiskState(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError>;
}

export class FileTreeCustomSorter<TItem extends IFileItem<TItem>> extends Disposable implements IFileTreeCustomSorter<TItem> {
    
    // [fields]

    private readonly _metadataRootPath: URI;
    private readonly _metadataCache: ResourceMap<[
        recentAccessed: boolean,                // [0]
        clearTimeout: UnbufferedScheduler<URI>, // [1]
        orders: string[],                       // [2]
    ]>;
    private readonly _cacheClearDelay: Time;

    // [constructor]

    constructor(
        metadataRootPath: URI,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        this._metadataRootPath = metadataRootPath;
        this._metadataCache = new ResourceMap();
        this._cacheClearDelay = Time.min(5);
    }
    
    // [public methods]

    public compare(a: TItem, b: TItem): CompareOrder {
        const parent = a.parent!;

        const order = this.__getMetadataFromCache(parent.uri);
        if (order === undefined) {
            return defaultFileItemCompareFn(a, b);
        }

        const indexA = order.indexOf(a.name);
        const indexB = order.indexOf(b.name);

        // Both item are found in the order, we compare them easily.
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        } 
        // Item B order info is not found, we put B at the end by default.
        else if (indexA !== -1) {
            this.logService.warn('FileTreeCustomSorter', 'ItemA is missing in custom order file');
            return CompareOrder.First;
        } 
        // Item A order info is not found, we put A at the end by default.
        else if (indexB !== -1) {
            this.logService.warn('FileTreeCustomSorter', 'ItemB is missing in custom order file');
            return CompareOrder.Second;
        } 
        // Both items are not found, item A and B will be sort as default.
        else {
            return defaultFileItemCompareFn(a, b);
        }
    }

    // item.parent is gurrented not undefined
    public changeMetadataBy(changeType: OrderChangeType, item: TItem, index1: number, index2: number | undefined): AsyncResult<void, FileOperationError | SyntaxError> {
        const parent = item.parent!;
        
        const order = this._metadataCache.has(parent.uri);
        if (order === true) {
            this.__changeOrderBasedOnType(changeType, item, index1, index2);
            return this.__saveSortOrder(parent);
        }

        return this.__loadOrderIntoCache(parent)
        .andThen(() => {
            this.__changeOrderBasedOnType(changeType, item, index1, index2);
            return this.__saveSortOrder(parent);
        });
    }

    public syncMetadataWithDiskState(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        const inCache = this._metadataCache.get(folder.uri);
        if (inCache) {
            return AsyncResult.ok();
        }
        
        return this.__loadOrderIntoCache(folder)
        .andThen(() => {
            const parentUri = folder.uri;
            const currentFiles = folder.children;
            
            const resource = this._metadataCache.get(parentUri)!;
            const existingOrder = resource[Resources.Order];

            const inCacheItems = new Set(existingOrder);
            const inDiskItems = new Set(currentFiles.map(item => item.name));

            // Update the sort order
            // TODO: perf - too many array iteration here, should be able to optimize.
            // TODO: bad readability
            const updatedSortOrder = existingOrder.filter(item => inDiskItems.has(item))
                .concat(currentFiles.filter(item => !inCacheItems.has(item.name)).map(item => item.name));

            // update to the cache
            resource[Resources.Order] = updatedSortOrder;
            resource[Resources.Accessed] = false;
            resource[Resources.Scheduler].schedule(parentUri); // reschedule

            // TODO: if no changes, no need to save to disk.

            return this.__saveSortOrder(folder);
        });
    }   
    
    // [private helper methods]

    private __getMetadataFromCache(uri: URI): string[] | undefined {
        const resource = this._metadataCache.get(uri);
        if (resource === undefined) {
            return undefined;
        }

        resource[Resources.Accessed] = true;
        return resource[Resources.Order];
    }

    /**
     * @description Check if the given folder has corresponding metadata file.
     * @returns A URI points to either the existing file or the newly created one.
     */
    private __findOrCreateMetadataFile(folder: TItem): AsyncResult<URI, FileOperationError | SyntaxError> {
        const hashCode = generateMD5Hash(URI.toString(folder.uri));
        const orderFileName = hashCode.slice(2) + '.json';
        const orderFileURI = URI.join(this._metadataRootPath, hashCode.slice(0, 2), orderFileName);

        return this.fileService.exist(orderFileURI)
        .andThen(existed => {

            // order file founded, we do nothing.
            if (existed) {
                return ok(orderFileURI);
            }

            // the order file does not exist, we need to create a new one.
            const defaultOrder = [...folder.children]
                .sort(defaultFileItemCompareFn)
                .map(item => item.name);
            
            // write to disk with the default order
            return jsonSafeStringify(defaultOrder, undefined, 4)
            .toAsync()
            .andThen(parsed => this.fileService.createFile(orderFileURI, DataBuffer.fromString(parsed))
                .map(() => orderFileURI));
        });
    }

    /**
     * @description Only invoke this function when the corresponding folder has
     * no cache in the memory.
     */
    private __loadOrderIntoCache(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.__findOrCreateMetadataFile(folder)
        .andThen(orderFileURI => this.fileService.readFile(orderFileURI))
        .andThen(buffer => jsonSafeParse<string[]>(buffer.toString()))
        .andThen(order => {
            const scheduler = new UnbufferedScheduler<URI>(this._cacheClearDelay, 
                (() => {
                    const resource = this._metadataCache.get(folder.uri);
                    if (resource === undefined) {
                        return;
                    }
                    if (resource[Resources.Accessed] === true) {
                        resource[Resources.Accessed] = false;
                        scheduler.schedule(folder.uri);
                    } else {
                        this._metadataCache.delete(folder.uri);
                    }
                }));
            this._metadataCache.set(folder.uri, [false, scheduler, order]);
            scheduler.schedule(folder.uri);
            return ok();
        });
    }

    private __saveSortOrder(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {        
        
        // TODO: exist?
        
        // BUG: non-exist in memory when invoking this function
        return this.__findOrCreateMetadataFile(folder)
        .andThen(orderFileURI => jsonSafeStringify(this.__getMetadataFromCache(folder.uri), undefined, 4)
            .toAsync()
            .andThen((stringify => this.fileService.writeFile(orderFileURI, DataBuffer.fromString(stringify), { create: false, overwrite: true, }))));
    }

    private __changeOrderBasedOnType(changeType: OrderChangeType, item: TItem, index1: number, index2: number | undefined): void {
        const order = this.__getMetadataFromCache(item.parent!.uri)!;
        switch (changeType) {
            case OrderChangeType.Add:
                order.splice(index1, 0, item.name);
                break;
            case OrderChangeType.Remove:
                order.splice(index1, 1);
                break;
            case OrderChangeType.Swap:
                if (index2 === undefined) {
                    return;
                }
                Arrays.swap(order, index1, index2);
                break;
            case OrderChangeType.Update:
                order[index1] = item.name;
                break;
        }
    }
}