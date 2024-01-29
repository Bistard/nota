import { Time, TimeUnit } from "src/base/common/date";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { AsyncResult, ok } from "src/base/common/error";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationError } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { jsonSafeStringify, jsonSafeParse } from "src/base/common/json";
import { ILogService } from "src/base/common/logger";
import { noop } from "src/base/common/performance";
import { ResourceMap } from "src/base/common/structures/map";
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
     * @description Adds a file tree item to the custom sort order at the 
     * specified index.
     */
    addItem(item: TItem, index: number): AsyncResult<void, FileOperationError | SyntaxError>;

    /**
     * @description Removes a file tree item from the custom sort order at the 
     * specified index
     */
    removeItem(item: TItem, index:number): AsyncResult<void, FileOperationError | SyntaxError>;

    /**
     * @description Updates a file tree item from the custom sort order at the 
     * specified index
     */
    updateItem(item: TItem, index: number): AsyncResult<void, FileOperationError | SyntaxError>;

    /**
     * @description Synchronizes the custom sort order with a current set of 
     * file tree items.
     * @param folder The folder to be synced
     * @param currentFiles an unordered array of current files under the folder
     */
    syncOrderFile(folder: TItem, currentFiles: TItem[]): AsyncResult<void, FileOperationError | SyntaxError>;

    /**
     * @description Attempts to load the custom sort order for a folder, logging
     *  errors without throwing them.
     */
    loadSortOrderWithoutError(folder: TItem): void;
}

export class FileTreeCustomSorter<TItem extends IFileItem<TItem>> extends Disposable implements IFileTreeCustomSorter<TItem> {
    
    // [fields]

    // TODO: need a detailed documentation on this field
    private readonly _customSortOrderMap: ResourceMap<[boolean, UnbufferedScheduler<URI>, string[]]>;
    private readonly _delay: Time;

    // [constructor]

    constructor(
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        this._customSortOrderMap = new ResourceMap();
        this._delay = new Time(TimeUnit.Minutes, 5);
    }
    
    // [public methods]

