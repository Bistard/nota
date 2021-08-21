import { CHAR_DIR_SEPARATOR, createDir, createFile, isDirExisted, isFileExisted } from "src/base/node/file";
import { NoteBook } from "src/code/common/notebook";

export const MDNOTE_LOCAL_DIR_NAME = '.mdnote';

/**
 * @description reads local configuration and build corresponding notebook 
 * structure.
 */
export class NoteBookManager {

    public readonly noteBookMap: Map<string, NoteBook>;
    public readonly noteBookConfig!: Object;

    private _noteBookDir: string;

    constructor(path: string) {
        this.noteBookMap = new Map<string, NoteBook>();

        this._noteBookDir = path;
    }

    /**
     * @description once this function is called, a '.mdnote' directory will be
     * loaded.
     */
    public init(): void {
        isFileExisted(this._noteBookDir, MDNOTE_LOCAL_DIR_NAME)
        .then((isExisted) => {
            if (isExisted) {
                this._importNoteBookConfig();
            } else {
                this._createNoteBookConfig();
            }
        }).catch((err) => {
            // do log here.
            throw err;
        })
    }

    private _importNoteBookConfig(): void {
        
        this._validateNoteBookConfig();

    }

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
        this.noteBookMap.set(noteBook.noteBookName, noteBook);
    }

    public getExistedNoteBook(noteBookName: string): NoteBook | null {
        const res = this.noteBookMap.get(noteBookName);
        return res === undefined ? null : res;
    }

}