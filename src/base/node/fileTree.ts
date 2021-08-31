import { MarkdownFile, readMarkdownFile } from 'src/base/node/file';
import * as fs from 'fs'; 
import * as Path from 'path';
import { EVENT_EMITTER } from 'src/base/common/event';
import { NoteBookManager } from 'src/code/common/model/notebookManger';

/**
 * @description the object is to store and maintain the data for each 
 * folder/file/root.
 */
export class FileNode {

    public element: HTMLElement;
    public textElement!: HTMLElement;

    public readonly file: MarkdownFile | null;

    public readonly path: string;
    public readonly name: string;
    public readonly baseName: string;
    
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
            this.element = document.createElement('ul');
            this.file = null;
        } else {
            this.element = document.createElement('li');
            this.file = new MarkdownFile(baseName);
        }

        this._render(); // this.textElement is created from here

        const elementText = this.element.firstChild as ChildNode;
        // FIX: no need EVENT_EMITTER HERE
        if (isFolder) {
            elementText.addEventListener('click', () => FileNode.folderOnClick(this));
        } else {
            elementText.addEventListener('click', () => FileNode.fileOnClick(this));
        }
    }

    /**
     * @description append the given child to the current fileNode, not just its 
     * data, but also appends the child's HTMLElement.
     */
    public append(childName: string, child: FileNode): void {
        this.nodes!.set(childName, child);
        this.element.appendChild(child.element);
    }

    /**
     * @description TODO: complete comments
     */
    private _render(): void {
        this.element.classList.add('node');
        
        this.textElement = document.createElement('li');
        this.textElement.classList.add('node-text');
        this.textElement.innerHTML = this.baseName;
        
        if (!this.isFolder) {
            // is file
            this.element.classList.add('node-file');
            this.textElement.classList.add('file-icon');
        } else if (this.isFolder || !this.level) {
            if (!this.level) {
                // is root
                this.element.classList.add('node-root');
                this.textElement.classList.add('node-root-text');
            } else {
                // is folder
                this.element.classList.add('node-folder');
            }
            
            if (this.isExpand) {
                this.textElement.classList.add('folder-icon-expand');
            } else {
                this.textElement.classList.add('folder-icon-collapse');
            }
        }
        this.element.appendChild(this.textElement);
    }

    /**
     * @description folder node on click callback function. It expands or collapses
     * the clicked folder.
     * 
     * static function will be registered in EVENT_EMITTER at explorerViewComponent 
     * and emits when the folder node is clicked.
     */
     public static folderOnClick(nodeInfo: FileNode): void {
        (nodeInfo.isExpand as any) ^= 1;
        const element: JQuery<HTMLElement> = $(nodeInfo.textElement);
        if (nodeInfo.isExpand) {
            element.removeClass('folder-icon-collapse');
            element.addClass('folder-icon-expand');
            element.each(function() {
                element.nextAll().each(function() {
                    $(this).show(0);
                });
            });
        } else {
            element.addClass('folder-icon-collapse');
            element.removeClass('folder-icon-expand');
            element.each(function() {
                element.nextAll().each(function() {
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
        NoteBookManager.focusedFileNode = nodeInfo.element;
        nodeInfo.element.classList.add('node-file-clicked');

        // display content
        readMarkdownFile(nodeInfo)
        .then(() => {
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
        parent.appendChild(this.tree.element);
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
