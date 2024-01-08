import { Disposable, IDisposable } from "src/base/common/dispose";
import { AsyncResult, ok } from "src/base/common/error";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationError } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { jsonSafeStringtify, jsonSafeParse } from "src/base/common/json";
import { generateMD5Hash } from "src/base/common/utilities/hash";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { IFileService } from "src/platform/files/common/fileService";
import { FileItem, defaultFileItemCompareFn } from "src/workbench/services/fileTree/fileItem";

interface IFileTreeCustomSorter extends IDisposable {
    compare(a: FileItem, b: FileItem): number;

    init(fileItem: FileItem): AsyncResult<void, FileOperationError | SyntaxError>;
}

export class FileTreeCustomSorter extends Disposable implements IFileTreeCustomSorter {
    // map for optimization, act as a cache
    // private _customSortOrderMap: Map<string, string[]> = new Map();

    private _customSortOrderMap: Map<string, string[]> = new Map();

    constructor(
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
        @IFileService private readonly fileService: IFileService,
    ) {
        super();
    }

    public init(fileItem: FileItem):  AsyncResult<void, FileOperationError | SyntaxError>{
        return this.loadCustomSortOrder(fileItem);
    }

    public compare(a: FileItem, b: FileItem): number {
        const customSortOrder = this._customSortOrderMap[URI.toFsPath(a.parent!.uri)];
        const indexA = customSortOrder.indexOf(a.name);
        const indexB = customSortOrder.indexOf(b.name);

        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        } else if (indexA !== -1) {
            customSortOrder.push(b.name);
            return -1;
        } else if (indexB !== -1) {
            customSortOrder.push(a.name);
            return 1;
        } else {
            customSortOrder.push(b.name);
            customSortOrder.push(a.name);
            return defaultFileItemCompareFn(a, b);
        }
    }
    
    // private methods
    // fileItem's order file will be stored in userDataPath
    // Its order file's name is the md5hash of fileItem.uri path.
    private findOrCreateOrderFile(item: FileItem): AsyncResult<URI, FileOperationError | SyntaxError> {
        const folderPath = URI.toFsPath(item.uri);
        const hashCode = generateMD5Hash(folderPath);
        const orderFileName = hashCode + ".json";
        const orderFileURI = URI.join(this.environmentService.userDataPath, hashCode.slice(0, 2), orderFileName);

        return this.fileService.exist(orderFileURI)
        .andThen(exsited => {
            if (!exsited) {
                return jsonSafeStringtify(item.children, undefined, 4)
                .toAsync()
                .andThen(parsed => this.fileService.createFile(orderFileURI, DataBuffer.fromString(parsed))
                    .map(() => orderFileURI));
            }
            return AsyncResult.ok(orderFileURI);
        });
    }

    private loadCustomSortOrder(item: FileItem): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.findOrCreateOrderFile(item)
        .andThen(orderFileURI => this.fileService.readFile(orderFileURI))
        .andThen(buffer => jsonSafeParse<string[]>(buffer.toString()))
        .andThen(order => {
            this._customSortOrderMap.set(URI.toFsPath(item.uri), order);
            return ok();
        });
    }

    private saveCustomSortOrder(item: FileItem): AsyncResult<void, FileOperationError | SyntaxError> {
        return this.findOrCreateOrderFile(item)
        .andThen(orderFileURI => jsonSafeStringtify(this._customSortOrderMap[URI.toFsPath(item.uri)], undefined, 4)
            .map(stringify => <const>[orderFileURI, stringify]))
        .andThen(([orderFileURI, stringtify]) => this.fileService.writeFile(orderFileURI, DataBuffer.fromString(stringtify)));
    }
}