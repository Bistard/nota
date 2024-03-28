import { Time } from "src/base/common/date";
import { Disposable } from "src/base/common/dispose";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationError } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { jsonSafeParse, jsonSafeStringify } from "src/base/common/json";
import { ILogService } from "src/base/common/logger";
import { noop } from "src/base/common/performance";
import { AsyncResult, err, ok } from "src/base/common/result";
import { ResourceMap } from "src/base/common/structures/map";
import { Arrays } from "src/base/common/utilities/array";
import { UnbufferedScheduler } from "src/base/common/utilities/async";
import { assert, panic } from "src/base/common/utilities/panic";
import { Comparator } from "src/base/common/utilities/type";
import { IFileService } from "src/platform/files/common/fileService";
import { FileItem, IFileTarget } from "src/workbench/services/fileTree/fileItem";
import { IFileTreeCustomSorterOptions } from "src/workbench/services/fileTree/fileTreeCustomSorter";
import { FileSortType, FileTreeSorter } from "src/workbench/services/fileTree/fileTreeSorter";
import { IFileTreeMetadataService } from "src/workbench/services/fileTree/treeService";

/**
 * Enumerates the types of modifications to the custom sort order of file tree 
 * items, including adding, removing, updating, or swapping positions.
 *
 * - `Add`: Indicates that an item is being added to the order.
 * - `Remove`: Indicates that an item is being removed from the order.
 * - `Update`: Indicates that an existing item's position is being updated in the order.
 * - `Swap`: Indicates that two items are swapping positions within the order.
 * - `Move`: Indicates that items are being moved to a new index within the order.
 */
export const enum OrderChangeType {
    Add,
    Remove,
    Update,
    Swap,
    Move,
}

/**
 * An option for {@link FileTreeMetadataController}.
 */
export interface IFileTreeMetadataControllerOptions extends IFileTreeCustomSorterOptions {
    readonly metadataRootPath: URI;
    readonly hash: (input: string) => string;
}

/**
 * @internal
 */
const enum Resources {
    Scheduler,
    Order
}

export class FileTreeMetadataController extends Disposable implements IFileTreeMetadataService {

    declare _serviceMarker: undefined;

    // [fields]

    private _sorter: FileTreeSorter<FileItem>;
    
    /**
     * The root path for all metadata directories.
     */
    private readonly _metadataRoot: URI;
    private readonly _metadataCache: ResourceMap<[
        clearTimeout: UnbufferedScheduler<URI>, // [1]
        orders: string[],                       // [2]
    ]>;
    private readonly _cacheClearDelay: Time;
    private readonly _hash: (input: string) => string;
    private readonly _defaultItemComparator: Comparator<IFileTarget>;

    // [constructor]

    constructor(
        sorter: FileTreeSorter<FileItem>,
        opts: IFileTreeMetadataControllerOptions,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        this._sorter = sorter;
        this._metadataCache = new ResourceMap();
        this._cacheClearDelay = Time.min(5);

        this._metadataRoot = opts.metadataRootPath;
        this._hash = opts.hash;
        this._defaultItemComparator = opts.defaultItemComparator;

        this.logService.debug('FileTreeMetadataController', 'FileTreeMetadataController constructed.');
    }

    // [public methods]

    public getMetadataFromCache(dirUri: URI): string[] | undefined {
        this.__assertCustomMode();

        const resource = this._metadataCache.get(dirUri);
        if (resource === undefined) {
            return undefined;
        }

        // TODO: perf - use recentAccess instead of simply schedule out, setTimeout is really time consuming
        // TODO: or simply universally check every 5min, clean all the metadata that has not been accessed during the 5min.
        resource[Resources.Scheduler].schedule(dirUri);
        return resource[Resources.Order];
    }

    public isDirectoryMetadataExist(dirUri: URI): AsyncResult<boolean, FileOperationError> {
        this.__assertCustomMode();
        const metadataURI = this.__computeMetadataURI(dirUri);
        return this.fileService.exist(metadataURI);
    }

    public updateDirectoryMetadata(oldDirUri: URI, destination: URI, cutOrCopy: boolean): AsyncResult<void, Error | FileOperationError> {
        this.__assertCustomMode();

        const oldMetadataURI = this.__computeMetadataURI(oldDirUri);
        return this.fileService.exist(oldMetadataURI)
            .andThen(exist => {
                if (!exist) {
                    return ok();
                }
                
                const newMetadataURI = this.__computeMetadataURI(destination);
                const operation = cutOrCopy 
                    ? this.fileService.moveTo 
                    : this.fileService.copyTo;
                return operation.call(this.fileService, oldMetadataURI, newMetadataURI, false).map(noop);
            });
    }

