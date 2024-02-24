import { Emitter, RelayEmitter } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IFileTreeOpenEvent, FileTree, IFileTree } from "src/workbench/services/fileTree/fileTree";
import { IFileService } from "src/platform/files/common/fileService";
import { FileItemChildrenProvider, FileItem as FileItem, IFileItemResolveOptions } from "src/workbench/services/fileTree/fileItem";
import { IFileTreeService } from "src/workbench/services/fileTree/treeService";
import { Disposable, DisposableManager } from "src/base/common/dispose";
import { FileItemProvider as FileItemProvider, FileItemRenderer as FileItemRenderer } from "src/workbench/services/fileTree/fileItemRenderer";
import { FileItemDragAndDropProvider } from "src/workbench/services/fileTree/fileItemDragAndDrop";
import { ILogService } from "src/base/common/logger";
import { FuzzyScore, IFilterOpts } from "src/base/common/fuzzy";
import { FileItemFilter as FileItemFilter } from "src/workbench/services/fileTree/fileItemFilter";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { AsyncResult } from "src/base/common/result";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { FileSortOrder, FileSortType, FileTreeSorter } from "src/workbench/services/fileTree/fileTreeSorter";
import { FileOperationError } from "src/base/common/files/file";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { WorkbenchConfiguration } from "src/workbench/services/workbench/configuration.register";
import { Scheduler } from "src/base/common/utilities/async";
import { IResourceChangeEvent } from "src/platform/files/common/resourceChangeEvent";
import { Time } from "src/base/common/date";
import { panic } from "src/base/common/utilities/panic";

export class FileTreeService extends Disposable implements IFileTreeService {

    declare _serviceMarker: undefined;

    // [field]

    private _tree?: IFileTree<FileItem, void>;
    private _onDidResourceChange?: Scheduler<IResourceChangeEvent>;
    private _treeDisposables: DisposableManager;

