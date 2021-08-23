import { MarkdownFile } from 'src/base/node/file';
import * as fs from 'fs';
import * as Path from 'path';

/**
 * @description the object is to store and maintain the data for each 
 * folder/tree/root.
 */
// TODO: rename FileNode as FileNode
// TODO: for folder/root FileNode, they still have attribute 'file' which does not make sense
export class FileNode {

    public readonly file: MarkdownFile;
    
    public nodes: {[propName: string]: FileNode};
    public isFolder: boolean;
    public level: number;
    public isExpand: boolean;

    constructor(file: MarkdownFile,
                nodes: {[propName: string]: FileNode}, 
                isFolder: boolean,
                level: number, 
                isExpand: boolean
    ) {
        this.file = file;

        this.nodes = nodes;
        this.isFolder = isFolder;
        this.level = level;
        this.isExpand = isExpand;
    }
}

/**
 * @description FileTree is responsible for storing data for each node 
 * in the opened folder tree. Only deals with dada handling, searching and 
 * storing.
 */
export class FileTree {
    
    public readonly path: string;

    public tree: FileNode | {};
    public treeList: FileNode[] | [];


    constructor(path: string) {
        this.path = path;
        // TODO: reduce memory usage (tree && treeList might overlap)
        this.tree = {};
        this.treeList = [];
    }

    /**
     * @description Recursively searches and creates a complete folder tree.
     */
    // TODO: refactor using while to avoid recursive (reduce run-timememory usage)
    public createFolderTree(): void {
        this.tree = this._createFolderTreeRecursive(this.path, 0);
    }

    /**
     * @description traversing and returns an array version of folder tree 
     * using pre-order.
     */
     public createFolderTreeList(): void {
        this.treeList = this._createFolderTreeListRecursive(this.tree as FileNode, []);
    }
    
    /**
     * @description synchronously reading the whole folder tree.
     * 
     * @param path eg. D:\dev\AllNote
     * @param level the depth of current treenode
     */
    private _createFolderTreeRecursive(path: string, level: number): FileNode {
        
        const baseName = Path.basename(path); // eg. 'markdown.md'
        
        if (fs.lstatSync(path).isDirectory()) {
            
            let name = baseName.replace(/_/g, ' ');
            const mdFile = new MarkdownFile(path, name, baseName);
            const node = new FileNode(mdFile, {}, true, level, false);
            
            const filesText = fs.readdirSync(path, {
                encoding: 'utf8',
                withFileTypes: false
            })

            filesText.forEach((filename: string) => {
                const tree = this._createFolderTreeRecursive(Path.join(path, filename), level + 1);
                node.nodes[filename] = tree;
            })
            return node;

        } else if (/\.md$/i.test(path)) {
            let name = baseName.replace(/_/g, ' ').replace(/\.md$/, '').trim();
            const mdFile = new MarkdownFile(path, name, baseName);
            return new FileNode(mdFile, {}, false, level, false);
        }
        
        // reaches if no suffix or not .md
        const mdFile = new MarkdownFile(path, baseName, baseName);
        return new FileNode(mdFile, {}, false, level, false);
    }

    private _createFolderTreeListRecursive(tree: FileNode, list: FileNode[] = []): FileNode[] {
        if (tree.isFolder) {
            list.push(tree);
			for (const [key, node] of Object.entries(tree.nodes)) {
				this._createFolderTreeListRecursive(node, list);
			}
		} else {
			list.push(tree);
		}
		return list;
    }
}
