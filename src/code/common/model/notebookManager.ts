import { EVENT_EMITTER } from "src/base/common/event";
import { pathJoin } from "src/base/common/string";
import { ConfigService, DEFAULT_CONFIG_FILE_NAME, DEFAULT_CONFIG_PATH, GLOBAL_CONFIG_FILE_NAME, LOCAL_CONFIG_FILE_NAME } from "src/code/common/service/configService";
import { createDir, createFile, dirFilter, isDirExisted, isFileExisted } from "src/base/node/file";
import { NoteBook } from "src/code/common/model/notebook";
import { GlobalConfigService } from "src/code/common/service/globalConfigService";
import { createDecorator } from "../service/instantiation/decorator";

export const LOCAL_MDNOTE_DIR_NAME = '.mdnote';

export const INoteBookManagerService = createDecorator<INoteBookManagerService>('notebook-manager-service');

export interface INoteBookManagerService {

    readonly noteBookMap: Map<string, NoteBook>;
    readonly noteBookConfig: Object;
    noteBookManagerRootPath: string;
    mdNoteFolderFound: boolean;

    init(appRootPath: string): Promise<void>;
    open(path: string): Promise<void>;
    addExistedNoteBook(noteBook: NoteBook): void;
    getExistedNoteBook(noteBookName: string): NoteBook | null;
    readOrCreateConfigJSON(path: string, configNameWtihType: string): Promise<void>;
    readOrCreateGlobalConfigJSON(path: string, configNameWtihType: string): Promise<void>;
}

/**
 * @description reads local configuration and build corresponding notebook 
 * structure. It maintains the data and states changes for every NoteBook 
 * instance.
 */
export class NoteBookManager implements INoteBookManagerService {

    public readonly noteBookMap: Map<string, NoteBook>;
    // not used
    public readonly noteBookConfig!: Object;

    public static focusedFileNode: HTMLElement | null = null;

    public noteBookManagerRootPath: string = '';

    // not used
    public mdNoteFolderFound: boolean;

    constructor() {
        this.noteBookMap = new Map<string, NoteBook>();
        
        this.mdNoteFolderFound = false;
    }

    /**
     * @description the function first try to reads the global config named as 
     * 'mdnote.config.json' at application root directory. NoteBookManager will
     * either do nothing or start the most recent opened directory.
     * 
     * @param appRootPath app root dir eg. D:\dev\MarkdownNote
     */
    public async init(appRootPath: string): Promise<void> {
        try {
            // read global configuration
            await this.readOrCreateGlobalConfigJSON(appRootPath, GLOBAL_CONFIG_FILE_NAME);

            if (GlobalConfigService.Instance.startPreviousNoteBookManagerDir) {
            
                const prevOpenedPath = GlobalConfigService.Instance.previousNoteBookManagerDir;
                if (prevOpenedPath == '') {
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
     * '.mdnote/config.json' will be created.
     * 
     * @param path eg. D:\dev\AllNote
     */
    public async open(path: string): Promise<void> {
        try {
            this.noteBookManagerRootPath = path;
            
            // get valid NoteBook names in the given dir
            const noteBooks: string[] = await dirFilter(
                path, 
                ConfigService.Instance.noteBookManagerExclude, 
                ConfigService.Instance.noteBookManagerInclude,
            );
            
            // create NoteBook Object for each subdirectory
            for (let name of noteBooks) {
                const noteBook = new NoteBook(name, pathJoin(path, name));
                this.noteBookMap.set(name, noteBook);
                noteBook.create(document.getElementById('fileTree-container')!);
            }

            // data in cache for each NoteBook is now ready.
            
            // try to find .mdnote
            const isExisted = await isDirExisted(path, LOCAL_MDNOTE_DIR_NAME);
            
            if (isExisted) {
                await this._importNoteBookConfig();
            } else {
                await this._createNoteBookConfig();
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
    private async _importNoteBookConfig(): Promise<void> {
        
        try {
            const ROOT = pathJoin(this.noteBookManagerRootPath, LOCAL_MDNOTE_DIR_NAME);
        
            // check validation for the .mdnote structure
            await this._validateNoteBookConfig();
            
            if (GlobalConfigService.Instance.defaultConfigOn) {
                // read default config
                await this.readOrCreateConfigJSON(
                    DEFAULT_CONFIG_PATH,
                    DEFAULT_CONFIG_FILE_NAME
                );
            } else {
                // read local config
                await this.readOrCreateConfigJSON(
                    ROOT,
                    LOCAL_CONFIG_FILE_NAME
                );
            }

            // check if missing any NoteBook structure in '.mdnote/structure'
            const structureRoot = pathJoin(ROOT, 'structure');
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
    private async _createNoteBookConfig(): Promise<void> {
        try {
            // init folder structure
            const ROOT = await createDir(this.noteBookManagerRootPath, LOCAL_MDNOTE_DIR_NAME);
            
            await createDir(ROOT, 'structure');
            await createDir(ROOT, 'log');
            
            if (GlobalConfigService.Instance.defaultConfigOn) {
                // read default config.json
                await this.readOrCreateConfigJSON(
                    DEFAULT_CONFIG_PATH,
                    DEFAULT_CONFIG_FILE_NAME
                );
            } else {
                // init local config.json
                await createFile(ROOT, LOCAL_CONFIG_FILE_NAME);
                await ConfigService.Instance.writeToJSON(
                    ROOT, 
                    LOCAL_CONFIG_FILE_NAME
                );
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
            const ROOT = pathJoin(this.noteBookManagerRootPath, LOCAL_MDNOTE_DIR_NAME);
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
     * @description reads or creates a `configNameWtihType` file in the given 
     * path, then creates the singleton instance of a ConfigService.
     * 
     * @param path eg. D:\dev\AllNote
     * @param configNameWtihType eg. D:\dev\AllNote\config.json
     */
    public async readOrCreateConfigJSON(path: string, configNameWtihType: string): Promise<void> {
        try {
            if (await isFileExisted(path, configNameWtihType) === false) {
                await createFile(path, configNameWtihType);
                await ConfigService.Instance.writeToJSON(path, configNameWtihType);
            } else {
                await ConfigService.Instance.readFromJSON(path, configNameWtihType);
            }
        } catch(err) {
            throw err;
        }
    }

    /**
     * @description function does exact same thing as 'this.readOrCreateConfigJSON()' 
     * does, the only difference is that this function is for GlobalConfigService.
     * 
     * @param path eg. D:\dev\MarkdownNote
     * @param configNameWtihType eg. D:\dev\AllNote\mdnote.config.json
     */
     public async readOrCreateGlobalConfigJSON(path: string, configNameWtihType: string): Promise<void> {
        try {
            if (await isFileExisted(path, configNameWtihType) === false) {
                await createFile(path, configNameWtihType);
                await GlobalConfigService.Instance.writeToJSON(path, configNameWtihType);
            } else {
                await GlobalConfigService.Instance.readFromJSON(path, configNameWtihType);
            }
        } catch(err) {
            throw err;
        }
    }

    /**
     * @description asynchronously write the notebook structure into the 
     * .mdnote/structure/`yourNoteBookName`.json.
     */
    private async _noteBookWriteToJSON(notebook: NoteBook, name: string): Promise<void> {
        try {
            const rootpath = pathJoin(this.noteBookManagerRootPath, LOCAL_MDNOTE_DIR_NAME, 'structure');
            await createFile(rootpath, name + '.json', notebook.toJSON());
        } catch(err) {
            throw err;
        }
    }

}