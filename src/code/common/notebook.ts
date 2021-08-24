import { MapToJsonReplacer } from "src/base/node/file";
import { FileTree } from "src/base/node/fileTree";

export interface INoteBook {
    readonly noteBookName: string;
    readonly noteBookDir: string;
    readonly firstCreatedDate?: Date;
    readonly fileTree: FileTree;

    /**
     * @description synchronously building the whole notebook folder tree and
     * display it.
     * 
     * @param parent fileTree appends to this parent HTMLElement
     */
    create(parent: HTMLElement): void;
    
    /**
     * @description converts the whole file tree into JSON format.
     */
    toJSON(): string;

    /**
     * @description destroy the notebook instance.
     */
    destory(): void;
}

/**
 * @description A class for each noteBook.
 */
export class NoteBook {

    public readonly noteBookName: string;
    public readonly noteBookDir: string;

    public readonly fileTree: FileTree;

    /**
     * @param name name of the notebook
     * @param path path to the root of the notebook
     */
    constructor(name: string, path: string) {
        this.noteBookName = name;
        this.noteBookDir = path;
        
        this.fileTree = new FileTree(path);
    }

    public create(parent: HTMLElement): void {
        this.fileTree.create(parent);
    }

    public toJSON(): string {
        return JSON.stringify(this.fileTree.tree, MapToJsonReplacer, 2);
    }

    public destory(): void {
        
    }

}