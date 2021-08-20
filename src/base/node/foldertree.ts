import { MarkdownFile } from 'src/base/node/file';
import * as fs from 'fs';
import * as Path from 'path';

/**
 * @description the object is to store and maintain the data for each 
 * folder/tree/root.
 */
// TODO: rename TreeNode as FileNode
// TODO: for folder/root TreeNode, they still have attribute 'file' which does not make sense
export class TreeNode {

    public readonly file: MarkdownFile;
    
    public nodes: {[propName: string]: TreeNode};
    public isFolder: boolean;
    public level: number;
    public isExpand: boolean;

    constructor(file: MarkdownFile,
                nodes: {[propName: string]: TreeNode}, 
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
 * @description FolderTree is responsible for storing data for each node 
 * in the opened folder tree. Only deals with dada handling, searching and 
 * storing.
 */
export class FolderTree {
    
    public tree: TreeNode | {};
    public treeList: TreeNode[] | [];


    constructor() {
        // TODO: reduce memory usage (tree && treeList might overlap)
        this.tree = {};
        this.treeList = [];
    }

    /**
     * @description Recursively searches and creates a complete folder tree.
     */
    // TODO: refactor using while to avoid recursive (reduce run-timememory usage)
    public createFolderTree(path: string, level: number): TreeNode {
        
        const baseName = Path.basename(path); // eg. 'markdown.md'
        
        if (fs.lstatSync(path).isDirectory()) {
            
            let name = baseName.replace(/_/g, ' ');
            const mdFile = new MarkdownFile(path, name, baseName);
            const node = new TreeNode(mdFile, {}, true, level, false);
            
            const filesText = fs.readdirSync(path, {
                encoding: 'utf8',
                withFileTypes: false
            })

            filesText.forEach((filename: string) => {
                const tree = this.createFolderTree(Path.join(path, filename), level + 1);
                node.nodes[filename] = tree;
            })
            return node;

        } else if (/\.md$/i.test(path)) {
            let name = baseName.replace(/_/g, ' ').replace(/\.md$/, '').trim();
            const mdFile = new MarkdownFile(path, name, baseName);
            return new TreeNode(mdFile, {}, false, level, false);
        }
        
        // reaches if no suffix or not .md
        const mdFile = new MarkdownFile(path, baseName, baseName);
        return new TreeNode(mdFile, {}, false, level, false);
    }

    /**
     * @description traversing and returns an array version of folder tree 
     * using pre-order.
     */
    public createFolderTreeList(tree: TreeNode, list: TreeNode[] = []): TreeNode[] {
        if (tree.isFolder) {
            list.push(tree);
			for (const [key, node] of Object.entries(tree.nodes)) {
				this.createFolderTreeList(node, list);
			}
		} else {
			list.push(tree);
		}
		return list;
    }
}
