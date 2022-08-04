import { ITreeMouseEvent, ITreeSpliceEvent } from "src/base/browser/secondary/tree/tree";
import { Disposable, DisposableManager } from "src/base/common/dispose";
import { Register, RelayEmitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { FileType } from "src/base/common/file/file";
import { join, resolve } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { Iterable } from "src/base/common/util/iterable";
import { String } from "src/base/common/util/string";
import { IIpcService } from "src/code/browser/service/ipcService";
import { ExplorerItem } from "src/code/browser/workbench/actionView/explorer/explorerItem";
import { IExplorerOpenEvent } from "src/code/browser/workbench/actionView/explorer/explorerTree";
import { Notebook } from "src/code/common/model/notebook";
import { DEFAULT_CONFIG_PATH, EGlobalSettings, EUserSettings, GLOBAL_CONFIG_FILE_NAME, GLOBAL_CONFIG_PATH, IGlobalNotebookManagerSettings, IUserNotebookManagerSettings, LOCAL_NOTA_DIR_NAME } from "src/code/common/service/configService/configService";
import { DEFAULT_CONFIG_FILE_NAME, IUserConfigService, LOCAL_CONFIG_FILE_NAME } from "src/code/common/service/configService/configService";
import { IGlobalConfigService } from "src/code/common/service/configService/configService";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const INotebookGroupService = createDecorator<INotebookGroupService>('notebook-manager-service');

export interface INotebookGroupService {
    
    /**
     * Fires when a file / notepage in the notebook is about to be opened.
     */
    onOpen: Register<IExplorerOpenEvent<ExplorerItem>>;

    /**
     * Fires when the content of the current notebook is changed.
     */
    onDidChangeContent: Register<ITreeSpliceEvent<ExplorerItem | null, void>>;

    /**
     * @description when opening a directory to the Notebooks, a '.nota' 
     * directory will be loaded or created. And each Notebook will be detected 
     * or initialized. If global config says no use of default config, a 
     * '.nota/user.config.json' will be created.
     * 
     * @param container The HTMLElement for rendering the whole notebooks.
     * @param path eg. D:\dev\AllNote
     * 
     * @throws An exception will be thrown if cannot open properly.
     */
    open(container: HTMLElement, path: string): Promise<Notebook>;

    /**
     * @description Switches to the {@link Notebook} with the given name.
     * @param name The name of the notebook.
     * 
     * @throws An exception will be thrown if the notebook is not existed.
     */
    switchTo(name: string): Promise<Notebook>;

    /**
     * @description Given the height, re-layouts the height of the whole view.
     * @param height The given height.
     * 
     * @note If no values are provided, it will sets to the height of the 
     * corresponding DOM element of the view.
     */
    layout(height?: number): void;

    /**
     * @description Returns the root path of the {@link NotebookGroup}.
     */
    rootPath(): string;

    /**
     * @description Returns the current displaying {@link Notebook}.
     */
    current(): Notebook | undefined;

    /**
     * @description Refreshes the current {@link Notebook}.
     */
    refresh(): Promise<void>;
}

/**
 * @class // TODO
 */
export class NotebookGroup extends Disposable implements INotebookGroupService {

    // [field]

    public static focusedFileNode: HTMLElement | null = null;
    
    /** Registrations for all the listeners to the current notebook. */
    private readonly _notebookListeners = new DisposableManager();

    /** The root path of the manager. */
    private _rootPath: string = '';

    /** Stores all the opened notebooks in memory. */
    private readonly _group: Map<string, Notebook> = new Map<string, Notebook>();

    /** The current displaying notebook. */
    private _current: Notebook | undefined = undefined;

    // [constructor]

    constructor(
        @IIpcService private readonly ipcService: IIpcService,
        @IFileService private readonly fileService: IFileService,
        @IUserConfigService private readonly userConfigService: IUserConfigService,
        @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
        
    ) {
        super();
        this.ipcService.onApplicationClose(async () => this.__onApplicationClose());
    }

    // [event]

    private readonly _onOpen = this.__register(new RelayEmitter<IExplorerOpenEvent<ExplorerItem>>());
    public readonly onOpen = this._onOpen.registerListener;

    private readonly _onDidChangeContent = this.__register(new RelayEmitter<ITreeSpliceEvent<ExplorerItem | null, void>>());
    public readonly onDidChangeContent = this._onDidChangeContent.registerListener;

    // [public method]

    public async open(container: HTMLElement, path: string): Promise<Notebook> {

        this.__reset();

        try {
            this._rootPath = path;
            
            // read the configuration
            const userConfig = this.userConfigService.get<IUserNotebookManagerSettings>(EUserSettings.NotebookGroup);
            
            // get all the names in the given directory
            const dir = await this.fileService.readDir(URI.fromFile(path));
            
            // get all the valid Notebook names in the given directory
            const notebooks = Iterable.reduce<[string, FileType], string[]>(dir, [], (tot, [str, type]) => {
                if (type !== FileType.DIRECTORY) {
                    return tot;
                }

                if (!String.regExp(str, userConfig.notebookManagerInclude.map(rule => new RegExp(rule))) && 
                    String.regExp(str, userConfig.notebookManagerExclude.map(rule => new RegExp(rule)))
                ) {
                    return tot;
                }

                tot.push(str);
                return tot;
            });

            /**
             * Only displaying one of the notebook, will try to open a previous
             * opened notebook, if not, opens the first one.
             */
            const prevNotebook = userConfig.previousOpenedNotebook;
            let notebook: Notebook | undefined;
            
            const ifOpenPrevious = !!prevNotebook && (notebooks.indexOf(prevNotebook) !== -1);
            if (ifOpenPrevious) {
                notebook = await this.__switchOrCreateNotebook(container, path, userConfig, prevNotebook);
            } else {
                notebook = await this.__switchOrCreateNotebook(container, path, userConfig, notebooks[0]!);
            }

            // fail
            if (notebook === undefined) {
                const resolvedPath = join(path, ifOpenPrevious ? prevNotebook : notebooks[0]!);
                throw new Error(`cannot open the notebook with the path ${resolvedPath}`);
            }

            // success
            return notebook;
        } 
        
        catch(err) {
            throw err;
        }
    }

    public async switchTo(name: string): Promise<Notebook> {
        // TODO
        return Promise.resolve(this._current!);
    }

    public layout(height?: number): void {
        if (this._current) {
            this._current.layout(height);
        }
    }

    public rootPath(): string {
        return this._rootPath;
    }

    public current(): Notebook | undefined {
        return this._current;
    }

    public refresh(): Promise<void> {
        if (this._current === undefined) {
            return Promise.resolve(undefined);
        }
        return this._current.refresh();
    }

    public override dispose(): void {
        super.dispose();
        this._notebookListeners.dispose();
    }

    // [private helper method]

    /**
     * @description Given the name of the notebook, Switch to the notebook if 
     * already existed in the memory, otherwise we create a new one and stores 
     * it in the memory.
     * @param container The container for the creation of the notebook.
     * @param root The root path for the creation of the notebook.
     * @param config The configuration for later updating.
     * @param name The name of the notebook.
     * @returns A promise that resolves either undefined or a {@link Notebook}.
     */
    private async __switchOrCreateNotebook(
        container: HTMLElement, 
        root: string, 
        config: IUserNotebookManagerSettings, 
        name: string
    ): Promise<Notebook | undefined> {
        
        // do nothing if the notebook is already displaying.
        let notebook = this._group.get(name);
        if (name === this._current?.name) {
            return notebook;
        }
 
        // notebook is in the memory, we simply display it.
        if (notebook) {
            notebook.setVisible(true);
        } 
        
        // notebook not in the memory, we create a notebook.
        else {
            notebook = new Notebook(container, this.fileService);
            this._group.set(name, notebook);
            
            // start building the whole notebook asynchronously.
            const result = await notebook.init(URI.fromFile(resolve(root, name)));

            // failed
            if (result === false) {
                this._current = undefined;
                return undefined;
            }
            
            // success
            this._current = notebook;
            config.previousOpenedNotebook = this._current.name;
            this.userConfigService.set(EUserSettings.NotebookGroup, config);
        }

        // re-plugin the input emitters
        this.__registerNotebookListeners(notebook);

        return notebook;
    }

    /**
     * @description asynchronously write the notebook structure into the 
     * .nota/structure/`yourNotebookName`.json.
     */
    private async __notebookWriteToJSON(notebook: Notebook, name: string): Promise<void> {
        try {
            const rootpath = resolve(this._rootPath, LOCAL_NOTA_DIR_NAME, 'structure');
            await this.fileService.createFile(
                URI.fromFile(resolve(rootpath, name + '.json')), 
                DataBuffer.fromString(notebook.toJSON()), 
                { overwrite: true },
            );
        } catch(err) {
            throw err;
        }
    }

    /**
     * @description Invokes when the application is about to be closed.
     */
    private async __onApplicationClose(): Promise<void> {
        
        // get notebook configuration
        const notebookConfig = this.globalConfigService.get<IGlobalNotebookManagerSettings>(EGlobalSettings.NotebookGroup);

        // save global configuration first
        notebookConfig.previousNotebookManagerDir = this.rootPath();
        await this.globalConfigService.save(URI.fromFile(resolve(GLOBAL_CONFIG_PATH, LOCAL_NOTA_DIR_NAME, GLOBAL_CONFIG_FILE_NAME)));
        
        // save `user.config.json`
        if (notebookConfig.defaultConfigOn) {
            await this.userConfigService.save(URI.fromFile(resolve(DEFAULT_CONFIG_PATH, LOCAL_NOTA_DIR_NAME, DEFAULT_CONFIG_FILE_NAME)));
        }
        await this.userConfigService.save(URI.fromFile(resolve(this.rootPath(), LOCAL_NOTA_DIR_NAME, LOCAL_CONFIG_FILE_NAME)));
        
    }

    /**
     * @description Re-plugins the emitters of the current notebook as the input.
     * @param notebook The provided {@link Notebook}.
     */
    private __registerNotebookListeners(notebook: Notebook): void {

        this._onOpen.setInput(notebook.onOpen);
        this._onDidChangeContent.setInput(notebook.onDidChangeContent);

    }

    /**
     * @description Resets the {@link NotebookGroup} to the initial state.
     */
    private __reset(): void {
        this._group.clear();
        this._current = undefined;
        this._rootPath = '';
        this._notebookListeners.dispose();
    }

}
