import { FileTree, FileNode } from "src/base/node/fileTree";

/**
 * @description NoteBook is considered as 
 */
export class NoteBook {

    public readonly noteBookName: string;
    public readonly noteBookDir: string;

    public readonly firstCreatedDate?: Date;
    public readonly fileTree: FileTree;

    constructor(name: string, path: string) {
        this.noteBookName = name;
        this.noteBookDir = path;
        
        this.fileTree = new FileTree();
        this.fileTree.createFolderTree(path, 0);
        this.fileTree.createFolderTreeList(this.fileTree.tree as FileNode);
    }

}