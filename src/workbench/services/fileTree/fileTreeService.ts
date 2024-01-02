import { Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IFileTreeOpenEvent, FileTree, IFileTree as IFileTree } from "src/workbench/services/fileTree/fileTree";
import { IFileService } from "src/platform/files/common/fileService";
import { FileItemChildrenProvider, FileItem as FileItem, defaultFileItemCompareFn } from "src/workbench/services/fileTree/fileItem";
import { ITreeService } from "src/workbench/services/explorerTree/treeService";
import { Disposable } from "src/base/common/dispose";
import { FileItemProvider as FileItemProvider, FileItemRenderer as FileItemRenderer } from "src/workbench/services/fileTree/fileItemRenderer";
import { FileItemDragAndDropProvider } from "src/workbench/services/fileTree/fileItemDragAndDrop";
import { ILogService } from "src/base/common/logger";
import { FuzzyScore, IFilterOpts } from "src/base/common/fuzzy";
import { FileItemFilter as FileItemFilter } from "src/workbench/services/fileTree/fileItemFilter";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { SideViewConfiguration } from "src/workbench/parts/sideView/configuration.register";
import { IBrowserEnvironmentService, IDiskEnvironmentService, IEnvironmentService } from "src/platform/environment/common/environment";
import { DataBuffer } from "src/base/common/files/buffer";
import { AsyncResult, Result, err, ok } from "src/base/common/error";
import { FileOperationError, FileOperationErrorType } from "src/base/common/files/file";

export interface IFileTreeService extends ITreeService<FileItem> {
    // noop
}

/**
 * // TODO
 */
export class FileTreeService extends Disposable implements IFileTreeService {

    declare _serviceMarker: undefined;

    // [field]

    private _tree?: IFileTree<FileItem, void>;
    private customSortOrderMap: Map<string, string[]> = new Map();

    // [constructor]

    constructor(
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IBrowserEnvironmentService private readonly environmentService:IBrowserEnvironmentService
    ) {
        super();
    }

    // [event]

    get onSelect(): Register<IFileTreeOpenEvent<FileItem>> {
        return this._tree!.onSelect;
    }

    // [getter]

    get container(): HTMLElement | undefined {
        return (this._tree ? this._tree.DOMElement : undefined);
    }

    get root(): URI | undefined {
        return (this._tree ? this._tree.root.uri : undefined);
    }

    get isOpened(): boolean {
        return !!this._tree;
    }

    // [public mehtods]

    public async init(container: HTMLElement, root: URI): AsyncResult<void, Error> {
        
        // retrieve configurations
        const filterOpts: IFilterOpts = {
            exclude: this.configurationService.get<string[]>(SideViewConfiguration.ExplorerViewExclude, []).map(s => new RegExp(s)),
            include: this.configurationService.get<string[]>(SideViewConfiguration.ExplorerViewInclude, []).map(s => new RegExp(s)),
        };
        const ifSupportFileSorting = this.configurationService.get<boolean>(SideViewConfiguration.ExplorerFileSorting, false);

        this.loadCustomSortOrder(root);
        const sorter = new FileTreeSorter(
            ifSupportFileSorting,
            this.customSortOrderMap.get(root.toString()) || [],
        );
        
        // resolve the root of the directory first
        const statResult = await this.fileService.stat(root, { resolveChildren: true });
        if (statResult.isErr()) {
            return err(statResult.error);
        }
        const rootStat = statResult.data;
        const rootItem = new FileItem(rootStat, null, filterOpts);

        // construct the file system hierarchy
        const dndProvider = new FileItemDragAndDropProvider(this.fileService);
        this._tree = this.__register(
            new FileTree<FileItem, FuzzyScore>(
                container,
                rootItem,
                {
                    itemProvider: new FileItemProvider(),
                    renderers: [new FileItemRenderer()],
                    childrenProvider: new FileItemChildrenProvider(this.logService, this.fileService, filterOpts, sorter.compare),
                    identityProvider: { getID: (data: FileItem) => URI.toString(data.uri) },

                    // optional
                    collapsedByDefault: true,
                    filter: new FileItemFilter(),
                    dnd: dndProvider,
                },
            )
        );
        dndProvider.bindWithTree(this._tree);

        await this._tree.refresh();
        return ok();
    }

    public layout(height?: number | undefined): void {
        this._tree?.layout(height);
    }

    public async refresh(data?: FileItem): Promise<void> {
        this._tree?.refresh(data);
    }

