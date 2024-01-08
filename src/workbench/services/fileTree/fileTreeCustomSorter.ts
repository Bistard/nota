import { Disposable, IDisposable } from "src/base/common/dispose";
import { AsyncResult, ok } from "src/base/common/error";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationError } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { jsonSafeStringify, jsonSafeParse } from "src/base/common/json";
import { ResourceMap } from "src/base/common/structures/map";
import { generateMD5Hash } from "src/base/common/utilities/hash";
import { CompareOrder } from "src/base/common/utilities/type";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { IFileService } from "src/platform/files/common/fileService";
import { FileItem, defaultFileItemCompareFn } from "src/workbench/services/fileTree/fileItem";

export interface IFileTreeCustomSorter<TItem extends FileItem> extends IDisposable {
    compare(a: TItem, b: TItem): number;
    init(fileItem: TItem): AsyncResult<void, FileOperationError | SyntaxError>;
}

export class FileTreeCustomSorter<TItem extends FileItem> extends Disposable implements IFileTreeCustomSorter<TItem> {
    
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

    public init(fileItem: TItem):  AsyncResult<void, FileOperationError | SyntaxError>{
        return this.loadCustomSortOrder(fileItem);
    }

    public compare(a: TItem, b: TItem): number {

        // FIX: what happens if `a.parent` is `null`
        const customSortOrder: string[] | undefined = this._customSortOrderMap.get(a.parent!.uri);
        if (customSortOrder === undefined) {
            return defaultFileItemCompareFn(a, b);
        }
        
        const indexA = customSortOrder.indexOf(a.name);
        const indexB = customSortOrder.indexOf(b.name);

        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        } 
        else if (indexA !== -1) {
            customSortOrder.push(b.name);
            return CompareOrder.First;
        } 
        else if (indexB !== -1) {
            customSortOrder.push(a.name);
            return CompareOrder.Second;
        } 
        else {
            customSortOrder.push(b.name);
            customSortOrder.push(a.name);
            return defaultFileItemCompareFn(a, b);
        }
    }
    
    // [private helper methods]

    // TODO: more detailed documentations are needed for those private helper methods

    // fileItem's order file will be stored in userDataPath
    // Its order file's name is the md5hash of fileItem.uri path.
    private findOrCreateOrderFile(item: TItem): AsyncResult<URI, FileOperationError | SyntaxError> {
        const hashCode = generateMD5Hash(URI.toString(item.uri));
        const orderFileName = hashCode + ".json";
        const orderFileURI = URI.join(this.environmentService.userDataPath, hashCode.slice(0, 2), orderFileName);

        return this.fileService.exist(orderFileURI)
        .andThen(existed => {

            // order file founded, we do nothing.
            if (existed) {
                return ok(orderFileURI);
            }

            // the order file does not exist, we need to create a new one.
            // FIX: you are stringifying `FileItem[]` into string, but in `loadCustomSortOrder` you are parsing the string as `string[]` type.
            return jsonSafeStringify(item.children, undefined, 4)
            .toAsync()
            .andThen(parsed => this.fileService.createFile(orderFileURI, DataBuffer.fromString(parsed))
                .map(() => orderFileURI));
        });
    }

    private loadCustomSortOrder(item: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.findOrCreateOrderFile(item)
        .andThen(orderFileURI => this.fileService.readFile(orderFileURI))
        .andThen(buffer => jsonSafeParse<string[]>(buffer.toString()))
        .andThen(order => {
            this._customSortOrderMap.set(item.uri, order);
            return ok();
        });
    }

    private saveCustomSortOrder(item: TItem): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.findOrCreateOrderFile(item)
        .andThen(orderFileURI => jsonSafeStringify(this._customSortOrderMap.get(item.uri), undefined, 4)
            .map(stringify => <const>[orderFileURI, stringify]))
        .andThen(([orderFileURI, stringify]) => this.fileService.writeFile(orderFileURI, DataBuffer.fromString(stringify)));
    }
}