    // The following TItem.parent are definitely not null, as those following
    // function can only be called when TItem.parent is at collaped state
    public compare(a: TItem, b: TItem): number {

        const order = this.getOrderOf(a.parent!.uri);
        if (order === undefined) {
            return defaultFileItemCompareFn(a, b);
        }

        const indexA = order.indexOf(a.name);
        const indexB = order.indexOf(b.name);

        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        } 
        else if (indexA !== -1) {
            order.push(b.name);
            this.saveSortOrder(a.parent!).match(
                noop,
                (error => this.logService.error(error))
            );
            return CompareOrder.First;
        } 
        else if (indexB !== -1) {
            order.push(a.name);
            this.saveSortOrder(a.parent!).match(
                noop,
                (error => this.logService.error(error))
            );
            return CompareOrder.Second;
        } 
        else {
            order.push(b.name);
            order.push(a.name);
            this.saveSortOrder(a.parent!).match(
                noop,
                (error => this.logService.error(error))
            );
            return defaultFileItemCompareFn(a, b);
        }
    }

    // APIs for fileTree Item Adding and Deleting
    public addItem(item: TItem, index: number): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.loadSortOrder(item.parent!)
            .andThen(() => {
                const order = this.getOrderOf(item.parent!.uri);
                order!.splice(index, 0, item.name);
                return this.saveSortOrder(item.parent!);
            });
    }

    public removeItem(item: TItem, index: number): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.loadSortOrder(item.parent!)
            .andThen(() => {
                const order = this.getOrderOf(item.parent!.uri);
                order!.splice(index, 1);
                return this.saveSortOrder(item.parent!);
            });
    }
    public updateItem(item: TItem, index: number): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.loadSortOrder(item.parent!)
            .andThen(() => {
                const order = this.getOrderOf(item.parent!.uri);
                order![index] = item.name;
                return this.saveSortOrder(item.parent!);
            });
    }

    // TODO: compare the given array with the exsiting order array
    // Updates custom sort order items based on provided array of new items
    public syncOrderFile(parentItem: TItem, newItems: TItem[]): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.loadSortOrder(parentItem)
            .andThen(() => {
                const parentUri = parentItem.uri;
                const resource = this._customSortOrderMap.get(parentUri);
                // Use an empty array if the resource is undefined
                const existingOrder = resource ? resource[ResourceType.Order] : [];
                const newItemNames = new Set(newItems.map(item => item.name));
                const existingItemSet = new Set(existingOrder);
    
                // Update the sort order
                const updatedSortOrder = existingOrder.filter(item => newItemNames.has(item))
                    .concat(newItems.filter(item => !existingItemSet.has(item.name)).map(item => item.name));
    
                const scheduler = resource ? resource[ResourceType.Scheduler] : new UnbufferedScheduler<URI>(this._delay.toMs().time, 
                (event) => {
                    const res = this._customSortOrderMap.get(parentUri);
                    if (res && res[ResourceType.Accessed] === true) {
                        scheduler.schedule(parentUri);
                        res[ResourceType.Accessed] = false;
                    } else {
                        this._customSortOrderMap.delete(parentUri);
                    }
                });
                this._customSortOrderMap.set(parentUri, [false, scheduler, updatedSortOrder]);
                scheduler.schedule(parentUri);
                return this.saveSortOrder(parentItem);
            });
    }   

    public loadSortOrderWithoutError(folder: TItem): void{
        this.loadSortOrder(folder).match(
            noop,
            (error => this.logService.error(error))
        );
    }
    
    // [private helper methods]

    // TODO: more detailed documentations are needed for those private helper methods

    // fileItem's order file will be stored in userDataPath
    // Its order file's name is the md5hash of fileItem.uri path.
    private findOrCreateOrderFile(folder: TItem): AsyncResult<URI, FileOperationError | SyntaxError> {
        const hashCode = generateMD5Hash(URI.toString(folder.uri));
        const orderFileName = hashCode + ".json";
        const orderFileURI = URI.join(this.environmentService.userDataPath, hashCode.slice(0, 2), orderFileName);

        return this.fileService.exist(orderFileURI)
        .andThen(existed => {

            // order file founded, we do nothing.
            if (existed) {
                return ok(orderFileURI);
            }

            // the order file does not exist, we need to create a new one.
            return jsonSafeStringify(folder.children.map((item) => item.name), undefined, 4)
            .toAsync()
            .andThen(parsed => this.fileService.createFile(orderFileURI, DataBuffer.fromString(parsed))
                .map(() => orderFileURI));
        });
    }

    private loadSortOrder(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.findOrCreateOrderFile(folder)
        .andThen(orderFileURI => this.fileService.readFile(orderFileURI))
        .andThen(buffer => jsonSafeParse<string[]>(buffer.toString()))
        .andThen(order => {
            const scheduler = new UnbufferedScheduler<URI>(this._delay.toMs().time, 
                (event => {
                    const resource = this._customSortOrderMap.get(folder.uri);
                    if (resource === undefined) {
                        return;
                    }
                    if (resource[ResourceType.Accessed] === true) {
                        scheduler.schedule(folder.uri);
                        resource[ResourceType.Accessed] = false;
                    } else {
                        this._customSortOrderMap.delete(folder.uri);
                    }
                }));
            this._customSortOrderMap.set(folder.uri, [false, scheduler, order]);
            scheduler.schedule(folder.uri);
            return ok();
        });
    }

    private saveSortOrder(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.findOrCreateOrderFile(folder)
        .andThen(orderFileURI => jsonSafeStringify(this.getOrderOf(folder.uri), undefined, 4)
            .toAsync()
            .andThen((stringify => this.fileService.writeFile(orderFileURI, DataBuffer.fromString(stringify)))));
    }

    private getOrderOf(uri: URI): string[] | undefined{
        const resource = this._customSortOrderMap.get(uri);
        if (resource === undefined) {
            return undefined;
        }
        resource[ResourceType.Accessed] = true;
        return resource[ResourceType.Order];
    }
}