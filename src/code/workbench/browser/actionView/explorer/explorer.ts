import { FileNode } from 'src/base/node/fileTree';
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from 'src/base/ipc/register';
import { Component } from 'src/code/workbench/browser/component';
import { ActionViewComponentType } from 'src/code/workbench/browser/actionView/actionView';
import { IRegisterService } from 'src/code/workbench/service/registerService';
import { EVENT_EMITTER } from 'src/base/common/event';
import { INoteBookManager } from 'src/code/common/notebookManger';

/**
 * @description TODO: complete comments
 */
export class ExplorerViewComponent extends Component {

    private _noteBookManager: INoteBookManager;

    public resizeX: number;

    public fileTreeContainer: HTMLElement = document.createElement('div');
    public emptyFolderTag: HTMLElement = document.createElement('div');

    constructor(registerService: IRegisterService,
                _noteBookManger: INoteBookManager
    ) {
        super(ActionViewComponentType.ExplorerView, registerService);
        
        this._noteBookManager = _noteBookManger;

        // this variable is to store the x-coordinate of the resizeBar in the explorer view
        this.resizeX = 0;
    }

    protected override _createContainer(): void {
        this.parent.appendChild(this.container);
        // customize...
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        this.fileTreeContainer.id = 'fileTree-container';
        
        this.emptyFolderTag.id = 'emptyFolderTag';
        this.emptyFolderTag.innerHTML = 'open a folder';
        this.emptyFolderTag.classList.add('vertical-center', 'funcText');

        this.container.appendChild(this.fileTreeContainer);
        this.container.appendChild(this.emptyFolderTag);
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
        });

        /**
         * set openDir listener to get response back from main.js.
         * eg. D:\dev\AllNote
         */
        ipcRendererOn('openDir', (_event, path, _stat) => {
            this._initNoteBookManager(path);
        });
        
        // folder view resizeBar listeners
        const resize = document.getElementById("resize") as HTMLElement;
        resize.addEventListener("mousedown", (event) => {
            this.resizeX = event.x;
            document.addEventListener("mousemove", this._resizeView, false);
        });

        document.addEventListener("mouseup", () => {
            document.removeEventListener("mousemove", this._resizeView, false);
        });

        EVENT_EMITTER.register('EFileOnClick', (nodeInfo: FileNode) => FileNode.fileOnClick(nodeInfo));
        EVENT_EMITTER.register('EFolderOnClick', (nodeInfo: FileNode) => FileNode.folderOnClick(nodeInfo));


        domNodeByIdAddListener('explorer-container', 'contextmenu', (event) => {
            event.preventDefault();
            ipcRendererSend('showContextMenuExplorer');
        });
    }

    /**
     * @description initialize and display the noteBookManger.
     * 
     * function will be called when 'openDir' message is sended from the main thread.
     * 
     * @param path eg. D:\dev\AllNote
     */
    private async _initNoteBookManager(path: string): Promise<void> {
        try {
            await this._noteBookManager.init(path);
            this.container.removeChild(this.emptyFolderTag);
        } catch(err) {
            throw err;
        }
    }

    /**
     * @description callback functions for resize folder view.
     */
    private _resizeView(event: MouseEvent): void {

        // minimum width for folder view to be resized
        if (event.x < 200) {
            return;
        }
        // TODO: remove later
        const explorerView = document.getElementById('action-view') as HTMLElement;
        const contentView = document.getElementById('editor-view') as HTMLElement;
        let dx = this.resizeX - event.x;
        this.resizeX = event.x;
        /* new X has to be calculated first, than concatenates with "px", otherwise
           the string will be like newX = "1000+2px" and losing accuracy */
        let explorerViewNewX = parseInt(getComputedStyle(explorerView, '').width) - dx;
        let contentViewNewX = parseInt(getComputedStyle(contentView, '').width) + dx;
        
        explorerView.style.width = explorerViewNewX + "px";
        explorerView.style.minWidth = explorerViewNewX + "px";
        contentView.style.width = contentViewNewX + "px";
    }

}

