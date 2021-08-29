import { ContextMenu, ContextMenuType, Dimension } from "src/base/browser/secondary/contextMenu/contextMenu";
import { CONTEXT_MENU_SERVICE } from 'src/code/workbench/service/contextMenuService';

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
                {id: 'select-git-button', classes: ['menu-item'], text: 'Git', role: 'normal'},
            ],
        );
    }

    protected override _registerListeners(): void {
        document.getElementById('copy')!.addEventListener('click', (ev) => {
            ev.preventDefault();
            document.execCommand("copy");
            CONTEXT_MENU_SERVICE.removeContextMenu();

        })

        document.getElementById('paste')!.addEventListener('click', (ev) => {
            ev.preventDefault();
            document.execCommand("paste");
            CONTEXT_MENU_SERVICE.removeContextMenu();

        })

        document.getElementById('cut')!.addEventListener('click', (ev) => {
            ev.preventDefault();
            document.execCommand("cut");
            CONTEXT_MENU_SERVICE.removeContextMenu();

        })
    } 
}