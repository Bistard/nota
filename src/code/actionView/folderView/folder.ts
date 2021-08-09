import { TreeNodeType } from 'mdnote';
import { ipcRenderer, fs } from '../../util.js';
import { FolderTreeModule, TreeNode } from './foldertree.js';
import { TabBarModule } from './tabBar.js';
import { TreeNodesType } from 'mdnote';

const folderView = document.getElementById('action-view') as HTMLElement;
const treeContainer = document.getElementById('folder-tree-container') as HTMLElement;
const emptyFolderTag = document.getElementById('emptyFolderTag') as HTMLElement;
const contentView = document.getElementById('content-view') as HTMLElement;
const resize = document.getElementById("resize") as HTMLElement;

/**
 * @description FolderModule mainly controlling folder/file system. Also 
 * interacts with FolderTreeModule and TabBarModule.
 */
export class FolderModule {

    public FolderTree: FolderTreeModule;
    public TabBar: TabBarModule;

    public resizeX: number;
    public isFolderOpened: boolean;
    public treeNodeCount: number;

    constructor(FolderTreeModule: FolderTreeModule, TabBarModule: TabBarModule) {
        this.FolderTree = FolderTreeModule;
        this.TabBar = TabBarModule;

        // this variable is to store the x-coordinate of the resizeBar in the 
        // folder view
        this.resizeX = 0;

        this.isFolderOpened = false;
        this.treeNodeCount = 0;

        this._setListeners();
    }

    /**
     * @description warpper function for displayTree().
     */
    public displayFolderTree(root: TreeNode): void {
        let current = this.insertNode($('#tree'), root, 'root') as HTMLElement;
        this.displayTree(current, root.nodes as TreeNodesType)
    }

    /**
     * @description recursively display the whole folder tree.
     */
    public displayTree(parent: HTMLElement, tree: TreeNodesType): void {
        for (const [/* name */, node] of Object.entries(tree)) {
            if (node.isFolder) {
                let current = this.insertNode(parent, node, 'folder') as HTMLElement;
                this.displayTree(current, node.nodes as TreeNodesType)
            } else {
                this.insertNode(parent, node, 'file')
            }
        }
    }

    /**
     * @description Initializes a new foler/file node of HTMLElement and inserts
     * into the given parent.
     */
    public insertNode(parent: JQuery<HTMLElement> | HTMLElement, nodeInfo: TreeNode, state: TreeNodeType): HTMLElement {
        let element: HTMLElement;
        if (state == 'root' || state == 'folder') {
            element = document.createElement('ul');
        } else {
            element = document.createElement('li');
        }
        
        element.classList.add('node');
        element.setAttribute('nodeNum', this.treeNodeCount.toString());
        this.treeNodeCount++;

        const text = document.createElement('li');
        text.classList.add('node-text');
        text.innerHTML = nodeInfo.name;
        
        if (state == 'file') {
            element.classList.add('node-file');
            text.classList.add('file-icon');
        } else if (state == 'folder' || state == 'root') {
            if (state == 'folder') {
                element.classList.add('node-folder');
            } else {
                element.classList.add('node-root');
                text.classList.add('node-root-text');
            }
            
            if (nodeInfo.isExpand) {
                text.classList.add('folder-icon-expand');
            } else {
                text.classList.add('folder-icon-collapse');
            }  
        }
        
        element.append(text);
        parent.append(element);
        return element;
    }

    /**
     * @description Expands or collapses folder in the folder view.
     * 
     * @param {JQuery} element 
     * @param {boolean} shouldExpand 
     * @returns {void} void
     */
    public expandOrCollapseFolder(element: JQuery, shouldExpand: boolean): void {
        if (shouldExpand) {
            element.removeClass('folder-icon-collapse')
            element.addClass('folder-icon-expand')
            element.each(function() {
                element.nextAll().each(function() {
                    $(this).show(0)
                })
            })
        } else {
            element.addClass('folder-icon-collapse')
            element.removeClass('folder-icon-expand')
            element.each(function() {
                element.nextAll().each(function() {
                    $(this).hide(0)
                })
            })
        }
    }

    /**
     * @description wrapper function for left clicking a folder.
     * 
     * @param {JQuery} element 
     * @param {TreeNode} nodeInfo 
     * @returns {void} void
     */
    folderLeftClick(element: JQuery, nodeInfo: TreeNode): void {
        (nodeInfo.isExpand as any) ^= 1;
        this.expandOrCollapseFolder(element, nodeInfo.isExpand);
    }

    /**
     * @description wrapper function for left clicking a file.
     */
    // FIX: when open a new or existed file, auto-save will be emit (write the exact same content to the original file)
    fileLeftClick(_element: JQuery<HTMLElement>, nodeInfo: TreeNode): void {
        const tabInfo = this.TabBar.initTab(nodeInfo)
        /**
         * @readonly if 'isExist' is false, 'tabIndex' is set as last one. See
         * more details in TabBarModule.initTab()
         */
        const isExist = tabInfo[0]
        const tabIndex = tabInfo[1]
        const newTab = tabInfo[2]
        
        this.focusFileWhenLeftClick(nodeInfo)

        if (!isExist) {
            this.TabBar.insertTab(newTab, nodeInfo)
        }
        
        if (nodeInfo.plainText !== "") {
            // text is still in the cache
            this.TabBar.openTab(newTab, tabIndex, nodeInfo)
        } else {
            // never opened before, read the file
            this.openFile(newTab, tabIndex, nodeInfo)
        }

    }