    private _isVisuallyCutOrCut?: 'copy' | 'cut';

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
    ) {
        super();
        this._treeDisposables = new DisposableManager();
    }

    // [event]

    private readonly _onSelect = this.__register(new RelayEmitter<IFileTreeOpenEvent<FileItem>>());
    public readonly onSelect = this._onSelect.registerListener;
    
    private readonly _onDidChangeFocus = this.__register(new RelayEmitter<boolean>());
    public readonly onDidChangeFocus = this._onDidChangeFocus.registerListener;

    private readonly _onDidInitOrClose = this.__register(new Emitter<boolean>());
    public readonly onDidInitOrClose = this._onDidInitOrClose.registerListener;
    
    // [getter]

    get container(): HTMLElement | undefined {
        return this._tree?.DOMElement;
    }

    get root(): URI | undefined {
        return this._tree?.root.uri;
    }

    get rootItem(): FileItem | undefined {
        return this._tree?.root;
    }

    get isOpened(): boolean {
        return !!this._tree;
    }

    // [public mehtods]

    public init(container: HTMLElement, root: URI): AsyncResult<void, Error> {
        if (this._tree) {
            return AsyncResult.err(new Error('[FileTreeService] cannot initialize since it is already initialized. Close it before initialize.'));
        }

        return this.__initTree(container, root)
            .andThen(async tree => {
                this._onSelect.setInput(tree.onSelect);
                this._onDidChangeFocus.setInput(tree.onDidChangeFocus);

                /**
                 * After the tree is constructed, refresh tree to fetch the 
                 * latest data for the first time.
                 */
                await tree.refresh();

                this.__initListeners(tree);

                this._onDidInitOrClose.fire(true);
            });
    }

    public layout(height?: number | undefined): void {
        this._tree?.layout(height);
    }

    public async refresh(data?: FileItem): Promise<void> {
        this._tree?.refresh(data);
    }

    public async expand(data: FileItem, recursive?: boolean): Promise<void> {
        const tree = this.__assertTree();
        await tree.expand(data, recursive);
    }

    public async toggleCollapseOrExpand(data: FileItem, recursive?: boolean): Promise<void> {
        const tree = this.__assertTree();
        await tree.toggleCollapseOrExpand(data, recursive);
    }

    public async expandAll(): Promise<void> {
        const tree = this.__assertTree();
        await tree.expandAll();
    }
    
    public async collapseAll(): Promise<void> {
        const tree = this.__assertTree();
        await tree.collapseAll();
    }

    public async highlightSelectionAsCut(items: FileItem[]): Promise<void> {
        // TODO
    }

    public async highlightSelectionAsCopy(items: FileItem[]): Promise<void> {
        // TODO
    }
    
    public async close(): Promise<void> {
        if (!this._tree) {
            return;
        }

        this._tree.dispose();
        this._tree = undefined;

        this._treeDisposables.dispose();
        this._onDidInitOrClose.fire(false);
    }

    public getFocus(): FileItem | null {
        const tree = this.__assertTree();
        const focus = tree.getViewFocus();
        if (focus === null) {
            return null;
        }
        return tree.getItem(focus);
    }

    public getAnchor(): FileItem | null {
        const tree = this.__assertTree();
        const anchor = tree.getViewAnchor();
        if (anchor === null) {
            return null;
        }
        return tree.getItem(anchor);
    }
    
    public getSelections(): FileItem[] {
        const tree = this.__assertTree();
        return tree.getViewSelections().map(idx => tree.getItem(idx));
    }
    
    public getHover(): FileItem[] {
        const tree = this.__assertTree();
        return tree.getViewHover().map(idx => tree.getItem(idx));
    }

    public override dispose(): void {
        super.dispose();
        this._treeDisposables.dispose();
    }
    
    // [private helper methods]

    private __assertTree(): IFileTree<FileItem, void> {
        if (!this._tree) {
            panic('[FileTreeService] not initialized yet.');
        }
        return this._tree;
    }

    private __initTree(container: HTMLElement, root: URI): AsyncResult<IFileTree<FileItem, void>, FileOperationError> {
        
        /**
         * Make sure the root directory exists first.
         * Only resolving the direct children of the root, indicates we are 
         * always collapsing the tree at the beginning.
         */
        return this.fileService.stat(root, { 
            resolveChildren: true,
            resolveChildrenRecursive: false,
        })

        // start building the tree
        .andThen(async rootStat => {
            
            // retrieve tree configurations
            const filterOpts: IFilterOpts = {
                exclude: this.configurationService.get<string[]>(WorkbenchConfiguration.ExplorerViewExclude, []).filter(s => !!s).map(s => new RegExp(s)),
                include: this.configurationService.get<string[]>(WorkbenchConfiguration.ExplorerViewInclude, []).filter(s => !!s).map(s => new RegExp(s)),
            };

            // construct sorter and initialize it after
            const [sorter, registerSorterListener] = this.__initSorter();
            this.__register(sorter);

            const fileItemResolveOpts: IFileItemResolveOptions<FileItem> = { 
                onError: error => this.logService.error('FileItem', 'Encounters an error when resolving FileItem recursively', error), 
                cmp: sorter.compare.bind(sorter), 
                beforeCmp: async folder => __syncSorterMetadataBy(sorter, folder),
                filters: filterOpts,
            };

            // initially construct the entire file system hierarchy
            const root = await FileItem.resolve(rootStat, null, fileItemResolveOpts);

            // init tree
            const dndProvider = this.__register(this.instantiationService.createInstance(FileItemDragAndDropProvider, sorter));
            const tree = new FileTree<FileItem, FuzzyScore>(
                container,
                root,
                {
                    itemProvider: new FileItemProvider(),
                    renderers: [new FileItemRenderer()],
                    childrenProvider: new FileItemChildrenProvider(this.logService, this.fileService, fileItemResolveOpts),
                    identityProvider: { getID: (data: FileItem) => data.id },

                    // optional
                    collapsedByDefault: true,
                    filter: new FileItemFilter(),
                    dnd: dndProvider,
                },
            );

            // bind the dnd with the tree
            dndProvider.bindWithTree(tree);
            registerSorterListener(tree);

            this._tree = this._treeDisposables.register(tree);
            return tree;
        });
    }   

    private __initSorter(): [sorter: FileTreeSorter<FileItem>, register: (tree: IFileTree<FileItem, void>) => void] {
        const fileSortType = this.configurationService.get<FileSortType>(WorkbenchConfiguration.ExplorerFileSortType);
        const fileSortOrder = this.configurationService.get<FileSortOrder>(WorkbenchConfiguration.ExplorerFileSortOrder);

        const sorter = this.instantiationService.createInstance(
            FileTreeSorter, 
            fileSortType, 
            fileSortOrder, 
            this.environmentService.appConfigurationPath,
        );

        const register = (tree: IFileTree<FileItem, void>) => {
            // configuration auto update
            this.configurationService.onDidConfigurationChange(e => {
                if (e.affect(WorkbenchConfiguration.ExplorerFileSortType) ||
                    e.affect(WorkbenchConfiguration.ExplorerFileSortOrder)
                ) {
                    const newType = this.configurationService.get<FileSortType>(WorkbenchConfiguration.ExplorerFileSortType);
                    const newOrder = this.configurationService.get<FileSortOrder>(WorkbenchConfiguration.ExplorerFileSortOrder);
                    if (sorter.switchTo(newType, newOrder)) {
                        tree.refresh();
                    }
                }
            });
        };

        return [sorter, register];
    }

    private __initListeners(tree: IFileTree<FileItem, void>): void {
        
        const root = tree.root.uri;
        const cleanup = new DisposableManager();
        this._treeDisposables = cleanup;

        // on did resource change callback
        this._onDidResourceChange = cleanup.register(new Scheduler(
            Time.ms(100),
            (events: IResourceChangeEvent[]) => {
                if (!root) {
                    return;
                }

                let affected = false;
                for (const event of events) {
                    if (event.affect(root)) {
                        affected = true;
                        break;
                    }
                }

                if (affected) {
                    tree.refresh();
                }
            }
        ));

        // watch the root
        this.fileService.watch(root, { recursive: true })
            .match<void>(
                (disposable) => cleanup.register(disposable),
                error => this.logService.warn('FileTreeService', 'Cannot watch the root directory.', { at: URI.toString(root), error: error, }),
            );
        
        cleanup.register(this.fileService.onDidResourceChange(e => {
            this._onDidResourceChange?.schedule(e.wrap());
        }));
    }
}

async function __syncSorterMetadataBy(sorter: FileTreeSorter<FileItem>, folder: FileItem): Promise<void> {
    if (sorter.sortType !== FileSortType.Custom) {
        return;
    }
    
    const customSorter = sorter.getCustomSorter();
    await customSorter.syncMetadataInCacheWithDisk(folder).unwrap();
}