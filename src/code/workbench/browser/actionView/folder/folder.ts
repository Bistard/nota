import { TreeNodeType } from 'mdnote';
import { FolderTree, TreeNode } from 'src/base/node/foldertree';
import { TreeNodesType } from 'mdnote';
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from 'src/base/ipc/register';
import { Component } from 'src/code/workbench/browser/component';
import { ActionViewComponentType } from 'src/code/workbench/browser/actionView/actionView';
import { IRegisterService } from 'src/code/workbench/service/registerService';
import { IEventEmitter } from 'src/base/common/event';
import { readMarkdownFile, readMarkdownFileOption } from 'src/base/node/file';

/**
 * @description FolderViewComponent 
 */
export class FolderViewComponent extends Component {

    public folderTree: FolderTree;
    private _eventEmitter: IEventEmitter;

    public isFolderOpened: boolean;
    public treeNodeCount: number;

    public resizeX: number;

    constructor(registerService: IRegisterService,
                _eventEmitter: IEventEmitter
    ) {
        super(ActionViewComponentType.FolderView, registerService);
        
        this._eventEmitter = _eventEmitter;
        this.folderTree = new FolderTree();

        this.isFolderOpened = false;
        this.treeNodeCount = 0;

        // this variable is to store the x-coordinate of the resizeBar in the folder view
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

        // set openDir listener to get response back from main.js
        ipcRendererOn('openDir', (_event, path, _stat) => {
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
    public displayFolderTree(root: TreeNode): void {
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
     * @param {TreeNode} nodeInfo 
     * @returns {void} void
     */
    folderOnClick(element: JQuery, nodeInfo: TreeNode): void {
        (nodeInfo.isExpand as any) ^= 1;
        this.expandOrCollapseFolder(element, nodeInfo.isExpand);
    }

    /**
     * @description wrapper function for left clicking a file.
     */
    // FIX: when open a new or existed file, auto-save will be emit (write the exact same content to the original file)
    // TODO: currently disable relevant codes with tabBarComponent, more features should be added here
    fileOnClick(element: JQuery<HTMLElement>, nodeInfo: TreeNode): void {
        
        this.focusFileWhenLeftClick(nodeInfo);
        
        let readOption: readMarkdownFileOption = {
            encoding: 'utf-8',
            flag: 'r'
        };

        /**
         * @readonly use async reading prevents when facing a huge .md file
         * will cause not response to the whole app.
         */
        readMarkdownFile(nodeInfo, readOption).then(() => {
            this._eventEmitter.emit('EMarkdownDisplayFile', nodeInfo);
        }).catch(err => {
            // do log here
            throw err;
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
        this.folderTree.tree = this.folderTree.createFolderTree(path, 0);
        this.folderTree.treeList = this.folderTree.createFolderTreeList(this.folderTree.tree as TreeNode);

        // remove later
        const treeContainer = document.getElementById('folder-container') as HTMLElement;
        const emptyFolderTag = document.getElementById('emptyFolderTag') as HTMLElement;
        treeContainer.removeChild(emptyFolderTag);
        this.displayFolderTree(this.folderTree.tree as TreeNode);

        $('.node-text').on('click', { FolderViewClass: this }, function (event) {
            let that = event.data.FolderViewClass;
            let nodeNum = (this.parentNode as HTMLElement).getAttribute('nodeNum') as string;
            let nodeInfo = that.folderTree.treeList[parseInt(nodeNum)] as TreeNode;
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

