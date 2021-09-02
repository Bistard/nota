import { ContextMenu, ContextMenuType, Coordinate, IContextMenu } from "src/base/browser/secondary/contextMenu/contextMenu";
import { ipcRendererSend } from "src/base/electron/register";
import { IContextMenuService } from "src/code/browser/service/contextMenuService";

export class EditorContextMenu extends ContextMenu implements IContextMenu {
    
    constructor(
        coordinate: Coordinate,
        private readonly contextMenuService: IContextMenuService,
    ) {
        super(
            ContextMenuType.actionBar, 
            coordinate,
            [
                {id: 'copy', classes: ['menu-item'], text: 'Copy', role: 'normal'},
                {id: 'paste', classes: ['menu-item'], text: 'Paste', role: 'normal'},
                {id: 'cut', classes: ['menu-item'], text: 'Cut', role: 'normal'},
                {text: 'seperator', role: 'seperator'},
                {id: 'select all', classes: ['menu-item'], text: 'Select All', role: 'normal'},
                {text: 'seperator', role: 'seperator'},
                {id: 'Delete', classes: ['menu-item'], text: 'Delete', role: 'normal', enable: false},
                {id: 'Sub Menu', classes: ['menu-item'], text: 'Sub Menu', role: 'subMenu'},
            ],
        );
    }

    protected override _registerListeners(): void {
        
        document.getElementById('copy')!.addEventListener('click', (ev) => {
            document.execCommand("copy");
            this.contextMenuService.removeContextMenu();
        });

        document.getElementById('paste')!.addEventListener('click', (ev) => {
            document.execCommand("paste");
            this.contextMenuService.removeContextMenu();
        });

        document.getElementById('cut')!.addEventListener('click', (ev) => {
            document.execCommand("cut");
            this.contextMenuService.removeContextMenu();
        });

        document.getElementById('select all')!.addEventListener('click', (ev) => {
            document.execCommand("selectAll");
            this.contextMenuService..removeContextMenu();
        });

    } 
}