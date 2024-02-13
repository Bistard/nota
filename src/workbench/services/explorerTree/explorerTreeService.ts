import { Disposable, DisposableManager } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IScheduler, Scheduler } from "src/base/common/utilities/async";
import { FileItem } from "src/workbench/services/fileTree/fileItem";
import { IFileTreeOpenEvent } from "src/workbench/services/fileTree/fileTree";
import { FileTreeService, IFileTreeService } from "src/workbench/services/fileTree/fileTreeService";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IFileService } from "src/platform/files/common/fileService";
import { IResourceChangeEvent } from "src/platform/files/common/resourceChangeEvent";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { ILogService } from "src/base/common/logger";
import { Time } from "src/base/common/date";
import { AsyncResult, ok } from "src/base/common/result";
import { IExplorerTreeService } from "src/workbench/services/explorerTree/treeService";

export class ExplorerTreeService extends Disposable implements IExplorerTreeService {

    declare _serviceMarker: undefined;

    // [event]

    public readonly onSelect: Register<IFileTreeOpenEvent<FileItem>>;

    // [field]

    /** The root directory of the opened tree, undefined if not opened. */
    private _root?: URI;
    
    private readonly _treeService: IFileTreeService;
    private _currTreeDisposable?: DisposableManager;

    private _onDidResourceChangeScheduler?: IScheduler<IResourceChangeEvent>;
    private static readonly ON_RESOURCE_CHANGE_DELAY = Time.ms(100);

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IConfigurationService configurationService: IConfigurationService,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super();
        this._root = undefined;
        this._treeService = this.__register(instantiationService.createInstance(FileTreeService));
        this.onSelect = this._treeService.onSelect;
        
        this._currTreeDisposable = new DisposableManager();
    }

    // [getter / setter]

    get container(): HTMLElement | undefined {
        return this.isOpened ? this._treeService.container : undefined;
    }

    get root(): URI | undefined {
        return this._root;
    }

    get rootItem(): FileItem | undefined {
        return this._treeService.rootItem;
    }

    get isOpened(): boolean {
        return !!this._root;
    }

    // [public mehtods]

    public init(container: HTMLElement, root: URI): AsyncResult<void, Error> {
        return this._treeService.init(container, root)
        .andThen(() => {
            // try to close the previous tree service if any
            this.close();

            this._root = root;
            this.__registerTreeListeners(root);
            return ok();
        });
    }

    public layout(height?: number | undefined): void {
        if (!this._root) {
            return;
        }
        this._treeService.layout(height);
    }

    public async refresh(): Promise<void> {
        if (!this._root) {
            return;
        }
        this._treeService.refresh();
    }

    public async close(): Promise<void> {
        if (!this._root) {
            return;
        }
        this._treeService.close();
        
        this._currTreeDisposable?.dispose();
        this._currTreeDisposable = undefined;
        
        this._onDidResourceChangeScheduler?.dispose();
        this._onDidResourceChangeScheduler = undefined;
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
                    this._treeService.refresh();
                }
            }
        );

        this.fileService.watch(root, { recursive: true })
            .match<void>(
                (disposable) => disposables.register(disposable),
                error => this.logService.warn('ExplorerTreeService', 'Cannot watch the root directory.', { at: URI.toString(root), error: error, }),
            );
        
        disposables.register(this._onDidResourceChangeScheduler);
        disposables.register(this.fileService.onDidResourceChange(e => {
            this._onDidResourceChangeScheduler?.schedule(e.wrap());
        }));
    }
}