    public syncMetadataInCacheWithDisk(folderUri: URI, folderChildren: IFileTarget[]): AsyncResult<void, FileOperationError | Error> {
        this.__assertCustomMode();
        
        const inCache = this._metadataCache.get(folderUri);
        if (inCache) {
            return AsyncResult.ok();
        }
        
        return this.__loadMetadataIntoCache(folderUri, folderChildren)
        .andThen(() => {
            const parentUri    = folderUri;
            const currentFiles = folderChildren.map(child => child.name);
            
            const resource      = assert(this._metadataCache.get(parentUri));
            const existingOrder = resource[Resources.Order];

            // faster lookups
            const inCacheItems = new Set(existingOrder);
            const inDiskItems  = new Set(currentFiles);
            
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
            for (const item of currentFiles) {
                if (!inCacheItems.has(item)) {
                    updatedSortOrder.push(item);
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

            return this.__saveMetadataIntoDisk(folderUri);
        });
    }

    public updateCustomSortingMetadata(type: OrderChangeType.Add   , item: FileItem, index1:  number                ): AsyncResult<void, FileOperationError | Error>;
    public updateCustomSortingMetadata(type: OrderChangeType.Remove, item: FileItem, index1?: number                ): AsyncResult<void, FileOperationError | Error>;
    public updateCustomSortingMetadata(type: OrderChangeType.Update, item: FileItem, index1:  number                ): AsyncResult<void, FileOperationError | Error>;
    public updateCustomSortingMetadata(type: OrderChangeType.Swap  , item: FileItem, index1:  number, index2: number): AsyncResult<void, FileOperationError | Error>;
    public updateCustomSortingMetadata(type: OrderChangeType       , item: FileItem, index1?: number, index2?: number): AsyncResult<void, FileOperationError | Error> {
        this.__assertCustomMode();

        const parent = assert(item.parent);
        const inCache = this._metadataCache.has(parent.uri);
        
        const preparation = inCache 
            ? AsyncResult.ok<void, FileOperationError>()
            : this.__loadMetadataIntoCache(parent.uri, parent.children);

        return preparation
        .andThen(() => {
            this.__updateMetadataInCache(type, parent.uri, item.name, index1, index2);
            return this.__saveMetadataIntoDisk(parent.uri);
        });
    }

    public updateCustomSortingMetadataLot(type: OrderChangeType.Add   , parent: URI, items: string[], indice:  number[]): AsyncResult<void, FileOperationError | Error>;
    public updateCustomSortingMetadataLot(type: OrderChangeType.Update, parent: URI, items: string[], indice:  number[]): AsyncResult<void, FileOperationError | Error>;
    public updateCustomSortingMetadataLot(type: OrderChangeType.Remove, parent: URI, items: null,     indice:  number[]): AsyncResult<void, FileOperationError | Error>;
    public updateCustomSortingMetadataLot(type: OrderChangeType.Move,   parent: URI, items: null,     indice:  number[], destination: number): AsyncResult<void, FileOperationError | Error>;
    public updateCustomSortingMetadataLot(type: any, parent: URI, items: any, indice: number[], destination?: any): AsyncResult<void, FileOperationError | Error> {
        this.__assertCustomMode();
        
        if (type === OrderChangeType.Swap) {
            return AsyncResult.err(new Error('[FileTreeCustomSorter] does not support "swap" operation in "updateMetadataLot"'));
        }
        const resolvedItems = items ?? [];

        // add & update
        if (type === OrderChangeType.Add || type === OrderChangeType.Update) {
            if (resolvedItems.length === 0) {
                return AsyncResult.ok();
            }
    
            if (resolvedItems.length !== indice.length) {
                return AsyncResult.err(new Error('[FileTreeCustomSorter] "updateMetadataLot" items and indice must have same length'));
            }
        }

        // load metadata to the cache first
        const inCache = this._metadataCache.has(parent);
        const preparation = inCache 
            ? AsyncResult.ok<void, FileOperationError>()
            : this.__loadMetadataIntoCache(parent, false);

        return preparation
            .andThen(() => {
                // update metadata all in once
                this.__updateMetadataInCacheLot(type, parent, resolvedItems, indice, destination);
                return this.__saveMetadataIntoDisk(parent);
            });
    }

    // [private helper methods]

    private __assertCustomMode(): void {
        if (this._sorter.sortType !== FileSortType.Custom) {
            panic(new Error('[FileTreeService] cannot update custom sorting metadata since it is not in custom sorting mode.'));
        }
    }

    /**
     * @description Check if the given folder has corresponding metadata file.
     * @param folderUri The folder to load.
     * @param folderChildren The initial children if need to create a new metadata.
     * @returns A URI points to either the existing file or the newly created one.
     */
    private __findOrCreateMetadataFile(folderUri: URI, expectExist: boolean, folderChildren: IFileTarget[] | null): AsyncResult<URI, FileOperationError | SyntaxError> {
        const metadataURI = this.__computeMetadataURI(folderUri);

        return this.fileService.exist(metadataURI)
        .andThen(existed => {

            // order file founded, we do nothing.
            if (existed) {
                return ok(metadataURI);
            }

            if (expectExist) {
                return err(new Error(`Expect the metadata file to be exist. The corresponding folder URI is: ${URI.toString(folderUri)}`));
            }

            // the order file does not exist, we need to create a new one.
            const defaultOrder = (folderChildren ?? [])
                .sort(this._defaultItemComparator)
                .map(target => target.name);
            
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
     * @param folderUri The folder to load.
     * @param expectExist Expect the corresponding metadata file exist, otherwise error is returned.
     * @param folderChildren The initial children if need to create a new metadata.
     */
    private __loadMetadataIntoCache(folderUri: URI, expectExist: boolean): AsyncResult<void, FileOperationError | Error>;
    private __loadMetadataIntoCache(folderUri: URI, folderChildren: IFileTarget[]): AsyncResult<void, FileOperationError | Error>;
    private __loadMetadataIntoCache(folderUri: URI, existOrChildren: IFileTarget[] | boolean): AsyncResult<void, FileOperationError | Error> {
        const isArray = Array.isArray(existOrChildren);
        const expectExist =      isArray ? false           : existOrChildren;
        const resolvedChildren = isArray ? existOrChildren : null;
        
        return this.__findOrCreateMetadataFile(folderUri, expectExist, resolvedChildren)
            .andThen(orderFileURI => this.fileService.readFile(orderFileURI))
            .andThen(buffer => jsonSafeParse<string[]>(buffer.toString()))
            .andThen(order => {
                const scheduler = this.__register(new UnbufferedScheduler<URI>(
                    this._cacheClearDelay, 
                    () => this._metadataCache.delete(folderUri),
                ));
                this._metadataCache.set(folderUri, [scheduler, order]);
                scheduler.schedule(folderUri);
                return ok();
            });
    }

    /**
     * @note MAKE SURE the metadata of the given folder is already in cache.
     */
    private __saveMetadataIntoDisk(folder: URI): AsyncResult<void, FileOperationError | Error> {        
        const metadataURI = this.__computeMetadataURI(folder);
        const metadata = assert(this.getMetadataFromCache(folder));
        
        return jsonSafeStringify(metadata, undefined, 4).toAsync()
            .andThen(stringify => this.fileService.writeFile(metadataURI, DataBuffer.fromString(stringify), { create: true, overwrite: true, }));
    }

    /**
     * @note invoke this to MAKE SURE:
     *  - the given item has parent.
     *  - the metadata of the parent already in the cache.
     */
    private __updateMetadataInCache(type: OrderChangeType, parentUri: URI, itemName: string, index1?: number, index2?: number): void {
        const order = assert(this.getMetadataFromCache(parentUri));
        switch (type) {
            case OrderChangeType.Add:
                order.splice(index1!, 0, itemName);
                break;
            case OrderChangeType.Remove:
                Arrays.remove(order, itemName, index1);
                break;
            case OrderChangeType.Swap:
                Arrays.swap(order, index1!, index2!);
                break;
            case OrderChangeType.Update:
                order[index1!] = itemName;
                break;
        }
    }

    /**
     * @note invoke this to MAKE SURE:
     *  - the given item array is not empty.
     *  - the metadata of the parent already in the cache.
     */
    private __updateMetadataInCacheLot(type: OrderChangeType, parent: URI, itemNames: string[], index1: number[], index2?: number): void {
        const order = assert(this.getMetadataFromCache(parent));
        switch (type) {
            case OrderChangeType.Add:
                Arrays.insertMultiple(order, itemNames, index1);
                break;
            case OrderChangeType.Update:
                Arrays.parallelEach([itemNames, index1], (name, index) => {
                    order[index] = name;
                });
                break;
            case OrderChangeType.Remove:
                Arrays.removeByIndex(order, index1, true);
                break;
            case OrderChangeType.Move:
                Arrays.relocateByIndex(order, index1, index2!);
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
     *      - `_metadataRoot` is '/metadata' 
     *      - and the uri is 'https://example.com/path'
     * The resulting metadata URI might be '/metadata/3f/4c9b6f3a.json', if 
     * assuming the hash is '3f4c9b6f3a'.
     */
    private __computeMetadataURI(uri: URI): URI {
        const hashCode = this._hash(URI.toString(uri));
        const orderFileName = hashCode.slice(2) + '.json';
        const metadataURI = URI.join(this._metadataRoot, hashCode.slice(0, 2), orderFileName);
        return metadataURI;
    }
}