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
import { Comparator, CompareOrder } from "src/base/common/utilities/type";
import { IFileService } from "src/platform/files/common/fileService";
import { IFileItem } from "src/workbench/services/fileTree/fileItem";
import { panic } from "src/base/common/utilities/panic";

/**
 * Enumerates the types of modifications to the custom sort order of file tree 
 * items, including adding, removing, updating, or swapping positions.
 *
 * - `Add`: Indicates that an item is being added to the order.
 * - `Remove`: Indicates that an item is being removed from the order.
 * - `Update`: Indicates that an existing item's position is being updated in the order.
 * - `Swap`: Indicates that two items are swapping positions within the order.
 */
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
     * @param type The type of change to apply to the order metadata.
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
    updateMetadata(type: OrderChangeType.Add   , item: TItem, index1:  number                ): AsyncResult<void, FileOperationError | SyntaxError>;
    updateMetadata(type: OrderChangeType.Remove, item: TItem, index1?: number                ): AsyncResult<void, FileOperationError | SyntaxError>;
    updateMetadata(type: OrderChangeType.Update, item: TItem, index1:  number                ): AsyncResult<void, FileOperationError | SyntaxError>;
    updateMetadata(type: OrderChangeType.Swap  , item: TItem, index1:  number, index2: number): AsyncResult<void, FileOperationError | SyntaxError>;
    
    
    /**
     * @description Handles batch updates to the metadata based on the specified 
     * change type. 
     * 
     * @note It is more efficient than updating each item individually, 
     *       especially for large batches.
     * @note It does not support type 'swap' since every swap operation will 
     *       mess up the input indice relationship. Due to simplicity, it is 
     *       banned.
     * 
     * @param type The type of change to apply to the order metadata.
     * @param items An array of file tree items to the batch change.
     * @param parent Only support for 'Remove', indicates the parent of children
     *               for removing.
     * @param indice For 'Add' and 'Update', this is the index where the item is 
     *               added or updated. For 'Remove', it's the index of the item 
     *               to remove.
     * 
     * @panic 
     *  - When the `items` and `indice` length do not match for 'Add' and 
     *      'Update' types. 
     *  - Also panics if the 'Swap' type is used.
     */
    updateMetadataLot(type: OrderChangeType.Add   , items: TItem[], indice:  number[]): AsyncResult<void, FileOperationError | SyntaxError>;
    updateMetadataLot(type: OrderChangeType.Update, items: TItem[], indice:  number[]): AsyncResult<void, FileOperationError | SyntaxError>;
    updateMetadataLot(type: OrderChangeType.Remove, parent: TItem, indice:  number[]): AsyncResult<void, FileOperationError | SyntaxError>;

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

export interface IFileTreeCustomSorterOptions<TItem extends IFileItem<TItem>> {
    readonly metadataRootPath: URI;
    readonly hash: (input: string) => string;
    readonly defaultComparator: Comparator<TItem>;
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

    /**
     * The root path for all metadata directories.
     */
    private readonly _metadataRootPath: URI;
    private readonly _metadataCache: ResourceMap<[
        clearTimeout: UnbufferedScheduler<URI>, // [1]
        orders: string[],                       // [2]
    ]>;
    private readonly _cacheClearDelay: Time;
    private readonly _hash: (input: string) => string;
    private readonly _defaultComparator: Comparator<TItem>;

    // [constructor]

    constructor(
        opts: IFileTreeCustomSorterOptions<TItem>,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        this._metadataRootPath = opts.metadataRootPath;
        this._metadataCache = new ResourceMap();
        this._cacheClearDelay = Time.min(5);
        this._hash = opts.hash;
        this._defaultComparator = opts.defaultComparator;
    }
    
    // [public methods]

    public compare(a: TItem, b: TItem): CompareOrder {
        const parent = a.parent!;

        const order = this.__getMetadataFromCache(parent.uri);
        if (order === undefined) {
            return this._defaultComparator(a, b);
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
            return this._defaultComparator(a, b);
        }
    }

    public updateMetadata(type: OrderChangeType.Add   , item: TItem, index1:  number                 ): AsyncResult<void, FileOperationError | SyntaxError>;
    public updateMetadata(type: OrderChangeType.Remove, item: TItem, index1?: number                 ): AsyncResult<void, FileOperationError | SyntaxError>;
    public updateMetadata(type: OrderChangeType.Update, item: TItem, index1:  number                 ): AsyncResult<void, FileOperationError | SyntaxError>;
    public updateMetadata(type: OrderChangeType.Swap  , item: TItem, index1:  number, index2:  number): AsyncResult<void, FileOperationError | SyntaxError>;
    public updateMetadata(type: OrderChangeType       , item: TItem, index1?: number, index2?: number): AsyncResult<void, FileOperationError | SyntaxError> {
        const parent = item.parent!;
        const inCache = this._metadataCache.has(parent.uri);
        
        const preparation = inCache 
            ? AsyncResult.ok<void, FileOperationError | SyntaxError>()
            : this.__loadMetadataIntoCache(parent);

        return preparation
        .andThen(() => {
            this.__updateMetadataInCache(type, parent, item, index1, index2);
            return this.__saveMetadataIntoDisk(parent);
        });
    }

