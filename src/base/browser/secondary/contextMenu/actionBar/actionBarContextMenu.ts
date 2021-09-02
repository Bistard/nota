import { ContextMenu, ContextMenuType, Coordinate, IContextMenu } from "src/base/browser/secondary/contextMenu/contextMenu";
import { IComponentService } from "src/code/browser/service/componentService";
import { IContextMenuService } from "src/code/browser/service/contextMenuService";

export class ActionBarContextMenu extends ContextMenu implements IContextMenu {
    
    constructor(
        coordinate: Coordinate,
        private readonly contextMenuService: IContextMenuService,
        @IComponentService componentService: IComponentService,
    ) {
        super(
            ContextMenuType.actionBar, 
            coordinate,
            [
                {id: 'select-explorer-button', classes: ['menu-item'], text: 'File Explorer', role: 'checkBox'},
                {id: 'select-outline-button', classes: ['menu-item'], text: 'Outline', role: 'checkBox'},
                {id: 'select-search-button', classes: ['menu-item'], text: 'Search', role: 'normal'},
                {text: 'seperator', role: 'seperator'},
                {id: 'select-git-button', classes: ['menu-item'], text: 'Git', role: 'normal'},
            ],
            componentService,
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
            this.contextMenuService.removeContextMenu();
 
        })
    } 
}