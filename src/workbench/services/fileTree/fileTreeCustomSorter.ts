import { Time } from "src/base/common/date";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { AsyncResult, ok } from "src/base/common/result";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationError } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { jsonSafeStringify, jsonSafeParse } from "src/base/common/json";
import { ILogService } from "src/base/common/logger";
import { noop } from "src/base/common/performance";
import { ResourceMap } from "src/base/common/structures/map";
import { Arrays } from "src/base/common/utilities/array";
import { UnbufferedScheduler } from "src/base/common/utilities/async";
import { generateMD5Hash } from "src/base/common/utilities/hash";
import { CompareOrder } from "src/base/common/utilities/type";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { IFileService } from "src/platform/files/common/fileService";
import { IFileItem, defaultFileItemCompareFn } from "src/workbench/services/fileTree/fileItem";

/**
 * @internal
 */
const enum ResourceType {
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
     * @description TODO:
     */
    orderChange(changeType: OrderChangeType, item: TItem, index1: number, index2: number | undefined): AsyncResult<void, FileOperationError | SyntaxError>

    /**
     * @description Synchronizes the custom sort order with a current set of 
     * file tree items.
     * @param folder The folder to be synced
     * @param currentFiles an unordered array of current files under the folder
     */
    syncOrderFile(folder: TItem, currentFiles: TItem[]): AsyncResult<void, FileOperationError | SyntaxError>;

    /**
     * @description Attempts to load the custom sort order for a given folder.
     * Errors will be logged out instead of returned as Result.
     */
    safeLoadSortOrder(folder: TItem): Promise<void>;
}

export class FileTreeCustomSorter<TItem extends IFileItem<TItem>> extends Disposable implements IFileTreeCustomSorter<TItem> {
    
    // [fields]

    private readonly _orderRootPath: URI;

    // TODO: need a detailed documentation on this field
    private readonly _orderCache: ResourceMap<[boolean, UnbufferedScheduler<URI>, string[]]>;
    private readonly _delay: Time;

    // [constructor]

    constructor(
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        this._orderCache = new ResourceMap();
        this._delay = Time.min(5);
        this._orderRootPath = URI.join(this.environmentService.appConfigurationPath, 'sortings');
    }
    
    // [public methods]

