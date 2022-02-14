import { EVENT_EMITTER } from "src/base/common/event";
import { resolve } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { createDir, createFile, dirFilter, isDirExisted, isFileExisted } from "src/base/node/io";
import { IIpcService } from "src/code/browser/service/ipcService";
import { NoteBook } from "src/code/common/model/notebook";
import { DEFAULT_CONFIG_PATH, EGlobalSettings, EUserSettings, GLOBAL_CONFIG_FILE_NAME, GLOBAL_CONFIG_PATH, IGlobalApplicationSettings, IGlobalNotebookManagerSettings, IUserNotebookManagerSettings } from "src/code/common/service/configService/configService";
import { DEFAULT_CONFIG_FILE_NAME, IUserConfigService, LOCAL_CONFIG_FILE_NAME } from "src/code/common/service/configService/configService";
import { IGlobalConfigService } from "src/code/common/service/configService/configService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const LOCAL_MDNOTE_DIR_NAME = '.mdnote';

export const INoteBookManagerService = createDecorator<INoteBookManagerService>('notebook-manager-service');

export interface INoteBookManagerService {

    readonly noteBookMap: Map<string, NoteBook>;
    readonly noteBookConfig: Object;
    mdNoteFolderFound: boolean;

    init(): Promise<void>;
    open(path: string): Promise<void>;
    getRootPath(): string;
    addExistedNoteBook(noteBook: NoteBook): void;
    getExistedNoteBook(noteBookName: string): NoteBook | null;
}

/**
 * @class reads local configuration and build corresponding notebook structure. 
 * It maintains the data and states changes for every NoteBook instance.
 */
export class NoteBookManager implements INoteBookManagerService {

    public readonly noteBookMap: Map<string, NoteBook>;
    // not used
    public readonly noteBookConfig!: Object;

    public static focusedFileNode: HTMLElement | null = null;

    // FIXME: remove later
    public static rootPath: string;
    private _noteBookManagerRootPath: string = '';

    // not used
    public mdNoteFolderFound: boolean;

    constructor(
        @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
        @IUserConfigService private readonly userConfigService: IUserConfigService,
        @IIpcService private readonly ipcService: IIpcService,
        
    ) {
        this.noteBookMap = new Map<string, NoteBook>();
        this.mdNoteFolderFound = false;

        this.ipcService.onApplicationClose(async () => this.__onApplicationClose());
    }

    /**
     * @description the function first try to reads the global config named as 
     * 'mdnote.config.json' at application root directory. NoteBookManager will
     * either do nothing or start the most recent opened directory.
     */
    public async init(): Promise<void> {

        try {
            const config = this.globalConfigService.get<IGlobalNotebookManagerSettings>(EGlobalSettings.NotebookManager);
            
            // FIXME: it seems like this function is invoked before the userConfigService.init(local path) is invoked.

            if (config.startPreviousNoteBookManagerDir) {
                
                const prevOpenedPath = config.previousNoteBookManagerDir;
                if (prevOpenedPath == '') {
                    // const OpenPath = "/Users/apple/Desktop/filesForTesting";
                    // EVENT_EMITTER.emit('EOpenNoteBookManager', OpenPath);
                    // user never opened one before, we ignore this request
                } else {
                    EVENT_EMITTER.emit('EOpenNoteBookManager', prevOpenedPath);
                }
            }

        } catch(err) {
            throw err;
        }
    }

    /**
     * @description when opening a directory to the NoteBooks, a '.mdnote' 
     * directory will be loaded or created. And each NoteBook will be detected 
     * or initialized. If global config says no use of default config, a 
     * '.mdnote/user.config.json' will be created.
     * 
     * @param path eg. D:\dev\AllNote
     */
    public async open(path: string): Promise<void> {
        try {
            this._noteBookManagerRootPath = path;
            NoteBookManager.rootPath = path;

            // get configuration
            const config = this.userConfigService.get<IUserNotebookManagerSettings>(EUserSettings.NotebookManager);
            
            // get valid NoteBook names in the given dir
            const noteBooks: string[] = await dirFilter(
                path, 
                config.noteBookManagerExclude, 
                config.noteBookManagerInclude,
            );
            
            // create NoteBook Object for each subdirectory
            for (let name of noteBooks) {
                const noteBook = new NoteBook(name, resolve(path, name));
                this.noteBookMap.set(name, noteBook);
                noteBook.create(document.getElementById('fileTree-container')!);
            }

            // data in cache for each NoteBook is now ready.
            
            // get global configuration first
            const globalConfig = this.globalConfigService.get<IGlobalApplicationSettings>(EGlobalSettings.Application);

            // try to find .mdnote
            const isExisted = await isDirExisted(path, LOCAL_MDNOTE_DIR_NAME);
            if (isExisted) {
                await this._importNoteBookConfig(globalConfig);
            } else {
                await this._createNoteBookConfig(globalConfig);
            }

            this.mdNoteFolderFound = true;

        } catch(err) {
            throw err;
        }
    }

