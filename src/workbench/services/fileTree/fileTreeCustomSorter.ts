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
     * @description Compares two file tree items to determine their relative 
     * order. The comparison is based on a custom sort order defined in the 
     * metadata. If no custom order is specified, a default comparison function 
     * is used.
     * 
     * @param a The first file tree item to compare.
     * @param b The second file tree item to compare.
     * @returns A negative value if `a` should appear before `b`, 
     *          zero if their order is equivalent,
     *          or a positive value if `a` should appear after `b`.
     */
    compare(a: TItem, b: TItem): CompareOrder;

    /**
     * @description Modifies the metadata based on the specified change type, 
     * such as adding, removing, updating, or swapping items in the custom order.
     * 
     * @param changeType The type of change to apply to the order metadata.
     * @param item The file tree item that is subject to the change.
     * @param index1 For 'Add' and 'Update', this is the index where the item is 
     *               added or updated. For 'Remove', it's the index of the item 
     *               to remove, and it's optional. For 'Swap', it's the index of 
     *               the first item to be swapped.
     * @param index2 For 'Swap', this is the index of the second item to be 
     *               swapped with the first. Not used for other change types.
     * 
     * @panic when missing the provided index1 or index2.
     */
    updateMetadata(changeType: OrderChangeType.Add, item: TItem, index1: number): AsyncResult<void, FileOperationError | SyntaxError>;
    updateMetadata(changeType: OrderChangeType.Remove, item: TItem, index1?: number): AsyncResult<void, FileOperationError | SyntaxError>;
    updateMetadata(changeType: OrderChangeType.Update, item: TItem, index1: number): AsyncResult<void, FileOperationError | SyntaxError>;
    updateMetadata(changeType: OrderChangeType.Swap, item: TItem, index1: number, index2: number): AsyncResult<void, FileOperationError | SyntaxError>;

    /**
     * @description Synchronizes the metadata in the cache for a given folder 
     * with the current state of its files on disk. 
     * @param folder The folder whose metadata needs to be synchronized with its 
     *               disk state.
     * 
     * @note This method aligns the metadata's custom sort order with the 
     *       current file arrangement on disk.
     * @note Invoke this only when the folder's metadata is not yet loaded into 
     *       memory.
     */
    syncMetadataInCacheWithDisk(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError>;
}

/**
 * @internal
 */
const enum Resources {
    Scheduler,
    Order
}

export class FileTreeCustomSorter<TItem extends IFileItem<TItem>> extends Disposable implements IFileTreeCustomSorter<TItem> {
    
    // [fields]

