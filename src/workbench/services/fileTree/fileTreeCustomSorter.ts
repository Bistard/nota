import { resolveAny } from "dns";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { AsyncResult, ok } from "src/base/common/error";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationError } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { jsonSafeStringify, jsonSafeParse } from "src/base/common/json";
import { ResourceMap } from "src/base/common/structures/map";
import { Arrays } from "src/base/common/utilities/array";
import { generateMD5Hash } from "src/base/common/utilities/hash";
import { CompareOrder } from "src/base/common/utilities/type";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { IFileService } from "src/platform/files/common/fileService";
import { IFileItem, defaultFileItemCompareFn } from "src/workbench/services/fileTree/fileItem";

export interface IFileTreeCustomSorter<TItem extends IFileItem<TItem>> extends IDisposable {
    compare(a: TItem, b: TItem): number;
    loadCustomSortOrder (folder: TItem): AsyncResult<void, FileOperationError | SyntaxError>;
    addItem(item: TItem, index: number): AsyncResult<void, FileOperationError | SyntaxError>;
    removeItem(item: TItem): AsyncResult<void, FileOperationError | SyntaxError>;
}

export class FileTreeCustomSorter<TItem extends IFileItem<TItem>> extends Disposable implements IFileTreeCustomSorter<TItem> {
    
    // [fields]

    // TODO: need a detailed documentation on this field
    private readonly _customSortOrderMap: ResourceMap<string[]> = new ResourceMap();

    // [constructor]

    constructor(
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
        @IFileService private readonly fileService: IFileService,
    ) {
        super();
    }
    
    // [public methods]

    public loadCustomSortOrder (folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        if (!this._customSortOrderMap.has(folder.uri)) {
            return AsyncResult.ok();
        }
        return this.loadSortOrder(folder);
    }

    // The following TItem.parent are definitely not null, as those following
    // function can only be called when TItem.parent is at collaped state
    public compare(a: TItem, b: TItem): number {

        const order: string[] | undefined = this._customSortOrderMap.get(a.parent!.uri);
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
            return CompareOrder.First;
        } 
        else if (indexB !== -1) {
            order.push(a.name);
            return CompareOrder.Second;
        } 
        else {
            order.push(b.name);
            order.push(a.name);
            return defaultFileItemCompareFn(a, b);
        }
    }

    // APIs for fileTree Item Adding and Deleting
    public addItem(item: TItem, index: number): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.loadSortOrder(item.parent!)
            .andThen(() => {
                const order = this._customSortOrderMap.get(item.parent!.uri);
                order!.splice(index, 0, item.name);
                return this.saveSortOrder(item.parent!);
            });
    }

    public removeItem(item: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.loadSortOrder(item.parent!)
            .andThen(() => {
                const order = this._customSortOrderMap.get(item.parent!.uri);
                Arrays.remove(order!, item.name);
                return this.saveSortOrder(item.parent!);
            });
    }

    // TODO: compare the given array with the exsiting order array
    // Updates custom sort order items based on provided array of new items
    public updateSortOrder(parentItem: TItem, newItems: TItem[]): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.loadSortOrder(parentItem)
            .andThen(() => {
                const parentUri = parentItem.uri;
                const updatedSortOrder = newItems.map(item => item.name);
                this._customSortOrderMap.set(parentUri, updatedSortOrder);
                return this.saveSortOrder(parentItem);
            });
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
            this._customSortOrderMap.set(folder.uri, order);
            return ok();
        });
    }

    private saveSortOrder(folder: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.findOrCreateOrderFile(folder)
        .andThen(orderFileURI => jsonSafeStringify(this._customSortOrderMap.get(folder.uri), undefined, 4)
            .toAsync()
            .andThen((stringify => this.fileService.writeFile(orderFileURI, DataBuffer.fromString(stringify)))));
    }
}