import { pathJoin } from "src/base/common/string";
import { ConfigModule } from "src/base/config";
import { createDir, createFile, directoryNoteBookParser, isDirExisted, isFileExisted } from "src/base/node/file";
import { INoteBook, NoteBook } from "src/code/common/notebook";

export const MDNOTE_LOCAL_DIR_NAME = '.mdnote';

export interface INoteBookManager {
    readonly noteBookMap: Map<string, NoteBook>;
    readonly noteBookConfig: Object;

    /**
     * @description a '.mdnote' directory will be loaded or created. And each
     * NoteBook will be detected or initialized.
     * 
     * @param path eg. D:\dev\AllNote
     */
    init(path: string): Promise<void>;

    addExistedNoteBook(noteBook: NoteBook): void;

    getExistedNoteBook(noteBookName: string): NoteBook | null;
}

/**
 * @description reads local configuration and build corresponding notebook 
 * structure. It maintains the data and states changes for every NoteBook 
 * instance.
 */
export class NoteBookManager implements INoteBookManager {

    public readonly noteBookMap: Map<string, NoteBook>;
    // not used
    public readonly noteBookConfig!: Object;

    private _rootPath!: string;

    // not used
    private _mdNoteFolderFound: boolean;

    constructor() {
        this.noteBookMap = new Map<string, NoteBook>();
        this._mdNoteFolderFound = false;
    }

    public async init(path: string): Promise<void> {
        try {
            this._rootPath = path;
            
            await this._directoryParser();

            this.noteBookMap.forEach((noteBook: INoteBook, name: string) => {
                noteBook.create(document.getElementById('fileTree-container')!);
            });
            
            // data in cache for each NoteBook is now ready.
            
            const isExisted = await isDirExisted(this._rootPath, MDNOTE_LOCAL_DIR_NAME);
            
            if (isExisted) {
                await this._importMarkdownNoteConfig();
            } else {
                await this._createMarkdownNoteConfig();
            }

            this._mdNoteFolderFound = true;

        } catch(err) {
            throw err;
        }
    }

    /**
     * @description parses every notebook in '_rootPath' path. After obtains
     * each name of the notebook, we create an instance of NoteBook for each one.
     */
    private async _directoryParser(): Promise<void> {
        
        try {
            const noteBooks: string[] = await directoryNoteBookParser(this._rootPath, ConfigModule.Instance.parserExcludeDir, ConfigModule.Instance.parserIncludeDir)
        
            for (let name of noteBooks) {
                // create NoteBook Object for each subdirectory
                const noteBook = new NoteBook(name, pathJoin(this._rootPath, name));
                this.noteBookMap.set(name, noteBook);
            }
        } catch(err) {
            throw err;
        }

    }

    /**
     * @description calls only when folder'.mdnote' exists, we first check if the 
     * structure is correct, then we check if each notebook has its coressponding
     * `structure`.json, if not, we initialize one. If exists, we import that into
     * the cache.
     */
    private async _importMarkdownNoteConfig(): Promise<void> {
        
        try {
            const ROOT = pathJoin(this._rootPath, MDNOTE_LOCAL_DIR_NAME);
        
            // check validation for the .mdnote structure (including config.json)
            await this._validateNoteBookConfig();
            
            if (await isFileExisted(ROOT, 'config.json') === false) {
                await createFile(ROOT, 'config.json');
                await ConfigModule.Instance.writeToJSON(ROOT, 'config.json');
            } else {
                await ConfigModule.Instance.readFromJSON(ROOT, 'config.json');
            }

            // check if missing any NoteBook structure
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
     * @description calls only when folder'.mdnote' does not exists, we create
     * the default '.mdnote' structure, 'config.json', and initialize each 
     * notebook `structure`.json.
     */
    private async _createMarkdownNoteConfig(): Promise<void> {
        try {
            
            // init folder structure
            await createDir(this._rootPath, MDNOTE_LOCAL_DIR_NAME);
            
            const ROOT = pathJoin(this._rootPath, MDNOTE_LOCAL_DIR_NAME);
            await createDir(ROOT, 'structure');
            await createDir(ROOT, 'log');
            
            // init config.json
            await createFile(ROOT, 'config.json');
            await ConfigModule.Instance.writeToJSON(ROOT, 'config.json');

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
     * @description in case '.mdnode' is missing some files/folders.
     */
    private async _validateNoteBookConfig(): Promise<void> {
        try {
            const ROOT = pathJoin(this._rootPath, MDNOTE_LOCAL_DIR_NAME);
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
    private async _noteBookWriteToJSON(notebook: INoteBook, name: string): Promise<void> {
        try {
            const rootpath = pathJoin(this._rootPath, MDNOTE_LOCAL_DIR_NAME, 'structure');
            await createFile(rootpath, name + '.json', notebook.toJSON());
        } catch(err) {
            throw err;
        }
    }

}