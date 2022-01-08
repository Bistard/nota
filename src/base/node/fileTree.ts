import { readMarkdownFile } from 'src/base/node/io';
import * as fs from 'fs'; 
import * as Path from 'path';
import { EVENT_EMITTER } from 'src/base/common/event';
import { NoteBookManager } from 'src/code/common/model/notebookManager';
import { File } from 'src/base/common/file/file';
import { getBuiltInIconClass } from 'src/base/browser/icon/iconRegistry';
import { Icons } from 'src/base/browser/icon/icons';
import { createSpan } from 'src/base/common/dom';

/**
 * @description the object is to store and maintain the data for each 
 * folder/file/root.
 */
export class FileNode {

    public container: HTMLElement;
    public node!: HTMLElement;

    public readonly file: File | null;

    public readonly path: string;
    public readonly name: string; // eg. 'markdown'
    public readonly baseName: string; // eg. 'markdown.md'
    
    public readonly nodes: Map<string, FileNode> | null;
    public readonly level: number;
    public readonly isFolder: boolean;
    public readonly isExpand: boolean;

    constructor(
        path: string,
        name: string,
        baseName: string,
        nodes: Map<string, FileNode> | null, 
        level: number, 
        isFolder: boolean,
        isExpand: boolean
    ) {
        this.path = path;
        this.name = name;
        this.baseName = baseName;

        // note that 'nodes' will always be an empty map
        this.nodes = nodes;

        this.level = level;
        this.isFolder = isFolder;
        this.isExpand = isExpand;

        if (isFolder) {
            this.container = document.createElement('ul');
            this.file = null;
        } else {
            this.container = document.createElement('li');
            this.file = new File(baseName);
        }

        this._render(); // this.node is created from here

        const node = this.container.firstChild as ChildNode;
        // FIX: no need EVENT_EMITTER HERE
        if (isFolder) {
            node.addEventListener('click', () => FileNode.folderOnClick(this));
        } else {
            node.addEventListener('click', () => FileNode.fileOnClick(this));
        }
    }

    /**
     * @description append the given child to the current fileNode, not just its 
     * data, but also appends the child's HTMLElement.
     */
    public append(childName: string, child: FileNode): void {
        this.nodes!.set(childName, child);
        this.container.appendChild(child.container);
    }

    /**
     * @description TODO: complete comments
     */
    private _render(): void {
        this.container.classList.add('node-container');
        
        this.node = document.createElement('li');
        this.node.classList.add('node');
        
        const text = document.createElement('div');
        text.innerHTML = createSpan(this.baseName);
        
        // is file
        if (!this.isFolder) {
            this.container.classList.add('node-file');
            text.classList.add('node-text');

            // render node
            this.node.appendChild(text);
        } 
        
        else {  
            
            // is root
            if (!this.level) {
                this.container.classList.add('node-root');
                text.classList.add('node-root-text');

                const icon = document.createElement('i');
                icon.classList.add('root-icon', getBuiltInIconClass(Icons.AngleDown));
                
                // render node
                this.node.appendChild(text);
                this.node.appendChild(icon);
            } 
            
            // is folder
            else {
                this.container.classList.add('node-folder');
                text.classList.add('node-text');

                const icon = document.createElement('i');
                icon.classList.add('icon', getBuiltInIconClass(Icons.CaretRight));
                
                // render node
                this.node.appendChild(icon);
                this.node.appendChild(text);
            }
        }

        this.container.appendChild(this.node);
    }

    /**
     * @description folder node on click callback function. It expands or collapses
     * the clicked folder.
     * 
     * static function will be registered in EVENT_EMITTER at explorerViewComponent 
     * and emits when the folder node is clicked.
     */
    // TODO: stop using JQuery
    public static folderOnClick(nodeInfo: FileNode): void {
        (nodeInfo.isExpand as unknown as number) ^= 1;
        const container: JQuery<HTMLElement> = $(nodeInfo.node);

        if (nodeInfo.isExpand) {
            // container.removeClass(getBuiltInIconClass(Icons.AngleRight));
            // container.addClass(getBuiltInIconClass(Icons.AngleDown));
            container.each(function() {
                container.nextAll().each(function() {
                    $(this).show(0);
                });
            });
        } else {
            // container.addClass(getBuiltInIconClass(Icons.AngleDown));
            // container.removeClass(getBuiltInIconClass(Icons.AngleDown));
            container.each(function() {
                container.nextAll().each(function() {
                    $(this).hide(0);
                });
            });
        }
    }

    /**
     * @description file node on click callback function. It reads the file and
     * displays the text to the markdown editor (calls 'EMarkdownDisplayFile').
     * 
     * static function will be registered in EVENT_EMITTER at explorerViewComponent 
     * and emits when the file node is clicked.
     */
    public static fileOnClick(nodeInfo: FileNode): void {
        
        // fileNode style on change
        if (NoteBookManager.focusedFileNode !== null) {
            NoteBookManager.focusedFileNode.classList.remove('node-file-clicked');   
        }
        NoteBookManager.focusedFileNode = nodeInfo.container;
        nodeInfo.container.classList.add('node-file-clicked');

        // display content
        readMarkdownFile(nodeInfo)
        .then(() => {
            EVENT_EMITTER.emit('ETabBarSwitchOrCreateTab', nodeInfo);
            EVENT_EMITTER.emit('EMarkdownDisplayFile', nodeInfo);
        }).catch(err => {
            // do log here
            throw err;
        });
    }
}

/**
 * @description FileTree is responsible for storing data for each node 
 * in the opened folder tree. Only deals with dada handling, searching and 
 * storing.
 */
export class FileTree {
    
    public readonly path: string;

    public tree: FileNode | null;

    // Unused
    public readonly nodeCount: number;
    public readonly depth: number;

    constructor(path: string) {
        this.path = path;
        this.tree = null;

        this.nodeCount = 0;
        this.depth = -1;
    }

    /**
     * @description reads and creates a complete folder tree.
     */
    public create(parent: HTMLElement): void {
        this.tree = this._createRecursive(this.path, 0);
        parent.appendChild(this.tree.container);
    }

    /**
     * @description synchronously reading the whole folder tree.
     * 
     * @param path eg. D:\dev\AllNote
     * @param level the depth of current treenode
     */
    private _createRecursive(path: string, level: number): FileNode {
        
        // eg. 'markdown.md'
        const baseName = Path.basename(path);
        
        if (fs.lstatSync(path).isDirectory()) {
            // directory
            let name = baseName.replace(/_/g, ' ');
            const fileNode = new FileNode(path, name, baseName, new Map<string, FileNode>(), level, true, false);
            
            const filesNames = fs.readdirSync(path, {
                encoding: 'utf8',
                withFileTypes: false
            });

            for (let filename of filesNames) {
                const tree = this._createRecursive(Path.join(path, filename), level + 1);
                fileNode.append(filename, tree);
            };

            return fileNode;

        } else if (/\.md$/i.test(path)) {
            // markdown file
            let name = baseName.replace(/_/g, ' ').replace(/\.md$/, '').trim();
            return new FileNode(path, name, baseName, null, level, false, false);
        }
        // other file type
        return new FileNode(path, baseName, baseName, null, level, false, false);
    }

}
