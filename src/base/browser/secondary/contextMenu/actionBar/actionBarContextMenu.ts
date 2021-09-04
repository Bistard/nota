import { ContextMenu, ContextMenuType, Coordinate, IContextMenu } from "src/base/browser/secondary/contextMenu/contextMenu";
import { IComponentService } from "src/code/browser/service/componentService";
import { IContextMenuService } from "src/code/browser/service/contextMenuService";
import { IActionBarOptions, IActionBarService } from "src/code/browser/workbench/actionBar/actionBar";
import { ActionViewType } from "src/code/browser/workbench/actionView/actionView";
import { EVENT_EMITTER } from "src/base/common/event";
import { currFocusActionBtnIndex } from "src/code/browser/workbench/actionBar/actionBar";
import { IButton } from "src/base/browser/basic/button";

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
        
        const actionBarService = this.componentService.get('action-bar') as IActionBarService;

        this._menuItemGroups.get('select-explorer-button')!.element.addEventListener('click', () => {
            const actionButton = actionBarService.getButton("explorer-button")!;
            console.log(actionButton.element.style.display);
            if (actionButton.element.style.display == 'none') {
                actionButton.element.style.display = 'initial';
                actionBarOpts.options[0] = true;
            } else {
                actionButton.element.style.display = 'none';
                actionBarOpts.options[0] = false;
            }
            this.switchActionBtnAndActionView(actionBarService, actionButton, 0);
            this.contextMenuService.removeContextMenu();
        });

        this._menuItemGroups.get('select-outline-button')!.element.addEventListener('click', () => {
            const actionButton = actionBarService.getButton("outline-button")!;
            console.log(actionButton.element.style.display);
            if (actionButton.element.style.display == 'none') {
                actionButton.element.style.display = 'initial';
                actionBarOpts.options[1] = true;
            } else {
                actionButton.element.style.display = 'none';
                actionBarOpts.options[1] = false;
            }
            this.switchActionBtnAndActionView(actionBarService, actionButton, 1);
            this.contextMenuService.removeContextMenu();
        });

        this._menuItemGroups.get('select-search-button')!.element.addEventListener('click', () => {
            const actionButton = actionBarService.getButton("search-button")!;
            console.log(actionButton.element.style.display);
            if (actionButton.element.style.display == 'none') {
                actionButton.element.style.display = 'initial';
                actionBarOpts.options[2] = true;
            } else {
                actionButton.element.style.display = 'none';
                actionBarOpts.options[2] = false;
            }
            this.switchActionBtnAndActionView(actionBarService, actionButton, 2);
            this.contextMenuService.removeContextMenu();
        });

        this._menuItemGroups.get('select-git-button')!.element.addEventListener('click', () => {
            const actionButton = actionBarService.getButton("git-button")!;
            console.log(actionButton.element.style.display);
            if (actionButton.element.style.display == 'none') {
                actionButton.element.style.display = 'initial';
                actionBarOpts.options[3] = true;
            } else {
                actionButton.element.style.display = 'none';
                actionBarOpts.options[3] = false;
            }
            this.switchActionBtnAndActionView(actionBarService, actionButton, 3);
            this.contextMenuService.removeContextMenu();
        });
    } 

    /**
     * @description unchecks a given button. If it is not focused, set it as 
     * focused. Moreover, switch to that action view.
     */
    public switchActionBtnAndActionView(actionBarService: IActionBarService, clickedBtn: IButton, clickedIndex: number): void {
        // get which action button is clicking
        // const actionName = clickedBtn.id;

        // focus the action button and reverse the state of action view
        const actionBtnContainer = actionBarService.contentArea!;
        const currFocusBtn = actionBtnContainer.children[currFocusActionBtnIndex.index] as HTMLElement;
            
        let activeBtnCount = 0;
        const activeBtnIndex: number[] = [];
        for (let i = 0; i < actionBarOpts.options.length; i++) {
            if (actionBarOpts.options[i] === true) {
                activeBtnCount++;
                activeBtnIndex.push(i);
            }
        }
        
        if (activeBtnCount === 0) {
            currFocusActionBtnIndex.index = -1;
            EVENT_EMITTER.emit('EOnActionViewClose');
            currFocusBtn.classList.remove('action-button-focus'); 
        } else if (activeBtnCount == 1) {
            // reaches when re-displaying actionBarButton
            const i = activeBtnIndex[0]!;
            currFocusActionBtnIndex.index = i;
            EVENT_EMITTER.emit('EOnActionViewOpen');
            const checkedBtn = actionBtnContainer.children[i] as HTMLElement;
            checkedBtn.classList.add('action-button-focus');
            EVENT_EMITTER.emit('EOnActionViewChange', actionBarOpts.id[i]);  
        } else if (clickedIndex >= 0) {
            for (let i = clickedIndex; i < 4; i++) {
                if (actionBarOpts.options[i]) {
                    currFocusActionBtnIndex.index = i;
                    const checkedBtn = actionBtnContainer.children[i] as HTMLElement;
                    currFocusBtn.classList.remove('action-button-focus');
                    checkedBtn.classList.add('action-button-focus');
                    EVENT_EMITTER.emit('EOnActionViewChange', actionBarOpts.id[i]);
                    return;
               }
            }
            for (let i = clickedIndex; i >= 0; i--) {
                if (actionBarOpts.options[i]) {
                    currFocusActionBtnIndex.index = i;
                    const checkedBtn = actionBtnContainer.children[i] as HTMLElement;
                    currFocusBtn.classList.remove('action-button-focus');
                    checkedBtn.classList.add('action-button-focus');  
                    EVENT_EMITTER.emit('EOnActionViewChange', actionBarOpts.id[i]);  
                    return;
                }
            }
        } else {
            throw 'error';
        }
    }  
}