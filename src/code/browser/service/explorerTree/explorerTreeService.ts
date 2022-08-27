import { Disposable, IDisposable } from "src/base/common/dispose";
import { Register, RelayEmitter } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { FolderTreeService, IFolderTreeService } from "src/code/browser/service/folderTree/folderTreeService";
import { INotebookTreeService, NotebookTreeService } from "src/code/browser/service/notebookTree/notebookTreeService";
import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { BuiltInConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";

export const IExplorerTreeService = createService<IExplorerTreeService>('explorer-tree-service');

export const enum TreeMode {
    Folder = 'folder',
    Notebook = 'notebook',
}

/**
 * The base interface for any tree services.
 */
export interface ITreeService extends IDisposable {
    /**
     * The parent container of the current tree view. `undefined` if the tree is 
     * not opened yet.
     */
    readonly container: HTMLElement | undefined;

    /**
     * The root directory of the current tree. `undefined` if the tree is not 
     * opened yet.
     */
    readonly root: URI | undefined;

    /**
     * Determine if the explorer tree is opened right now.
     */
    readonly isOpened: boolean;

    /**
     * Fires when a file / page is clicked (not opened yet).
     */
    onOpen: Register<any>; // TODO

    /**
     * // TODO
     */
    init(container: HTMLElement, root: URI): Promise<void>;
 
    /**
     * @description Given the height, re-layouts the height of the whole tree.
     * @param height The given height.
     * @note If no values are provided, it will sets to the height of the 
     * corresponding DOM element of the parent view.
     */
    layout(height?: number): void;
 
    /**
     * @description Refresh the current tree view.
     */
    refresh(): Promise<void>;

    /**
     * // TODO
     */
    close(): Promise<void>;
}

export interface IExplorerTreeService extends ITreeService {
    
    /**
     * The displaying tree mode.
     */
    readonly mode: TreeMode;

}

/**
 * // TODO
 */
export class ExplorerTreeService extends Disposable implements IExplorerTreeService {

    // [event]

    private readonly _onOpen = this.__register(new RelayEmitter<any>());
    public readonly onOpen = this._onOpen.registerListener;

    // [field]

    private _root?: URI;
    private _opened: boolean;
    private _mode: TreeMode;

    private readonly folderTreeService: IFolderTreeService;
    private readonly notebookTreeService: INotebookTreeService;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IConfigService configService: IConfigService,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super();
        this._root = undefined;
        this._opened = false;
        this._mode = configService.get<TreeMode>(BuiltInConfigScope.User, 'actionView.explorer.folder') ?? TreeMode.Notebook;
        this.folderTreeService = instantiationService.createInstance(FolderTreeService);
        this.notebookTreeService = instantiationService.createInstance(NotebookTreeService);
        this.__register(this.folderTreeService);
        this.__register(this.notebookTreeService);
    }

    // [getter / setter]
    
    get mode(): TreeMode {
        return this._mode;
    }

    get container(): HTMLElement | undefined {
        return this.isOpened
            ? (this.mode === TreeMode.Notebook
                ? this.notebookTreeService.container 
                : this.folderTreeService.container) 
            : undefined;
    }

    get root(): URI | undefined {
        return this._root;
    }

    get isOpened(): boolean {
        return this._opened;
    }

    // [public mehtods]

    public async init(container: HTMLElement, root: URI): Promise<void> {
        this._root = root;
        this._opened = true;
        if (this._mode === TreeMode.Notebook) {
            this.notebookTreeService.init(container, root);
            this._onOpen.setInput(this.notebookTreeService.onOpen);
        } else {
            this.folderTreeService.init(container, root);
            this._onOpen.setInput(this.folderTreeService.onOpen);
        }
    }

    public layout(height?: number | undefined): void {
        if (this._opened === false) {
            return;
        }

        (this._mode === TreeMode.Notebook 
            ? this.notebookTreeService.layout(height) 
            : this.folderTreeService.layout(height)
        );
    }

    public async refresh(): Promise<void> {
        if (this._opened === false) {
            return;
        }

        await (this._mode === TreeMode.Notebook 
            ? this.notebookTreeService.refresh() 
            : this.folderTreeService.refresh()
        );
    }

    public async close(): Promise<void> {
        if (this._opened === false) {
            return;
        }

        return (this._mode === TreeMode.Notebook 
            ? this.notebookTreeService.close() 
            : this.folderTreeService.close()
        );
    }
}