import { DataBuffer } from "src/base/common/file/buffer";
import { FileType } from "src/base/common/file/file";
import { resolve } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { Iterable } from "src/base/common/iterable";
import { String } from "src/base/common/string";
import { IIpcService } from "src/code/browser/service/ipcService";
import { NoteBook } from "src/code/common/model/notebook";
import { DEFAULT_CONFIG_PATH, EGlobalSettings, EUserSettings, GLOBAL_CONFIG_FILE_NAME, GLOBAL_CONFIG_PATH, IGlobalApplicationSettings, IGlobalNotebookManagerSettings, IUserNotebookManagerSettings, LOCAL_NOTA_DIR_NAME } from "src/code/common/service/configService/configService";
import { DEFAULT_CONFIG_FILE_NAME, IUserConfigService, LOCAL_CONFIG_FILE_NAME } from "src/code/common/service/configService/configService";
import { IGlobalConfigService } from "src/code/common/service/configService/configService";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const INoteBookManagerService = createDecorator<INoteBookManagerService>('notebook-manager-service');

export interface INoteBookManagerService {
    
    /**
     * @description when opening a directory to the Notebooks, a '.nota' 
     * directory will be loaded or created. And each NoteBook will be detected 
     * or initialized. If global config says no use of default config, a 
     * '.nota/user.config.json' will be created.
     * 
     * @param container The HTMLElement for rendering the whole notebooks.
     * @param path eg. D:\dev\AllNote
     */
    open(container: HTMLElement, path: string): Promise<void>;

    addExistedNoteBook(noteBook: NoteBook): void;
    getExistedNoteBook(noteBookName: string): NoteBook | null;

    getRootPath(): string;
}

/**
 * @class reads local configuration and build corresponding notebook structure. 
 * It maintains the data and states changes for every NoteBook instance.
 */
export class NoteBookManager implements INoteBookManagerService {

    // [field]

    public static focusedFileNode: HTMLElement | null = null;
    
    private readonly _noteBookMap: Map<string, NoteBook>;

    private _notaFolderFound: boolean; // not used
    private _notebookManagerRootPath: string = '';

    constructor(
        @IIpcService private readonly ipcService: IIpcService,
        @IFileService private readonly fileService: IFileService,
        @IUserConfigService private readonly userConfigService: IUserConfigService,
        @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
        
    ) {
        this._noteBookMap = new Map<string, NoteBook>();
        this._notaFolderFound = false;

        this.ipcService.onApplicationClose(async () => this.__onApplicationClose());
    }

    public async open(container: HTMLElement, path: string): Promise<void> {
        try {
            this._notebookManagerRootPath = path;
            
            // get all the names in the given directory
            const dir = await this.fileService.readDir(URI.fromFile(path));
            
            // get all the valid Notebook names in the given directory
            const userConfig = this.userConfigService.get<IUserNotebookManagerSettings>(EUserSettings.NotebookManager);
            const notebooks = Iterable.reduce<[string, FileType], string[]>(dir, [], (tot, [str, type]) => {
                if (type !== FileType.DIRECTORY) {
                    return tot;
                }

                if (!String.regExp(str, userConfig.noteBookManagerInclude.map(rule => new RegExp(rule))) && 
                    String.regExp(str, userConfig.noteBookManagerExclude.map(rule => new RegExp(rule)))
                ) {
                    return tot;
                }

                tot.push(str);
                return tot;
            });

            // create NoteBook Object for each sub-directory
            for (let name of notebooks) {
                const noteBook = new NoteBook(name, resolve(path, name));
                this._noteBookMap.set(name, noteBook);
                noteBook.create(container);
            }

            this._notaFolderFound = true;

        } catch(err) {
            throw err;
        }
    }

    public addExistedNoteBook(noteBook: NoteBook): void {
        const prevNoteBook = this._noteBookMap.get(noteBook.noteBookName);
        if (prevNoteBook) {
            prevNoteBook.destory();
            this._noteBookMap.set(noteBook.noteBookName, noteBook);
        } else {
            this._noteBookMap.set(noteBook.noteBookName, noteBook);
        }
    }

    public getExistedNoteBook(noteBookName: string): NoteBook | null {
        const res = this._noteBookMap.get(noteBookName);
        return res === undefined ? null : res;
    }

    public getRootPath(): string {
        return this._notebookManagerRootPath;
    }

    // [private helper method]

    /**
     * @description asynchronously write the notebook structure into the 
     * .nota/structure/`yourNoteBookName`.json.
     */
    private async __notebookWriteToJSON(notebook: NoteBook, name: string): Promise<void> {
        try {
            const rootpath = resolve(this._notebookManagerRootPath, LOCAL_NOTA_DIR_NAME, 'structure');
            await this.fileService.createFile(
                URI.fromFile(resolve(rootpath, name + '.json')), 
                DataBuffer.fromString(notebook.toJSON()), 
                { create: true, overwrite: true, unlock: true }
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
        const notebookConfig = this.globalConfigService.get<IGlobalNotebookManagerSettings>(EGlobalSettings.NotebookManager);
            
        // save global configuration first
        notebookConfig.previousNoteBookManagerDir = this.getRootPath();
        await this.globalConfigService.save(URI.fromFile(resolve(GLOBAL_CONFIG_PATH, LOCAL_NOTA_DIR_NAME, GLOBAL_CONFIG_FILE_NAME)));
        
        // save `user.config.json`
        if (notebookConfig.defaultConfigOn) {
            await this.userConfigService.save(URI.fromFile(resolve(DEFAULT_CONFIG_PATH, LOCAL_NOTA_DIR_NAME, DEFAULT_CONFIG_FILE_NAME)));
        }
        await this.userConfigService.save(URI.fromFile(resolve(this.getRootPath(), LOCAL_NOTA_DIR_NAME, LOCAL_CONFIG_FILE_NAME)));
        
    }

}
