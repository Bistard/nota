import { ContextMenu, ContextMenuType, Dimension } from "src/base/browser/secondary/contextMenu/contextMenu";
import { CONTEXT_MENU_SERVICE } from 'src/code/workbench/service/contextMenuService';
import { ipcRendererSend } from "src/base/electron/register";

export class EditorContextMenu extends ContextMenu {
    
    constructor(dimension: Dimension) {
        super(
            ContextMenuType.actionBar, 
            dimension,
            [
                {id: 'copy', classes: ['menu-item'], text: 'Copy', role: 'normal'},
                {id: 'paste', classes: ['menu-item'], text: 'Paste', role: 'normal'},
                {id: 'cut', classes: ['menu-item'], text: 'Cut', role: 'normal'},
                {text: 'seperator', role: 'seperator'},
                {id: 'Delete', classes: ['menu-item'], text: 'Delete', role: 'normal', enable: false},
                {id: 'Sub Menu', classes: ['menu-item'], text: 'Sub Menu', role: 'subMenu'},
            ],
        );
    }

    protected override _registerListeners(): void {
        document.getElementById('copy')!.addEventListener('click', (ev) => {
            ev.preventDefault();
            //document.execCommand("copy");
            ipcRendererSend('copy');
            CONTEXT_MENU_SERVICE.removeContextMenu();

        })

        document.getElementById('paste')!.addEventListener('click', (ev) => {
            ev.preventDefault();
            //document.execCommand("paste");
            ipcRendererSend('context-menu');
            CONTEXT_MENU_SERVICE.removeContextMenu();

        })

        document.getElementById('cut')!.addEventListener('click', (ev) => {
            ev.preventDefault();
            document.execCommand("delete");
            ipcRendererSend('delete');
            CONTEXT_MENU_SERVICE.removeContextMenu();

        })
    } 
}