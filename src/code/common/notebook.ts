import { FileTree, FileNode } from "src/base/node/fileTree";

export interface INoteBook {
    readonly noteBookName: string;
    readonly noteBookDir: string;
    readonly firstCreatedDate?: Date;
    readonly fileTree: FileTree;

    destory(): void;
}

/**
 * @description NoteBook is considered as 
 */
export class NoteBook {

    public readonly noteBookName: string;
    public readonly noteBookDir: string;

    public readonly firstCreatedDate?: Date;
    public readonly fileTree: FileTree;

    /**
     * @param name name of the notebook
     * @param path path to the root of the notebook
     */
    constructor(name: string, path: string) {
        this.noteBookName = name;
        this.noteBookDir = path;
        
        this.fileTree = new FileTree(path);
        this.fileTree.createFolderTree();
        this.fileTree.createFolderTreeList();
    }

    public destory(): void {
        
    }

}