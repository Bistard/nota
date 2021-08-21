import { TreeNodeType } from 'mdnote';
import { FileTree, FileNode } from 'src/base/node/fileTree';
import { TreeNodesType } from 'mdnote';
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from 'src/base/ipc/register';
import { Component } from 'src/code/workbench/browser/component';
import { ActionViewComponentType } from 'src/code/workbench/browser/actionView/actionView';
import { IRegisterService } from 'src/code/workbench/service/registerService';
import { IEventEmitter } from 'src/base/common/event';
import { readMarkdownFile, readMarkdownFileOption } from 'src/base/node/file';
import { NoteBookManager } from 'src/code/common/notebookManger';

/**
 * @description ExplorerViewComponent 
 */
export class ExplorerViewComponent extends Component {

    public fileTree: FileTree;
    private _eventEmitter: IEventEmitter;

    public isFolderOpened: boolean;
    public treeNodeCount: number;

    public resizeX: number;

    constructor(registerService: IRegisterService,
                _eventEmitter: IEventEmitter
    ) {
        super(ActionViewComponentType.ExplorerView, registerService);
        
        this._eventEmitter = _eventEmitter;
        this.fileTree = new FileTree();

        this.isFolderOpened = false;
        this.treeNodeCount = 0;

        // this variable is to store the x-coordinate of the resizeBar in the explorer view
        this.resizeX = 0;
    }

    protected override _createContainer(): void {
        this.parent.appendChild(this.container);
        // customize...
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        const tree = document.createElement('div');
        tree.id = 'tree';
        
        const emptyFolderTag = document.createElement('div');
        emptyFolderTag.id = 'emptyFolderTag';
        emptyFolderTag.innerHTML = 'open a folder';
        emptyFolderTag.classList.add('vertical-center', 'funcText');

        this.container.appendChild(tree);
        this.container.appendChild(emptyFolderTag);
    }

    protected override _registerListeners(): void {

        /**
         * @readonly Since remote is deprecated and dialog can only be used in 
         * the main process, to communicate between main process and renderer is 
         * to use ipcRenderer and ipcMain. See more details about Electron/remote 
         * on https://www.electronjs.org/docs/api/remote
         */
        domNodeByIdAddListener('emptyFolderTag', 'click', () => {
            ipcRendererSend('openDir');
        })

        /**
         * set openDir listener to get response back from main.js.
         * eg. D:\dev\AllNote
         */
        ipcRendererOn('openDir', (_event, path, _stat) => {
            // DEBUG: remove
            const nbm = new NoteBookManager(path);
            nbm.init();
            this.openDirecory(path);
        });
        
        // folder view resizeBar listeners
        // TODO: complete
        const resize = document.getElementById("resize") as HTMLElement;
        resize.addEventListener("mousedown", (event) => {
            this.resizeX = event.x;
            document.addEventListener("mousemove", this.resizeContentView, false);
        })

        document.addEventListener("mouseup", () => {
            document.removeEventListener("mousemove", this.resizeContentView, false);
        })
    }

    /**
     * @description warpper function for displayTree().
     */
    public displayFolderTree(root: FileNode): void {
        let current = this.insertNode($('#tree'), root, 'root') as HTMLElement;
        this.displayTree(current, root.nodes as TreeNodesType);
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
    public insertNode(parent: JQuery<HTMLElement> | HTMLElement, nodeInfo: FileNode, state: TreeNodeType): HTMLElement {
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
        text.innerHTML = nodeInfo.file.name;
        
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
     * @param {FileNode} nodeInfo 
     * @returns {void} void
     */
    folderOnClick(element: JQuery, nodeInfo: FileNode): void {
        (nodeInfo.isExpand as any) ^= 1;
        this.expandOrCollapseFolder(element, nodeInfo.isExpand);
    }

    /**
     * @description wrapper function for left clicking a file.
     */
    // FIX: when open a new or existed file, auto-save will be emit (write the exact same content to the original file)
    // TODO: currently disable relevant codes with tabBarComponent, more features should be added here
    fileOnClick(element: JQuery<HTMLElement>, nodeInfo: FileNode): void {
        
        this.focusFileWhenLeftClick(nodeInfo);
        
        let readOption: readMarkdownFileOption = {
            encoding: 'utf-8',
            flag: 'r'
        };

        readMarkdownFile(nodeInfo, readOption).then(() => {
            this._eventEmitter.emit('EMarkdownDisplayFile', nodeInfo);
        }).catch(err => {
            // do log here
            throw err;
        })
    }

    /**
     * @description display focus on the given tab.
     * 
     * @param {FileNode} nodeInfo 
     * @returns {void} void
     */
    focusFileWhenLeftClick(nodeInfo: FileNode): void {
        // TODO: complete
    }

    /**
     * @description Opennign a directory and it does the following things:
     *  - displays the whole folder tree.
     *  - set each FileNode a click listeners.
     *  - if clicked, check if is foler or file, calls the corresponding click function.
     */
    public openDirecory(path: string): void {
        this.isFolderOpened = true;
        this.fileTree.createFolderTree(path, 0);
        this.fileTree.createFolderTreeList(this.fileTree.tree as FileNode);

        // remove later
        const treeContainer = document.getElementById('explorer-container') as HTMLElement;
        const emptyFolderTag = document.getElementById('emptyFolderTag') as HTMLElement;
        treeContainer.removeChild(emptyFolderTag);
        this.displayFolderTree(this.fileTree.tree as FileNode);

        $('.node-text').on('click', { FolderViewClass: this }, function (event) {
            let that = event.data.FolderViewClass;
            let nodeNum = (this.parentNode as HTMLElement).getAttribute('nodeNum') as string;
            let nodeInfo = that.fileTree.treeList[parseInt(nodeNum)] as FileNode;
            if (nodeInfo.isFolder) {
                that.folderOnClick($(this), nodeInfo);
            } else { 
                that.fileOnClick($(this), nodeInfo);
            }
        })
    }

    /**
     * @description callback functions for resize folder view.
     */
    public resizeContentView(event: MouseEvent): void {

        // minimum width for folder view to be resized
        if (event.x < 200) {
            return;
        }
        // TODO: remove later
        const folderView = document.getElementById('action-view') as HTMLElement;
        const contentView = document.getElementById('editor-view') as HTMLElement;
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

}

