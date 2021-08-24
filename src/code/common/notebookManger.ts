import { ConfigModule } from "src/base/config";
import { CHAR_DIR_SEPARATOR, createDir, createFile, directoryNoteBookParser, isDirExisted, isFileExisted } from "src/base/node/file";
import { NoteBook } from "src/code/common/notebook";

export const MDNOTE_LOCAL_DIR_NAME = '.mdnote';

export interface INoteBookManager {
    readonly noteBookMap: Map<string, NoteBook>;
    readonly noteBookConfig: Object;

    /**
     * @description once this function is called, a '.mdnote' directory will be
     * loaded.
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
    public readonly noteBookConfig!: Object;

    private _noteBookDir!: string;

    // not used
    private _mdNoteFolderFound: boolean;

    constructor() {
        this.noteBookMap = new Map<string, NoteBook>();
        this._mdNoteFolderFound = false;
    }

    public async init(path: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            this._noteBookDir = path;
            await this._directoryParser();
            
            await isFileExisted(this._noteBookDir, MDNOTE_LOCAL_DIR_NAME)
            .then((isExisted) => {
                if (isExisted) {
                    this._importNoteBookConfig();
                } else {
                    this._createNoteBookConfig();
                }
                this._mdNoteFolderFound = true;
                resolve();
            }).catch((err) => {
                // do log here.
                reject(err);
            });
        });
    }

    /**
     * @description TODO: complete comments
     */
    private async _directoryParser(): Promise<void> {
        return new Promise((resolve, reject) => {
            directoryNoteBookParser(this._noteBookDir, ConfigModule.parserExcludeDir, ConfigModule.parserIncludeDir)
            .then((targets: string[]) => {
                
                for (let target of targets) {
                    // create NoteBook Object for each subdirectory
                    const noteBook = new NoteBook(target, this._noteBookDir + '/' + target);
                    this.noteBookMap.set(target, noteBook);
                }

                resolve();

            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * @description TODO: complete comments
     */
    private async _importNoteBookConfig(): Promise<void> {
        
        return this._validateNoteBookConfig();

    }

    /**
     * @description TODO: complete comments
     */
    private async _createNoteBookConfig(): Promise<void> {
        try {
            const ROOT = this._noteBookDir + CHAR_DIR_SEPARATOR + MDNOTE_LOCAL_DIR_NAME;
            await createDir(this._noteBookDir, MDNOTE_LOCAL_DIR_NAME);
            await createDir(ROOT, 'structure');
            await createDir(ROOT, 'log');

        } catch(err) {
            // do log here ('error' level)
            throw err;
        }
    }

    /**
     * @description in case '.mdnode' is missing some files.
     */
    private async _validateNoteBookConfig(): Promise<void> {
        try {
            const ROOT = this._noteBookDir + CHAR_DIR_SEPARATOR + MDNOTE_LOCAL_DIR_NAME;
            if (await isDirExisted(ROOT, 'structure') === false) {
                await createDir(ROOT, 'structure');
            }
            if (await isDirExisted(ROOT, 'log') === false) {
                await createDir(ROOT, 'log');
            }
            if (await isFileExisted(ROOT, 'config.json') === false) {
                await createFile(ROOT, 'config.json');
            }
        } catch(err) {
            // do log here ('error' level)
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

}