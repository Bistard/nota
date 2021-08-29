import { ContextMenu, ContextMenuType, Dimension } from "src/base/browser/secondary/contextMenu/contextMenu";

export class ActionBarContextMenu extends ContextMenu {
    
    constructor(dimension: Dimension) {
        super(
            ContextMenuType.actionBar, 
            dimension,
            [
                {id: 'select-explorer-button', classes: ['menu-item'], text: 'File Explorer', role: 'checkBox'},
                {id: 'select-outline-button', classes: ['menu-item'], text: 'Outline', role: 'checkBox'},
                {id: 'select-search-button', classes: ['menu-item'], text: 'Search', role: 'normal'},
                {id: 'select-git-button', classes: ['menu-item'], text: 'Git', role: 'normal'},
            ],
        );
    }

    protected override _registerListeners(): void {
        document.getElementById('select-explorer-button')!.addEventListener('click', (ev) => {
            //ev.preventDefault();
            const actionButton = document.getElementById("explorer-button");
            const actionButtonContextMenu = document.getElementById("select-explorer-button-check-mark");
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
                actionButtonContextMenu!.style.filter = 'none';
            } else {
                actionButton!.style.display = 'none';
                actionButtonContextMenu!.style.filter = 'invert(88%) sepia(73%) saturate(4498%) hue-rotate(184deg) brightness(128%) contrast(93%)';
            } 
        })
    } 
}