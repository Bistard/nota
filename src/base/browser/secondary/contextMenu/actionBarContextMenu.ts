import { ContextMenu, ContextMenuType, Dimension } from "src/base/browser/secondary/contextMenu/contextMenu";

export class ActionBarContextMenu extends ContextMenu {
    
    constructor(dimension: Dimension) {
        super(
            ContextMenuType.actionBar, 
            dimension,
            [
                {id: 'select-explorer-button', classes: ['menu-item'], text: 'Explorer', role: 'normal'},
                {id: 'select-outline-button', classes: ['menu-item'], text: 'Outline', role: 'normal'},
                {id: 'select-search-button', classes: ['menu-item'], text: 'Search', role: 'normal'},
                {id: 'select-git-button', classes: ['menu-item'], text: 'Git', role: 'normal'},
            ],
        );
    }

    protected override _registerListeners(): void {
        document.getElementById('select-explorer-button')!.addEventListener('click', (ev) => {
            //ev.preventDefault();
            console.log('good');
            const actionButton = document.getElementById("explorer-button");
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
            } else {
                actionButton!.style.display = 'none';
            } 
        })
    } 
}