    public updateMetadataLot(type: OrderChangeType.Add   , items: TItem[], indice:  number[]): AsyncResult<void, FileOperationError | SyntaxError>;
    public updateMetadataLot(type: OrderChangeType.Update, items: TItem[], indice:  number[]): AsyncResult<void, FileOperationError | SyntaxError>;
    public updateMetadataLot(type: OrderChangeType.Remove, parent: TItem,  indice:  number[]): AsyncResult<void, FileOperationError | SyntaxError>;
    public updateMetadataLot(type: OrderChangeType, itemsOrParent: TItem[] | TItem, indice: number[]): AsyncResult<void, FileOperationError | SyntaxError> {
        if (type === OrderChangeType.Swap) {
            panic('[FileTreeCustomSorter] does not support "update" operation in "updateMetadataLot"');
        }
        
        const isRemove = !Array.isArray(itemsOrParent);
        let resolvedParent: TItem;
        let resolvedItems: TItem[];

        // remove operation (items does not matter when removing, indice matters)
        if (isRemove) {
            resolvedParent = itemsOrParent;
            resolvedItems = [];
        } 
        // necessary check for non-remove operation
        else {
            const items = itemsOrParent;
            resolvedItems = items;

            if (items.length === 0) {
                return AsyncResult.ok();
            }
    
            if (items.length !== indice.length) {
                panic('[FileTreeCustomSorter] "updateMetadataLot" items and indice must have same length');
            }
    
            // make sure every item all have the same parent
            resolvedParent = items[0]!.parent!;
            const allSameParent = items.every(item => item.parent === resolvedParent);
            if (!allSameParent) {
                panic('[FileTreeCustomSorter] "updateMetadataLot" items must have all the same parent');
            }
        }

        // load metadata to the cache first
        const inCache = this._metadataCache.has(resolvedParent.uri);
        const preparation = inCache 
            ? AsyncResult.ok<void, FileOperationError | SyntaxError>()
            : this.__loadMetadataIntoCache(resolvedParent);
        
        return preparation
        .andThen(() => {
            // update metadata all in once
            this.__updateMetadataInCacheLot(type, resolvedParent, resolvedItems, indice);
            return this.__saveMetadataIntoDisk(resolvedParent);
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

            return this.__saveMetadataIntoDisk(folder);
        });
    }
    
    // [private helper methods]

    private __getMetadataFromCache(uri: URI): string[] | undefined {
        const resource = this._metadataCache.get(uri);
        if (resource === undefined) {
            return undefined;
        }

        // TODO: perf - use recentAccess instead of simply schedule out, setTimeout is really time consuming
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
                .sort(this._defaultComparator)
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
                const scheduler = this.__register(new UnbufferedScheduler<URI>(
                    this._cacheClearDelay, 
                    () => this._metadataCache.delete(folder.uri),
                ));
                this._metadataCache.set(folder.uri, [scheduler, order]);
                scheduler.schedule(folder.uri);
                return ok();
            });
    }

    /**
     * @note MAKE SURE the metadata of the given folder is already in cache.
     */
    private __saveMetadataIntoDisk(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {        
        const metadataURI = this.__computeMetadataURI(folder.uri);
        const metadata = this.__getMetadataFromCache(folder.uri)!;
        
        return jsonSafeStringify(metadata, undefined, 4).toAsync()
            .andThen(stringify => this.fileService.writeFile(metadataURI, DataBuffer.fromString(stringify), { create: true, overwrite: true, }));
    }

    /**
     * @note invoke this to MAKE SURE:
     *  - the given item has parent.
     *  - the metadata of the parent already in the cache.
     */
    private __updateMetadataInCache(type: OrderChangeType, parent: TItem, item: TItem, index1?: number, index2?: number): void {
        const order = this.__getMetadataFromCache(parent.uri)!;
        switch (type) {
            case OrderChangeType.Add:
                order.splice(index1!, 0, item.name);
                break;
            case OrderChangeType.Remove:
                Arrays.remove(order, item.name, index1);
                break;
            case OrderChangeType.Swap:
                Arrays.swap(order, index1!, index2!);
                break;
            case OrderChangeType.Update:
                order[index1!] = item.name;
                break;
        }
    }

    /**
     * @note invoke this to MAKE SURE:
     *  - the given item array is not empty.
     *  - the metadata of the parent already in the cache.
     */
    private __updateMetadataInCacheLot(type: OrderChangeType, parent: TItem, items: TItem[], index1: number[]): void {
        const order = this.__getMetadataFromCache(parent.uri)!;
        switch (type) {
            case OrderChangeType.Add:
                Arrays.insertMultiple(order, items.map(item => item.name), index1);
                break;
            case OrderChangeType.Remove:
                Arrays.removeByIndex(order, index1, true);
                break;
            case OrderChangeType.Update: {
                Arrays.parallelEach([items, index1], (item, index) => {
                    order[index] = item.name;
                });
                break;
            }
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
        const hashCode = this._hash(URI.toString(uri));
        const orderFileName = hashCode.slice(2) + '.json';
        const metadataURI = URI.join(this._metadataRootPath, hashCode.slice(0, 2), orderFileName);
        return metadataURI;
    }
}