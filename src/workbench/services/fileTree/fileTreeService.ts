import { Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IFileTreeOpenEvent, FileTree, IFileTree as IFileTree } from "src/workbench/services/fileTree/fileTree";
import { IFileService } from "src/platform/files/common/fileService";
import { FileItemChildrenProvider, FileItem as FileItem } from "src/workbench/services/fileTree/fileItem";
import { ITreeService } from "src/workbench/services/explorerTree/treeService";
import { Disposable } from "src/base/common/dispose";
import { FileItemProvider as FileItemProvider, FileItemRenderer as FileItemRenderer } from "src/workbench/services/fileTree/fileItemRenderer";
import { FileItemDragAndDropProvider } from "src/workbench/services/fileTree/fileItemDragAndDrop";
import { ILogService } from "src/base/common/logger";
import { FuzzyScore, IFilterOpts } from "src/base/common/fuzzy";
import { FileItemFilter as FileItemFilter } from "src/workbench/services/fileTree/fileItemFilter";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { SideViewConfiguration } from "src/workbench/parts/sideView/configuration.register";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { AsyncResult, ok } from "src/base/common/error";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { FileSortOrder, FileSortType, FileTreeSorter } from "src/workbench/services/fileTree/fileTreeSorter";
import { noop } from "src/base/common/performance";
import { Pair } from "src/base/common/utilities/type";
import { FileOperationError } from "src/base/common/files/file";

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
        const [sorter, registerSorterListeners] = this.__initSorter();
        this.__register(sorter);
        
        return this.__initTree(container, root, sorter)
        .andThen(async tree => {
            registerSorterListeners(tree);

            await tree.refresh();
        });
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

    // [private helper methods]

    private __initTree(container: HTMLElement, root: URI, sorter: FileTreeSorter<FileItem>): AsyncResult<IFileTree<FileItem, void>, FileOperationError> {
        
        // make sure the root directory exists first
        return this.fileService.stat(root, { resolveChildren: true })

        // build the tree
        .andThen(rootStat => {
            
            // retrieve tree configurations
            const filterOpts: IFilterOpts = {
                exclude: this.configurationService.get<string[]>(SideViewConfiguration.ExplorerViewExclude, []).map(s => new RegExp(s)),
                include: this.configurationService.get<string[]>(SideViewConfiguration.ExplorerViewInclude, []).map(s => new RegExp(s)),
            };

            // initially construct the entire file system hierarchy
            const rootItem = new FileItem(rootStat, null, noop, filterOpts, sorter.compare.bind(sorter));

            // init tree
            const dndProvider = new FileItemDragAndDropProvider(this.fileService);
            const tree = this.__register(
                new FileTree<FileItem, FuzzyScore>(
                    container,
                    rootItem,
                    {
                        itemProvider: new FileItemProvider(),
                        renderers: [new FileItemRenderer()],
                        childrenProvider: new FileItemChildrenProvider(this.logService, this.fileService, filterOpts, sorter.compare.bind(sorter)),
                        identityProvider: { getID: (data: FileItem) => URI.toString(data.uri) },

                        // optional
                        collapsedByDefault: true,
                        filter: new FileItemFilter(),
                        dnd: dndProvider,
                    },
                )
            );

            // bind the dnd with the tree
            dndProvider.bindWithTree(tree);

            this._tree = tree;
            return ok(tree);
        });
    }   

    private __initSorter(): Pair<FileTreeSorter<FileItem>, (tree: IFileTree<FileItem, void>) => void> {
        const fileSortType = this.configurationService.get<FileSortType>(SideViewConfiguration.ExplorerFileSortType);
        const fileSortOrder = this.configurationService.get<FileSortOrder>(SideViewConfiguration.ExplorerFileSortOrder);

        const sorter = new FileTreeSorter(
            this.instantiationService,
            fileSortType,
            fileSortOrder,
        );

        const registerListeners = (tree: IFileTree<FileItem, void>) => {
            tree.onRefresh(() => {
                // TODO
            });
            tree.onDidExpand(async (e) => {
                sorter.initCustomSorter(e.node.data).match(
                    noop, 
                    (error) => this.logService.error(error),
                );
            });
        };

        return [sorter, registerListeners];
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