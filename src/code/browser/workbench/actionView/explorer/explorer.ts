import { FileNode } from 'src/base/node/fileTree';
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from 'src/base/electron/register';
import { Component, ComponentType, IComponent } from 'src/code/browser/workbench/component';
import { EVENT_EMITTER } from 'src/base/common/event';
import { INoteBookManagerService } from 'src/code/common/model/notebookManager';
import { IComponentService } from 'src/code/browser/service/componentService';
import { ContextMenuType, Coordinate } from 'src/base/browser/secondary/contextMenu/contextMenu';
import { IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { createDecorator } from 'src/code/common/service/instantiationService/decorator';
import { Ii18nService } from 'src/code/platform/i18n/i18n';
import { Section } from 'src/code/platform/i18n/section';
import { registerSingleton } from 'src/code/common/service/instantiationService/serviceCollection';
import { ServiceDescriptor } from 'src/code/common/service/instantiationService/descriptor';

export const IExplorerViewService = createDecorator<IExplorerViewService>('explorer-view-service');

export interface IExplorerViewService extends IComponent {
    fileTreeContainer: HTMLElement;
    emptyFolderTag: HTMLElement;
    openNoteBookManager(path: string): Promise<void>;
}

/**
 * @class TODO: complete comments
 */
export class ExplorerViewComponent extends Component implements IExplorerViewService {

    public fileTreeContainer: HTMLElement = document.createElement('div');
    public emptyFolderTag: HTMLElement = document.createElement('div');

    constructor(parentComponent: Component,
                parentElement: HTMLElement,
                @Ii18nService private readonly i18nService: Ii18nService,
                @INoteBookManagerService private readonly noteBookManagerService: INoteBookManagerService,
                @IComponentService componentService: IComponentService,
                @IContextMenuService private readonly contextMenuService: IContextMenuService,
    ) {
        super(ComponentType.ExplorerView, parentComponent, parentElement, componentService);
    }

    protected override _createContent(): void {
        this.fileTreeContainer.id = 'fileTree-container';
        
        this.emptyFolderTag.id = 'emptyFolderTag';
        this.emptyFolderTag.innerHTML = this.i18nService.trans(Section.Explorer, 'openDirectory');
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

                this.contextMenuService.createContextMenu(ContextMenuType.explorerView, coordinate);

        });

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

}

registerSingleton(IExplorerViewService, new ServiceDescriptor(ExplorerViewComponent));