    /**
     * @description open the given file and calls TabBarModule.openTab().
     */
    openFile(newTab: HTMLElement, tabIndex: number, nodeInfo: TreeNode): void {

        let readOption: any = {
            encoding: 'utf-8',
            flag: 'r'
        };

        fs.readFile(nodeInfo.path, readOption, (err, text: string) => {
            if (err) {
                throw err;
            }
            nodeInfo.plainText = text;
            this.TabBar.openTab(newTab, tabIndex, nodeInfo);
        })
    }

    /**
     * @description write the current focused tab's content into the file.
     * 
     * @param {TreeNode} nodeInfo 
     * @param {string} newText
     * @return {void} void
     */
    saveFile(_nodeInfo: TreeNode, _newText: string): void {
        /* if (nodeInfo !== undefined) {

            let writeOption = {
                encoding: 'utf-8',
                flag: 'w'
            }

            fs.writeFile(nodeInfo.path, newText, writeOption, (err) => {
                if (err) {
                    throw err
                }
                ipcRenderer.send('test', 'auto saved')
            })
        } else {
            ipcRenderer.send('test', 'auto saved but undefined')
        } */
    }

    /**
     * @description display focus on the given tab.
     * 
     * @param {TreeNode} nodeInfo 
     * @returns {void} void
     */
    focusFileWhenLeftClick(_nodeInfo: TreeNode): void {
        // TODO: complete
    }

    /**
     * @description Opennign a directory and it does the following things:
     *  - displays the whole folder tree.
     *  - set each TreeNode a click listeners.
     *  - if clicked, check if is foler or file, calls the corresponding click function.
     */
    public openDirecory(path: string): void {
        this.isFolderOpened = true;
        this.FolderTree.tree = this.FolderTree.createFolderTree(path, 0);
        this.FolderTree.treeList = this.FolderTree.createFolderTreeList(this.FolderTree.tree as TreeNode);

        treeContainer.removeChild(emptyFolderTag);
        this.displayFolderTree(this.FolderTree.tree as TreeNode);

        $('.node-text').on('click', { FolderViewClass: this }, function (event) {
            let that = event.data.FolderViewClass;
            let nodeNum = (this.parentNode as HTMLElement).getAttribute('nodeNum') as string;
            let nodeInfo = that.FolderTree.treeList[parseInt(nodeNum)] as TreeNode;
            if (nodeInfo.isFolder) {
                that.folderLeftClick($(this), nodeInfo);
            } else { 
                that.fileLeftClick($(this), nodeInfo);
            }
        })
    }

    /**
     * @description helper functions for creating string-formatted .css style 
     * for folderIcon usage
     */
    createfolderIconString(fileName: string): string {
        // FIX
        return "<style>.node-text::before {content: url('assets/icons/" + fileName + "');display: inline-block;width: 10px;height: 10px;margin-left: 4px;margin-right: 4px;}</style>"
    }
    
    /**
     * @description callback functions for resize folder view.
     */
    public resizeContentView(event: MouseEvent): void {

        // minimum width for folder view to be resized
        if (event.x < 200) {
            return;
        }
        
        let dx = this.resizeX - event.x;
        this.resizeX = event.x;
        /* new X has to be calculated first, than concatenates with "px", otherwise
           the string will be like newX = "1000+2px" and losing accuracy */
        let folderViewNewX = parseInt(getComputedStyle(folderView, '').width) - dx;
        let contentViewNewX = parseInt(getComputedStyle(contentView, '').width) + dx;
        
        folderView.style.width = folderViewNewX + "px";
        folderView.style.minWidth = folderViewNewX + "px";
        contentView.style.width = contentViewNewX + "px";
    }

    /**
     * @description set folder event listeners.
     */
     private _setListeners(): void {

        /**
         * @readonly Since remote is deprecated and dialog can only be used in 
         * the main process, to communicate between main process and renderer is 
         * to use ipcRenderer and ipcMain. See more details about Electron/remote 
         * on https://www.electronjs.org/docs/api/remote
         */
        emptyFolderTag.addEventListener('click', () => {
            ipcRenderer.send('openDir');
        })

        // set openDir listener to get response back from main.js
        ipcRenderer.on('openDir', (_event, path, _stat) => {
            this.openDirecory(path);
        })

        // folder view resizeBar listeners
        resize.addEventListener("mousedown", (event) => {
            this.resizeX = event.x;
            document.addEventListener("mousemove", this.resizeContentView, false);
        }, false)

        document.addEventListener("mouseup", () => {
            document.removeEventListener("mousemove", this.resizeContentView, false);
        }, false)
    }

}