    /**
     * @description calls only when folder '.mdnote' exists, we first check if 
     * the structure is correct. 
     * 
     * Then we check if each notebook has its coressponding `structure`.json, if
     * not, we initialize one. If exists, we import that into the cache.
     * 
     * If defaultConfigOn is true, we read default config, otherwise we read 
     * local config.
     */
    private async _importNoteBookConfig(setting: IGlobalApplicationSettings): Promise<void> {
        
        try {
            const ROOT = resolve(this._noteBookManagerRootPath, LOCAL_MDNOTE_DIR_NAME);
        
            // check validation for the .mdnote structure
            await this._validateNoteBookConfig();
            
            if (setting.defaultConfigOn === false) {
                // read `user.config.json`
                await this.userConfigService.init(URI.fromFile(resolve(ROOT, DEFAULT_CONFIG_FILE_NAME)));
            }

            // check if missing any NoteBook structure in '.mdnote/structure'
            const structureRoot = resolve(ROOT, 'structure');
            for (let pair of this.noteBookMap) {
                const name = pair[0];
                const noteBook = pair[1];
                
                const isExisted = await isFileExisted(structureRoot, name + '.json');
                if (isExisted) {
                    // read NoteBook structure into cache
                    // TODO: complete
                } else {
                    // missing NoteBook structure, we initialize one
                    await this._noteBookWriteToJSON(noteBook, name);
                }   
            }
        } catch(err) {
            throw err;
        }

    }

    /**
     * @description calls only when folder '.mdnote' does not exists, we create
     * the default '.mdnote' structure, initialize each notebook `structure`.json.
     * 
     * If defaultConfigOn is true, we read or create default config. Otherwise
     * we create a new local config.
     */
    private async _createNoteBookConfig(setting: IGlobalApplicationSettings): Promise<void> {
        try {
            // init folder structure
            const ROOT = await createDir(this._noteBookManagerRootPath, LOCAL_MDNOTE_DIR_NAME);
            
            await createDir(ROOT, 'structure');
            await createDir(ROOT, 'log');
            
            if (setting.defaultConfigOn === false) {
                // init local user.config.json
                await createFile(ROOT, LOCAL_CONFIG_FILE_NAME);
                await this.userConfigService.save(URI.fromFile(resolve(ROOT, LOCAL_CONFIG_FILE_NAME)));
            }

            // init noteBook structure
            for (let pair of this.noteBookMap) {
                const name = pair[0];
                const noteBook = pair[1];
                await this._noteBookWriteToJSON(noteBook, name);
            }

        } catch(err) {
            throw err;
        }
    }

    /**
     * @description check validation in '.mdnode'.
     */
    private async _validateNoteBookConfig(): Promise<void> {
        try {
            const ROOT = resolve(this._noteBookManagerRootPath, LOCAL_MDNOTE_DIR_NAME);
            if (await isDirExisted(ROOT, 'structure') === false) {
                await createDir(ROOT, 'structure');
            }
            if (await isDirExisted(ROOT, 'log') === false) {
                await createDir(ROOT, 'log');
            }
        } catch(err) {
            throw err;
        }
    }

    public addExistedNoteBook(noteBook: NoteBook): void {
        const prevNoteBook = this.noteBookMap.get(noteBook.noteBookName);
        if (prevNoteBook) {
            prevNoteBook.destory();
            this.noteBookMap.set(noteBook.noteBookName, noteBook);
        } else {
            this.noteBookMap.set(noteBook.noteBookName, noteBook);
        }
    }

    public getExistedNoteBook(noteBookName: string): NoteBook | null {
        const res = this.noteBookMap.get(noteBookName);
        return res === undefined ? null : res;
    }

    /**
     * @description asynchronously write the notebook structure into the 
     * .mdnote/structure/`yourNoteBookName`.json.
     */
    private async _noteBookWriteToJSON(notebook: NoteBook, name: string): Promise<void> {
        try {
            const rootpath = resolve(this._noteBookManagerRootPath, LOCAL_MDNOTE_DIR_NAME, 'structure');
            await createFile(rootpath, name + '.json', notebook.toJSON());
        } catch(err) {
            throw err;
        }
    }

    public getRootPath(): string {
        return this._noteBookManagerRootPath;
    }

    /**
     * @description Invokes when the application is about to be closed.
     */
    private async __onApplicationClose(): Promise<void> {
        
        // get notebook configuration
        const notebookConfig = this.globalConfigService.get<IGlobalNotebookManagerSettings>(EGlobalSettings.NotebookManager);
            
        // save global configuration first
        notebookConfig.previousNoteBookManagerDir = this.getRootPath();
        await this.globalConfigService.save(URI.fromFile(resolve(GLOBAL_CONFIG_PATH, LOCAL_MDNOTE_DIR_NAME, GLOBAL_CONFIG_FILE_NAME)));
        
        // get application configuration
        const appConfig = this.globalConfigService.get<IGlobalApplicationSettings>(EGlobalSettings.Application);
        
        // save `user.config.json`
        if (appConfig.defaultConfigOn) {
            await this.userConfigService.save(URI.fromFile(resolve(DEFAULT_CONFIG_PATH, LOCAL_MDNOTE_DIR_NAME, DEFAULT_CONFIG_FILE_NAME)));
        }
        await this.userConfigService.save(URI.fromFile(resolve(this.getRootPath(), LOCAL_MDNOTE_DIR_NAME, LOCAL_CONFIG_FILE_NAME)));
        
    }

}
