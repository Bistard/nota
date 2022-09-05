import { Disposable, DisposableManager, IDisposable } from "src/base/common/dispose";
import { RelayEmitter } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ClassicOpenEvent } from "src/code/browser/service/classicTree/classicTree";
import { ClassicTreeService, IClassicTreeService } from "src/code/browser/service/classicTree/classicTreeService";
import { ITreeService, TreeMode } from "src/code/browser/service/explorerTree/treeService";
import { INotebookTreeService, NotebookTreeService } from "src/code/browser/service/notebookTree/notebookTreeService";
import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { BuiltInConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";

export const IExplorerTreeService = createService<IExplorerTreeService>('explorer-tree-service');

export interface IExplorerTreeService extends ITreeService<ClassicOpenEvent | any> {
    
    /**
     * The displaying tree mode.
     */
    readonly mode: TreeMode;

    /**
     * @description Switch explorer tree displaying mode.
     */
    switchMode(mode: TreeMode): void;
}

/**
 * // TODO
 */
export class ExplorerTreeService extends Disposable implements IExplorerTreeService {

    // [event]

    private readonly _onDidClick = this.__register(new RelayEmitter<unknown>());
    public readonly onDidClick = this._onDidClick.registerListener;

    // [field]

    /** The root directory of the opened tree, undefined if not opened.  */
    private _root?: URI;
    /** The current tree display mode. */
    private _mode: TreeMode;
    
    private _rootWatcher?: IDisposable;
    private _currentTreeService?: ITreeService<unknown>;

    private readonly classicTreeService: IClassicTreeService;
    private readonly notebookTreeService: INotebookTreeService;

    // [constructor]

    constructor(
        @IFileService private readonly fileService: IFileService,
        @IConfigService configService: IConfigService,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super();
        this._root = undefined;
        this._mode = configService.get<TreeMode>(BuiltInConfigScope.User, 'actionView.explorer.mode') ?? TreeMode.Notebook;
        this.classicTreeService = instantiationService.createInstance(ClassicTreeService);
        this.notebookTreeService = instantiationService.createInstance(NotebookTreeService);
        this.__register(this.classicTreeService);
        this.__register(this.notebookTreeService);
    }

    // [getter / setter]
    
    get mode(): TreeMode {
        return this._mode;
    }

    get container(): HTMLElement | undefined {
        return (
            this.isOpened
            ? (this.mode === TreeMode.Notebook
                ? this.notebookTreeService.container 
                : this.classicTreeService.container) 
            : undefined
        );
    }

    get root(): URI | undefined {
        return this._root;
    }

    get isOpened(): boolean {
        return !!this._root;
    }

    // [public mehtods]

    public async init(container: HTMLElement, root: URI, mode?: TreeMode): Promise<void> {
        this._root = root;
        if (mode) {
            this._mode = mode;
        }

        if (this._mode === TreeMode.Notebook) {
            this._currentTreeService = this.notebookTreeService;
            
        } else {
            this._currentTreeService = this.classicTreeService;
        }

        await this._currentTreeService.init(container, root);
        this._onDidClick.setInput(this._currentTreeService.onDidClick);

        const disposables = new DisposableManager();
        this._rootWatcher = disposables;

        disposables.register(this.fileService.watch(root, { recursive: true }));
        disposables.register(this.fileService.onDidResourceChange(e => {
            if (this._root && e.affect(this._root)) {
                this._currentTreeService?.refresh();
            }
        }));
    }

    public switchMode(mode: TreeMode): void {
        // TODO
    }

    public layout(height?: number | undefined): void {
        if (!this._root) {
            return;
        }

        (this._mode === TreeMode.Notebook 
            ? this.notebookTreeService.layout(height) 
            : this.classicTreeService.layout(height)
        );
    }

    public async refresh(): Promise<void> {
        if (!this._root) {
            return;
        }

        return (this._mode === TreeMode.Notebook 
            ? this.notebookTreeService.refresh() 
            : this.classicTreeService.refresh()
        );
    }

    public async close(): Promise<void> {
        if (!this._root) {
            return;
        }

        // dispose the watching request on the root
        this._rootWatcher?.dispose();

        // close the actual tree service
        return (this._mode === TreeMode.Notebook 
            ? this.notebookTreeService.close() 
            : this.classicTreeService.close()
        );
    }
}