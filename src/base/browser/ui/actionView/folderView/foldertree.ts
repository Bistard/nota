import { fs } from '../../../../util';
import { Path } from '../../../../util';

/**
 * @description the object is to store and maintain the data for each 
 * folder/tree/root.
 */
export class TreeNode {
    public nodes: {[propName: string]: TreeNode};
    public isFolder: boolean;
    public name: string;
    public baseName: string;
    public path: string;
    public level: number;
    public isExpand: boolean
    public plainText: string; 

    constructor(nodes: {[propName: string]: TreeNode}, isFolder: boolean, 
                name: string, baseName: string, path: string, level: number, 
                isExpand: boolean, plainText: string) {
        this.nodes = nodes;
        this.isFolder = isFolder;
        this.name = name;
        this.baseName = baseName;
        this.path = path;
        this.level = level;
        this.isExpand = isExpand;
        this.plainText = plainText;
    }
}

/**
 * @description FolderTreeModule is responsible for storing data for each node 
 * in the opened folder tree. Only deals with dada handling, searching and 
 * storing.
 */
export class FolderTreeModule {
    
    public tree: TreeNode | {};
    public treeList: TreeNode[] | [];


    constructor() {
        // TODO: reduce memory usage (.tree .treeList might overlap)
        this.tree = {}
        this.treeList = []
    }

    /**
     * @description Recursively searches and creates a complete folder tree.
     */
    public createFolderTree(path: string, lev: number): TreeNode {
        const baseName = Path.basename(path)
        
        if (fs.lstatSync(path).isDirectory()) {
            
            let name = baseName.replace(/_/g, ' ')
            const node = new TreeNode({}, true, name, baseName, path, lev, false, '')
            
            const files = fs.readdirSync(path, {
                encoding: 'utf8',
                withFileTypes: false
            })

            files.forEach((file: string) => {
                const tree = this.createFolderTree(Path.join(path, file), lev + 1)
                node.nodes[file] = tree
            })
            return node

        } else if (/\.md$/i.test(path)) {
            let name = baseName.replace(/_/g, ' ').replace(/\.md$/, '').trim()
            return new TreeNode({}, false, name, baseName, path, lev, false, '')
        }
        
        // reaches if no suffix or not .md
        return new TreeNode({}, false, baseName, baseName, path, lev, false, '')
    }

    /**
     * @description traversing and returns an array version of folder tree 
     * using pre-order.
     */
    public createFolderTreeList(tree: TreeNode, list: TreeNode[] = []): TreeNode[] {
        if (tree.isFolder) {
            list.push(tree)
			for (const [_key, node] of Object.entries(tree.nodes)) {
				this.createFolderTreeList(node, list)
			}
		} else {
			list.push(tree)
		}
		return list
    }

}