    public async close(): Promise<void> {
        // TODO
    }

    private async loadCustomSortOrder(folderUri: URI): AsyncResult<void, FileOperationError> {
        const sortOrderFileNameResult = await this.findSortOrderFileName(folderUri);
        if (sortOrderFileNameResult.isErr()) {
            return err(sortOrderFileNameResult.error);
        }
    
        const sortOrderFileName = sortOrderFileNameResult.unwrap();
        if (!sortOrderFileName) {
            return err(new FileOperationError(`Sort order file not found in ${folderUri.toString()}`, FileOperationErrorType.FILE_NOT_FOUND));
        }
    
        const sortOrderFileUri = URI.join(folderUri, sortOrderFileName);

        const readResult = await this.fileService.readFile(sortOrderFileUri);
        if (readResult.isErr()) {
            return err(readResult.error);
        }
        const buffer = readResult.unwrap();
        const sortOrder = JSON.parse(buffer.toString());
        this.customSortOrderMap.set(folderUri.toString(), sortOrder);
        return ok();
    }
    
    private async saveCustomSortOrder(folderUri: URI, sortOrder: string[]): AsyncResult<void, FileOperationError> {
        const sortOrderFileNameResult = await this.findSortOrderFileName(folderUri);
        if (sortOrderFileNameResult.isErr()) {
            return err(sortOrderFileNameResult.error);
        }
    
        const sortOrderFileName = sortOrderFileNameResult.unwrap();
        if (!sortOrderFileName) {
            return err(new FileOperationError(`Sort order file not found in ${folderUri.toString()}`, FileOperationErrorType.FILE_NOT_FOUND));
        }
    
        const sortOrderFilePath = URI.join(folderUri, sortOrderFileName);
        const data = JSON.stringify(sortOrder, null, 4);
        const buffer = DataBuffer.fromString(data);
    
        const writeResult = await this.fileService.writeFile(sortOrderFilePath, buffer);
        if (writeResult.isErr()) {
            return err(writeResult.error);
        }
    
        return ok();
    }
    
    private async findSortOrderFileName(folderUri: URI): AsyncResult<string | null, FileOperationError> {
        const readDirResult = await this.fileService.readDir(folderUri);
        if (readDirResult.isErr()) {
            return err(new FileOperationError(`Error reading directory ${folderUri.toString()}: ${readDirResult.error.message}`, FileOperationErrorType.UNKNOWN, readDirResult.error));
        }
    
        const entries = readDirResult.unwrap();
        const sortOrderFile = entries.find(([name, _]) => name.endsWith('.sortorder.json'));
    
        return sortOrderFile ? ok(sortOrderFile[0]) : ok(null);
    }
    
    
    // TODO: Add new methods to handle drag and drop events and update sort files
    // private handleDragAndDrop(draggedItem, targetFolder) {
    //     // Implement drag-and-drop processing logic
    // }

    // private updateOrderInSameFolder(draggedItem, targetFolder) {
    //     //Update the sorting within the same folder
    // }

    // private updateOrderAcrossFolders(draggedItem, targetFolder) {
    //     //Update sorting across folders
    // }

    // TODO: Add self-checking-loop method
}

// TODO: @AAsteria
// TODO: @duckSoup0203
class FileTreeSorter extends Disposable {

    // [fields]
    
    private readonly _ifSupportFileSorting: boolean;
    private customSortOrder: string[];

    // [constructor]

    constructor(
        ifSupportFileSorting: boolean,
        customSortOrder: string[],
    ) {
        super();
        this._ifSupportFileSorting = ifSupportFileSorting;
        this.customSortOrder = customSortOrder;

        if (ifSupportFileSorting) {
            this.compare = this.__customCompare;
        } else {
            this.compare = defaultFileItemCompareFn;
        }
    }

    // [getter]

    public readonly compare: (a: FileItem, b: FileItem) => number;

    // [public methods]

    public saveCustomSortOrder(folderUri: string): void {
        // TODO: Trigger the save operation in FileTreeService
        
    }

    // [private helper methods]

    private __customCompare(a: FileItem, b: FileItem): number {
        const customSortOrder = this.customSortOrder;
        const indexA = customSortOrder.indexOf(a.name);
        const indexB = customSortOrder.indexOf(b.name);

        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        } else if (indexA !== -1) {
            return -1;
        } else if (indexB !== -1) {
            return 1;
        } else {
            return defaultFileItemCompareFn(a, b);
        }
    }
}