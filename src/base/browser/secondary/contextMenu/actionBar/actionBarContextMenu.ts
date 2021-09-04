import { ContextMenu, ContextMenuType, Coordinate, IContextMenu } from "src/base/browser/secondary/contextMenu/contextMenu";
import { IComponentService } from "src/code/browser/service/componentService";
import { IContextMenuService } from "src/code/browser/service/contextMenuService";
import { IActionBarOptions } from "src/code/browser/workbench/actionBar/actionBar";
import { ActionViewType } from "src/code/browser/workbench/actionView/actionView";
import { EVENT_EMITTER } from "src/base/common/event";
import { currFocusActionBtnIndex } from "src/code/browser/workbench/actionBar/actionBar";
import { Button } from "src/base/browser/basic/button";

const actionBarOpts: IActionBarOptions = { 
    options: [true, true, true, true],
    id: ['explorer', 'outline', 'search', 'git'],
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
        
        this._menuItemGroups.get('select-explorer-button')!.element.addEventListener('click', (ev) => {
            const actionButton = document.getElementById("explorer-button");
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
                actionBarOpts.options[0] = true;
            } else {
                actionButton!.style.display = 'none';
                actionBarOpts.options[0] = false;
            }
            this.switchActionBtn(actionButton as HTMLElement);
            this.contextMenuService.removeContextMenu();
        });

        this._menuItemGroups.get('select-outline-button')!.element.addEventListener('click', (ev) => {
            const actionButton = document.getElementById("outline-button");
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
                actionBarOpts.options[1] = true;
            } else {
                actionButton!.style.display = 'none';
                actionBarOpts.options[1] = false;
            }
            this.switchActionBtn(actionButton as HTMLElement);
            this.contextMenuService.removeContextMenu();
        });

        this._menuItemGroups.get('select-search-button')!.element.addEventListener('click', (ev) => {
            const actionButton = document.getElementById("search-button");
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
                actionBarOpts.options[2] = true;
            } else {
                actionButton!.style.display = 'none';
                actionBarOpts.options[2] = false;
            }
            this.switchActionBtn(actionButton as HTMLElement);
            this.contextMenuService.removeContextMenu();
        });

        this._menuItemGroups.get('select-git-button')!.element.addEventListener('click', (ev) => {
            const actionButton = document.getElementById("git-button");
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
                actionBarOpts.options[3] = true;
            } else {
                actionButton!.style.display = 'none';
                actionBarOpts.options[3] = false;
            }
            this.switchActionBtn(actionButton as HTMLElement);
            this.contextMenuService.removeContextMenu();
        });
    } 

    /**
     * @description unchecks a given button. If it is not focused, set it as 
     * focused. Moreover, switch to that action view.
     */
     public switchActionBtn(clickedBtn: HTMLElement): void {
        // get which action button is clicking
        const actionName = clickedBtn.id.slice(0, -"-button".length) as ActionViewType;

        // focus the action button and reverse the state of action view
        const clickedBtnIndex = parseInt(clickedBtn.getAttribute('btnNum') as string);
        const actionBtnContainer = clickedBtn.parentNode as HTMLElement;
        const currBtn = actionBtnContainer.children[currFocusActionBtnIndex.index] as HTMLElement;
            
        let checker = arr => arr.every(v => v === false);
        const state = checker(actionBarOpts.options);
        const countTrue = actionBarOpts.options.filter(Boolean).length;

        if (state){
            currFocusActionBtnIndex.index = -1;
            EVENT_EMITTER.emit('EOnActionViewClose');
            currBtn.classList.remove('action-button-focus'); 
            
        } else if (countTrue == 1) {
            let i:number;
            for (i = 0; i < 4; i++){
                if (actionBarOpts.options[i]){
                    currFocusActionBtnIndex.index = i;
                    EVENT_EMITTER.emit('EOnActionViewOpen');
                    const checkedBtn = actionBtnContainer.children[i] as HTMLElement;
                    checkedBtn.classList.add('action-button-focus');
                    EVENT_EMITTER.emit('EOnActionViewChange', actionBarOpts.id[i]);  
                }
            }
        } else if (clickedBtnIndex >= 0){
            let i:number;
            for(i = clickedBtnIndex;i < 4;i++) {
               if (actionBarOpts.options[i]){
                currFocusActionBtnIndex.index = i;
                const checkedBtn = actionBtnContainer.children[i] as HTMLElement;
                currBtn.classList.remove('action-button-focus');
                checkedBtn.classList.add('action-button-focus');
                EVENT_EMITTER.emit('EOnActionViewChange', actionBarOpts.id[i]);   
                return;
               }
            };
            for(i = clickedBtnIndex;i >= 0;i--) {
                if (actionBarOpts.options[i]){
                 currFocusActionBtnIndex.index = i;
                 const checkedBtn = actionBtnContainer.children[i] as HTMLElement;
                 currBtn.classList.remove('action-button-focus');
                 checkedBtn.classList.add('action-button-focus');  
                 EVENT_EMITTER.emit('EOnActionViewChange', actionBarOpts.id[i]);  
                 return;
                }
             };
        } else {
            throw 'error'
        }
    }  
}