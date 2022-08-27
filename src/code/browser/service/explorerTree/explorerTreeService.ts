import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { IFolderTreeService } from "src/code/browser/service/folderTree/folderTreeService";
import { INotebookTreeService } from "src/code/browser/service/notebookTree/notebookTreeService";
import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { IHostService } from "src/code/platform/host/common/hostService";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { IBrowserLifecycleService, ILifecycleService } from "src/code/platform/lifecycle/browser/browserLifecycleService";

export const IExplorerTreeService = createService<IExplorerTreeService>('explorer-tree-service');

/**
 * The base interface for any tree services.
 */
export interface ITreeService {
    /**
     * The parent container of the current tree view. `undefined` if tree is not 
     * opened yet.
     */
    readonly container: HTMLElement | undefined;

    /**
     * The root directory of the current tree. `undefined` if tree is not opened 
     * yet.
     */
    readonly root: URI | undefined;

    /**
     * Determine if the explorer tree is openning a directory.
     */
    readonly isOpened: boolean;

    /**
     * Fires when a file / page is clicked (not opened yet).
     */
    onOpen: Register<any>; // TODO

    /**
     * // TODO
     */
    init(container: HTMLElement, path: string): Promise<void>;
 
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
}

export interface IExplorerTreeService extends ITreeService {

    
}

/**
 * // TODO
 */
export class ExplorerTreeService implements IExplorerTreeService {

    // [field]

    private _root?: URI;
    private _openning: boolean;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IConfigService private readonly configService: IConfigService,
        @ILifecycleService lifecycleService: IBrowserLifecycleService,
        @IHostService hostService: IHostService,
        @IFolderTreeService private readonly folderTreeService: IFolderTreeService,
        @INotebookTreeService private readonly notebookTreeService: INotebookTreeService,
    ) {
        this._openning = false;



    }

    // [getter / setter]
    
    get container(): HTMLElement | undefined {
        
    }

    get root(): URI | undefined {
        return this._root;
    }

    get isOpened(): boolean {
        return this._openning;
    }

    // [public mehtods]

}