import { Disposable } from "src/base/common/dispose";
import { RelayEmitter } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { ClassicOpenEvent } from "src/code/browser/service/classicTree/classicTree";
import { ClassicTreeService, IClassicTreeService } from "src/code/browser/service/classicTree/classicTreeService";
import { ITreeService, TreeMode } from "src/code/browser/service/explorerTree/treeService";
import { INotebookTreeService, NotebookTreeService } from "src/code/browser/service/notebookTree/notebookTreeService";
import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { BuiltInConfigScope } from "src/code/platform/configuration/common/configRegistrant";
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
     * // TODO
     */
    switch(mode: TreeMode): void;
}

/**
 * // TODO
 */
export class ExplorerTreeService extends Disposable implements IExplorerTreeService {

    // [event]

    private readonly _onDidClick = this.__register(new RelayEmitter<any>());
    public readonly onDidClick = this._onDidClick.registerListener;

    // [field]

    private _root?: URI;
    private _opened: boolean;
    private _mode: TreeMode;

    private readonly classicTreeService: IClassicTreeService;
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
        return this._opened;
    }

    // [public mehtods]

    public async init(container: HTMLElement, root: URI, mode?: TreeMode): Promise<void> {
        this._root = root;
        this._opened = true;
        if (mode) {
            this._mode = mode;
        }

        if (this._mode === TreeMode.Notebook) {
            this.notebookTreeService.init(container, root);
            this._onDidClick.setInput(this.notebookTreeService.onDidClick);
        } else {
            this.classicTreeService.init(container, root);
            this._onDidClick.setInput(this.classicTreeService.onDidClick);
        }
    }

    public switch(mode: TreeMode): void {

    }

    public layout(height?: number | undefined): void {
        if (this._opened === false) {
            return;
        }

        (this._mode === TreeMode.Notebook 
            ? this.notebookTreeService.layout(height) 
            : this.classicTreeService.layout(height)
        );
    }

    public async refresh(): Promise<void> {
        if (this._opened === false) {
            return;
        }

        await (this._mode === TreeMode.Notebook 
            ? this.notebookTreeService.refresh() 
            : this.classicTreeService.refresh()
        );
    }

    public async close(): Promise<void> {
        if (this._opened === false) {
            return;
        }

        return (this._mode === TreeMode.Notebook 
            ? this.notebookTreeService.close() 
            : this.classicTreeService.close()
        );
    }
}