    private readonly _metadataRootPath: URI;
    private readonly _metadataCache: ResourceMap<[
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

    public updateMetadata(changeType: OrderChangeType.Add, item: TItem, index1: number): AsyncResult<void, FileOperationError | SyntaxError>;
    public updateMetadata(changeType: OrderChangeType.Remove, item: TItem, index1?: number): AsyncResult<void, FileOperationError | SyntaxError>;
    public updateMetadata(changeType: OrderChangeType.Update, item: TItem, index1: number): AsyncResult<void, FileOperationError | SyntaxError>;
    public updateMetadata(changeType: OrderChangeType.Swap, item: TItem, index1: number, index2: number): AsyncResult<void, FileOperationError | SyntaxError>;
    public updateMetadata(changeType: OrderChangeType, item: TItem, index1?: number, index2?: number): AsyncResult<void, FileOperationError | SyntaxError> {
        const parent = item.parent!;
        
        const order = this._metadataCache.has(parent.uri);
        if (order === true) {
            this.__changeOrderBasedOnType(changeType, item, index1, index2);
            return this.__saveSortOrder(parent);
        }

        return this.__loadMetadataIntoCache(parent)
        .andThen(() => {
            this.__changeOrderBasedOnType(changeType, item, index1, index2);
            return this.__saveSortOrder(parent);
        });
    }

    public syncMetadataInCacheWithDisk(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        const inCache = this._metadataCache.get(folder.uri);
        if (inCache) {
            return AsyncResult.ok();
        }
        
        return this.__loadMetadataIntoCache(folder)
        .andThen(() => {
            const parentUri = folder.uri;
            const currentFiles = folder.children;
            
            const resource = this._metadataCache.get(parentUri)!;
            const existingOrder = resource[Resources.Order];

            // faster lookups
            const inCacheItems = new Set(existingOrder);
            const inDiskItems = new Set(currentFiles.map(item => item.name));
            
            const updatedSortOrder: string[] = [];
            let hasChanges = false;

            // Keep items from the cache if they exist on disk
            for (const item of existingOrder) {
                if (inDiskItems.has(item)) {
                    updatedSortOrder.push(item);
                    continue;
                } 
                // found an item in cache that's not on disk
                hasChanges = true; 
            }

            // Add new items from disk that are not in cache
            for (const file of currentFiles) {
                if (!inCacheItems.has(file.name)) {
                    updatedSortOrder.push(file.name);
                    // found a new item on disk that is not in cache
                    hasChanges = true;
                }
            }

            // Update the cache only if there are changes
            if (!hasChanges) {
                return AsyncResult.ok();
            }

            resource[Resources.Order] = updatedSortOrder;
            resource[Resources.Scheduler].schedule(parentUri);

            return this.__saveSortOrder(folder);
        });
    }
    
    // [private helper methods]

    private __getMetadataFromCache(uri: URI): string[] | undefined {
        const resource = this._metadataCache.get(uri);
        if (resource === undefined) {
            return undefined;
        }

        resource[Resources.Scheduler].schedule(uri);
        return resource[Resources.Order];
    }

    /**
     * @description Check if the given folder has corresponding metadata file.
     * @returns A URI points to either the existing file or the newly created one.
     */
    private __findOrCreateMetadataFile(folder: TItem): AsyncResult<URI, FileOperationError | SyntaxError> {
        const metadataURI = this.__computeMetadataURI(folder.uri);

        return this.fileService.exist(metadataURI)
        .andThen(existed => {

            // order file founded, we do nothing.
            if (existed) {
                return ok(metadataURI);
            }

            // the order file does not exist, we need to create a new one.
            const defaultOrder = [...folder.children]
                .sort(defaultFileItemCompareFn)
                .map(item => item.name);
            
            // write to disk with the default order
            return jsonSafeStringify(defaultOrder, undefined, 4)
            .toAsync()
            .andThen(parsed => this.fileService.createFile(metadataURI, DataBuffer.fromString(parsed))
                .map(() => metadataURI));
        });
    }

    /**
     * @description Only invoke this function when the corresponding folder has
     * no cache in the memory.
     */
    private __loadMetadataIntoCache(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.__findOrCreateMetadataFile(folder)
            .andThen(orderFileURI => this.fileService.readFile(orderFileURI))
            .andThen(buffer => jsonSafeParse<string[]>(buffer.toString()))
            .andThen(order => {
                const scheduler = new UnbufferedScheduler<URI>(
                    this._cacheClearDelay, 
                    () => this._metadataCache.delete(folder.uri),
                );
                this._metadataCache.set(folder.uri, [scheduler, order]);
                scheduler.schedule(folder.uri);
                return ok();
            });
    }

    /**
     * @note MAKE SURE the metadata of the given folder is already in cache.
     */
    private __saveSortOrder(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {        
        const metadataURI = this.__computeMetadataURI(folder.uri);
        return jsonSafeStringify(this.__getMetadataFromCache(folder.uri), undefined, 4).toAsync()
            .andThen(stringify => this.fileService.writeFile(metadataURI, DataBuffer.fromString(stringify), { create: true, overwrite: true, }));
    }

    private __changeOrderBasedOnType(changeType: OrderChangeType, item: TItem, index1?: number, index2?: number): void {
        const order = this.__getMetadataFromCache(item.parent!.uri)!;
        switch (changeType) {
            case OrderChangeType.Add:
                order.splice(index1!, 0, item.name);
                break;
            case OrderChangeType.Remove: {
                Arrays.remove(order, item.name, index1);
                break;
            } case OrderChangeType.Swap:
                Arrays.swap(order, index1!, index2!);
                break;
            case OrderChangeType.Update:
                order[index1!] = item.name;
                break;
        }
    }

    /**
     * @description Computes and returns the metadata URI for a given resource URI by 
     * generating a hash from the resource URI and using it to construct a 
     * structured file path within the metadata directory.
     * 
     * @example
     * Assuming:
     *      - `_metadataRootPath` is '/metadata' 
     *      - and the uri is 'https://example.com/path'
     * The resulting metadata URI might be '/metadata/3f/4c9b6f3a.json', if 
     * assuming the hash is '3f4c9b6f3a'.
     */
    private __computeMetadataURI(uri: URI): URI {
        const hashCode = generateMD5Hash(URI.toString(uri));
        const orderFileName = hashCode.slice(2) + '.json';
        const metadataURI = URI.join(this._metadataRootPath, hashCode.slice(0, 2), orderFileName);
        return metadataURI;
    }
}