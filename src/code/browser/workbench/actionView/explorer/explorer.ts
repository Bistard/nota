import { FileNode } from 'src/base/node/fileTree';
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from 'src/base/electron/register';
import { Component } from 'src/code/browser/workbench/component';
import { ActionViewComponentType } from 'src/code/browser/workbench/actionView/actionView';
import { EVENT_EMITTER } from 'src/base/common/event';
import { INoteBookManagerService } from 'src/code/common/model/notebookManager';
import { IComponentService } from 'src/code/browser/service/componentService';
import { createDecorator } from 'src/code/common/service/instantiation/decorator';
import { ContextMenuType, Coordinate } from 'src/base/browser/secondary/contextMenu/contextMenu';
import { IContextMenuService } from 'src/code/browser/service/contextMenuService';

export const IExplorerViewService = createDecorator<IExplorerViewService>('explorer-view-service');

export interface IExplorerViewService {
    resizeX: number;
    fileTreeContainer: HTMLElement;
    emptyFolderTag: HTMLElement;
    openNoteBookManager(path: string): Promise<void>;
}

/**
 * @description TODO: complete comments
 */
export class ExplorerViewComponent extends Component implements IExplorerViewService {

    public resizeX: number;

    public fileTreeContainer: HTMLElement = document.createElement('div');
    public emptyFolderTag: HTMLElement = document.createElement('div');

    constructor(parentComponent: Component,
                parentElement: HTMLElement,
                @INoteBookManagerService private readonly noteBookManagerService: INoteBookManagerService,
                @IComponentService componentService: IComponentService,
                @IContextMenuService private readonly contextMenuService: IContextMenuService,
    ) {
        super(ActionViewComponentType.ExplorerView, parentComponent, parentElement, componentService);

        // this variable is to store the x-coordinate of the resizeBar in the explorer view
        this.resizeX = 0;
    }

    protected override _createContent(): void {
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

    /**
                 * @readonly register context menu listeners (right click menu)
                 */
     document.getElementById('explorer-container')!.addEventListener('contextmenu', (ev: MouseEvent) => {
        ev.preventDefault();
        this.contextMenuService.removeContextMenu();
        let coordinate: Coordinate = {
            coordinateX: ev.pageX,
            coordinateY: ev.pageY,
        };

        this.contextMenuService.createContextMenu(ContextMenuType.actionView, coordinate);

    });
/*

         domNodeByIdAddListener('action-view-content', 'contextmenu', (event) => {
            event.preventDefault()
            console.log('right clicked on action view')
            //console.log(event.target)
            //console.log(event.currentTarget)
            ipcRendererSend('showContextMenuView')        
        })
        */

        domNodeByIdAddListener('emptyFolderTag', 'click', () => {
            ipcRendererSend('openDir');
        });

        /**
         * set openDir listener to get response back from main.js.
         * eg. D:\dev\AllNote
         */
        ipcRendererOn('openDir', (_event, path, _stat) => {
            this.openNoteBookManager(path);
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

        // not used for now
        EVENT_EMITTER.register('EFileOnClick', (nodeInfo: FileNode) => FileNode.fileOnClick(nodeInfo));
        EVENT_EMITTER.register('EFolderOnClick', (nodeInfo: FileNode) => FileNode.folderOnClick(nodeInfo));

        EVENT_EMITTER.register('EOpenNoteBookManager', (path: string) => this.openNoteBookManager(path));

/*
        domNodeByIdAddListener('explorer-container', 'contextmenu', (event) => {
            event.preventDefault();
            ipcRendererSend('showContextMenuExplorer');
        });
        */
    }

    /**
     * @description display the noteBookManger.
     * 
     * function will be called when 'openDir' message is sended from the main thread.
     * 
     * @param path eg. D:\dev\AllNote
     */
    public async openNoteBookManager(path: string): Promise<void> {
        try {
            await this.noteBookManagerService.open(path);
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