    // The following TItem.parent are definitely not null, as those following
    // function can only be called when TItem.parent is at collaped state
    public compare(a: TItem, b: TItem): CompareOrder {
        const parent = a.parent!;

        const order = this.__getOrderFromCache(parent.uri);
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
            this.logService.error('FileTreeCustomSorter', 'ItemA is missing in custom order file');
            return CompareOrder.First;
        } 
        // Item A order info is not found, we put A at the end by default.
        else if (indexB !== -1) {
            this.logService.error('FileTreeCustomSorter', 'ItemB is missing in custom order file');
            return CompareOrder.Second;
        } 
        /**
         * Both items are not found, item A and B will be sort as default.
         * @see defaultFileItemCompareFn
         */
        else {
            return defaultFileItemCompareFn(a, b);
        }
    }

    // APIs for fileTree Item Adding and Deleting
    // item.parent is gurrented not undefined
    public orderChange(changeType: OrderChangeType, item: TItem, index1: number, index2: number | undefined): AsyncResult<void, FileOperationError | SyntaxError> {
        const order = this._orderCache.has(item.parent!.uri);
        if (order === true) {
            this.__changeOrderBasedOnType(changeType, item, index1, index2);
            return this.__saveSortOrder(item.parent!);
        }
        return this.__loadOrderIntoCache(item.parent!)
        .andThen(() => {
            this.__changeOrderBasedOnType(changeType, item, index1, index2);
            return this.__saveSortOrder(item.parent!);
        });
    }

    // TODO: compare the given array with the exsiting order array
    // Updates custom sort order items based on provided array of new items
    public syncOrderFile(parentItem: TItem, newItems: TItem[]): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.__loadOrderIntoCache(parentItem)
        .andThen(() => {
            const parentUri = parentItem.uri;
            const resource = this._orderCache.get(parentUri);
            
            // Use an empty array if the resource is undefined
            const existingOrder = resource ? resource[ResourceType.Order] : [];
            const newItemNames = new Set(newItems.map(item => item.name));
            const existingItemSet = new Set(existingOrder);

            // Update the sort order
            const updatedSortOrder = existingOrder.filter(item => newItemNames.has(item))
                .concat(newItems.filter(item => !existingItemSet.has(item.name)).map(item => item.name));

            // FIX: duplicate creating `new UnbufferedScheduler`
            const scheduler = resource?.[ResourceType.Scheduler] ?? new UnbufferedScheduler<URI>(this._delay, 
                () => {
                    const res = this._orderCache.get(parentUri);
                    if (res && res[ResourceType.Accessed] === true) {
                        scheduler.schedule(parentUri);
                        res[ResourceType.Accessed] = false;
                    } else {
                        this._orderCache.delete(parentUri);
                    }
                },
            );
            this._orderCache.set(parentUri, [false, scheduler, updatedSortOrder]);
            scheduler.schedule(parentUri);

            return this.__saveSortOrder(parentItem);
        });
    }   

    public async safeLoadSortOrder(folder: TItem): Promise<void> {
        await this.__loadOrderIntoCache(folder)
        .match(
            noop,
            (error => this.logService.error('FileTreeCustomSorter', `Cannot load custom sort order at: '${folder.id}'`, error))
        );
    }
    
    // [private helper methods]

    private __getOrderFromCache(uri: URI): string[] | undefined {
        const resource = this._orderCache.get(uri);
        if (resource === undefined) {
            return undefined;
        }

        resource[ResourceType.Accessed] = true;
        return resource[ResourceType.Order];
    }

    // fileItem's order file will be stored in userDataPath
    // Its order file's name is the md5hash of fileItem.uri path.
    private __findOrCreateOrderFile(folder: TItem): AsyncResult<URI, FileOperationError | SyntaxError> {
        const hashCode = generateMD5Hash(URI.toString(folder.uri));
        const orderFileName = hashCode + ".json"; // TODO: the first two character should be sliced for better perf
        const orderFileURI = URI.join(this._orderRootPath, hashCode.slice(0, 2), orderFileName);

        return this.fileService.exist(orderFileURI)
        .andThen(existed => {

            // order file founded, we do nothing.
            if (existed) {
                return ok(orderFileURI);
            }

            // the order file does not exist, we need to create a new one.
            return jsonSafeStringify(folder.children.map(item => item.name), undefined, 4)
            .toAsync()
            .andThen(parsed => this.fileService.createFile(orderFileURI, DataBuffer.fromString(parsed))
                .map(() => orderFileURI));
        });
    }

    private __loadOrderIntoCache(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        // bug: what if the loading target is already in the memory? Why would I need to read again from the disk
        
        return this.__findOrCreateOrderFile(folder)
        .andThen(orderFileURI => this.fileService.readFile(orderFileURI))
        .andThen(buffer => jsonSafeParse<string[]>(buffer.toString()))
        .andThen(order => {

            // FIX: duplicate creating `new UnbufferedScheduler`
            const scheduler = new UnbufferedScheduler<URI>(this._delay, 
                (() => {
                    const resource = this._orderCache.get(folder.uri);
                    if (resource === undefined) {
                        return;
                    }
                    if (resource[ResourceType.Accessed] === true) {
                        resource[ResourceType.Accessed] = false;
                        scheduler.schedule(folder.uri);
                    } else {
                        this._orderCache.delete(folder.uri);
                    }
                }));
            this._orderCache.set(folder.uri, [false, scheduler, order]);
            scheduler.schedule(folder.uri);
            return ok();
        });
    }

    private __saveSortOrder(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        // bug: what if the saving target is already in the memory? Why would I need to write again to the disk
        
        return this.__findOrCreateOrderFile(folder)
        .andThen(orderFileURI => jsonSafeStringify(this.__getOrderFromCache(folder.uri), undefined, 4) // TODO
            .toAsync()
            .andThen((stringify => this.fileService.writeFile(orderFileURI, DataBuffer.fromString(stringify), { create: false, overwrite: true, }))));
    }

    private __changeOrderBasedOnType(changeType: OrderChangeType, item: TItem, index1: number, index2: number | undefined): void {
        const order = this.__getOrderFromCache(item.parent!.uri)!;
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