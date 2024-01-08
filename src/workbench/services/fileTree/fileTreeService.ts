import { Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IFileTreeOpenEvent, FileTree, IFileTree as IFileTree } from "src/workbench/services/fileTree/fileTree";
import { FileService, IFileService } from "src/platform/files/common/fileService";
import { FileItemChildrenProvider, FileItem as FileItem, defaultFileItemCompareFn } from "src/workbench/services/fileTree/fileItem";
import { ITreeService } from "src/workbench/services/explorerTree/treeService";
import { Disposable, IDisposable } from "src/base/common/dispose";
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
import { FileOperationError, FileOperationErrorType, FileType } from "src/base/common/files/file";
import { generateKey } from "crypto";
import { generateMD5Hash } from "src/base/common/utilities/hash";
import { buffer } from "stream/consumers";
import { jsonSafeParse, jsonSafeStringtify } from "src/base/common/json";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { FileSortType, FileTreeSorter } from "src/workbench/services/fileTree/fileTreeSorter";



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

    // [constructor]

    constructor(
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
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

    public init(container: HTMLElement, root: URI): AsyncResult<void, Error> {
        return new AsyncResult((async () => {

        // retrieve configurations
        const filterOpts: IFilterOpts = {
            exclude: this.configurationService.get<string[]>(SideViewConfiguration.ExplorerViewExclude, []).map(s => new RegExp(s)),
            include: this.configurationService.get<string[]>(SideViewConfiguration.ExplorerViewInclude, []).map(s => new RegExp(s)),
        };
        const fileSortType = this.configurationService.get<FileSortType>(SideViewConfiguration.ExplorerFileSorting);

        const sorter = new FileTreeSorter(
            this.instantiationService,
            fileSortType,
        );
        
        // resolve the root of the directory first
        const statResult = await this.fileService.stat(root, { resolveChildren: true });
        if (statResult.isErr()) {
            return err(statResult.error);
        }
        const rootStat = statResult.data;
        const rootItem = new FileItem(rootStat, null, () => {}, filterOpts);

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
        
        })());
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