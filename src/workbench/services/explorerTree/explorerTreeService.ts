import { Disposable, DisposableManager, IDisposable } from "src/base/common/dispose";
import { RelayEmitter } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { IScheduler, Scheduler } from "src/base/common/util/async";
import { ClassicItem } from "src/workbench/services/classicTree/classicItem";
import { IClassicOpenEvent } from "src/workbench/services/classicTree/classicTree";
import { ClassicTreeService, IClassicTreeService } from "src/workbench/services/classicTree/classicTreeService";
import { ITreeService, TreeMode } from "src/workbench/services/explorerTree/treeService";
import { INotebookTreeService, NotebookTreeService } from "src/workbench/services/notebookTree/notebookTreeService";
import { SideViewConfiguration } from "src/workbench/parts/sideView/configuration.register";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IFileService } from "src/platform/files/common/fileService";
import { IResourceChangeEvent } from "src/platform/files/common/resourceChangeEvent";
import { createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

export const IExplorerTreeService = createService<IExplorerTreeService>('explorer-tree-service');

export interface IExplorerTreeService extends ITreeService<IClassicOpenEvent<ClassicItem> | any> {

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

    _serviceMarker: undefined;

    // [event]

    private readonly _onSelect = this.__register(new RelayEmitter<unknown>());
    public readonly onSelect = this._onSelect.registerListener;

    // [field]

    /** The root directory of the opened tree, undefined if not opened. */
    private _root?: URI;
    /** The current tree display mode. */
    private _mode: TreeMode;

    private readonly classicTreeService: IClassicTreeService;
    private readonly notebookTreeService: INotebookTreeService;

    private _currTreeDisposable?: IDisposable;
    private _currentTreeService?: ITreeService<unknown>;
    private _onDidResourceChangeScheduler?: IScheduler<IResourceChangeEvent>;

    private static readonly ON_RESOURCE_CHANGE_DELAY = 100;

    // [constructor]

    constructor(
        @IFileService private readonly fileService: IFileService,
        @IConfigurationService configurationService: IConfigurationService,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super();
        this._root = undefined;
        this._mode = configurationService.get<TreeMode>(SideViewConfiguration.ExplorerViewMode, TreeMode.Classic);
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
        const currTreeService: ITreeService<any> = (
            (this._mode === TreeMode.Notebook)
                ? this.notebookTreeService
                : this.classicTreeService
        );

        // try to create the tree service
        try {
            await currTreeService.init(container, root);
        } catch (error) {
            throw error;
        }

        // update the metadata only after successed
        this._currentTreeService = currTreeService;
        this._root = root;
        this._mode = mode ?? this._mode;
        this._onSelect.setInput(this._currentTreeService.onSelect);

        this.__registerTreeListeners(root);
    }

    public switchMode(mode: TreeMode): void {
        // TODO
    }

    public layout(height?: number | undefined): void {
        if (!this._root) {
            return;
        }
        this._currentTreeService!.layout(height);
    }

    public async refresh(): Promise<void> {
        if (!this._root) {
            return;
        }

        this._currentTreeService!.refresh();
    }

    public async close(): Promise<void> {
        if (!this._root) {
            return;
        }

        // dispose the watching request on the root
        this._currTreeDisposable!.dispose();
        this._currTreeDisposable = undefined;

        // close the actual tree service
        this._currentTreeService!.close();
        this._currentTreeService = undefined;
    }

    // [private helper methods]

    /**
     * @description Registers tree related listeners when initializing.
     */
    private __registerTreeListeners(root: URI): void {

        // create a disposable for all the current tree business
        const disposables = new DisposableManager();
        this._currTreeDisposable = disposables;

        // on did resource change callback
        this._onDidResourceChangeScheduler = new Scheduler(
            ExplorerTreeService.ON_RESOURCE_CHANGE_DELAY,
            (events: IResourceChangeEvent[]) => {
                if (!root || !this._currentTreeService) {
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
                    this._currentTreeService.refresh();
                }
            }
        );

        disposables.register(this._onDidResourceChangeScheduler);
        disposables.register(this.fileService.watch(root, { recursive: true }));
        disposables.register(this.fileService.onDidResourceChange(e => {
            this._onDidResourceChangeScheduler?.schedule(e.wrap());
        }));
    }
}