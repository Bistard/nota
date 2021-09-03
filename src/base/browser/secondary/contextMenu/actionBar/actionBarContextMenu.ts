import { ContextMenu, ContextMenuType, Coordinate, IContextMenu } from "src/base/browser/secondary/contextMenu/contextMenu";
import { IComponentService } from "src/code/browser/service/componentService";
import { IContextMenuService } from "src/code/browser/service/contextMenuService";
import { IActionBarOptions } from "src/code/browser/workbench/actionBar/actionBar";

const actionBarOpts: IActionBarOptions = { 
    options: [true, true, true, true],
}

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
                { id: 'select-explorer-button', classes: ['menu-item'], text: 'File Explorer', role: 'checkBox', checked: actionBarOpts.options[0] },
                { id: 'select-outline-button', classes: ['menu-item'], text: 'Outline', role: 'checkBox', checked: actionBarOpts.options[1] },
                { id: 'select-search-button', classes: ['menu-item'], text: 'Search', role: 'checkBox', checked: actionBarOpts.options[2] },
                { id: 'select-git-button', classes: ['menu-item'], text: 'Git', role: 'checkBox', checked: actionBarOpts.options[3] },
            ],
            componentService
        );
    }

    protected override _registerListeners(): void {
    
        document.getElementById('select-explorer-button')!.addEventListener('click', (ev) => {
            const actionButton = document.getElementById("explorer-button");
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
                actionBarOpts.options[0] = true;
            } else {
                actionButton!.style.display = 'none';
                actionBarOpts.options[0] = false;
            }
            this.contextMenuService.removeContextMenu();
 
        });

        document.getElementById('select-outline-button')!.addEventListener('click', (ev) => {
            const actionButton = document.getElementById("outline-button");
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
                actionBarOpts.options[1] = true;
            } else {
                actionButton!.style.display = 'none';
                actionBarOpts.options[1] = false;
            }
            this.contextMenuService.removeContextMenu();
 
        });

        document.getElementById('select-search-button')!.addEventListener('click', (ev) => {
            const actionButton = document.getElementById("search-button");
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
                actionBarOpts.options[2] = true;
            } else {
                actionButton!.style.display = 'none';
                actionBarOpts.options[2] = false;
            }
            this.contextMenuService.removeContextMenu();
 
        });

        document.getElementById('select-git-button')!.addEventListener('click', (ev) => {
            const actionButton = document.getElementById("git-button");
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
                actionBarOpts.options[3] = true;
            } else {
                actionButton!.style.display = 'none';
                actionBarOpts.options[3] = false;
            }
            this.contextMenuService.removeContextMenu();
 
        });
    } 
}