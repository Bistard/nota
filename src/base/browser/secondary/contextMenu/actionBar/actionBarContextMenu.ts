import { ContextMenu, ContextMenuType, Coordinate, IContextMenu } from "src/base/browser/secondary/contextMenu/contextMenu";
import { IComponentService } from "src/code/browser/service/componentService";
import { IContextMenuService } from "src/code/browser/service/contextMenuService";
import { IActionBarOptions } from "src/code/browser/workbench/actionBar/actionBar";
import { IButton } from "src/base/browser/basic/button/button";

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
        
        // TODO: refactor
        // const actionBarService = this.componentService.get(ComponentType.ActionBar) as IActionBarService;

        // [
        //     { contextMenuBtn: this._menuItemGroups.get('select-explorer-button')!, actionBtn: actionBarService.getButton(ActionType.EXPLORER)! },
        //     { contextMenuBtn: this._menuItemGroups.get('select-outline-button')!, actionBtn: actionBarService.getButton(ActionType.OUTLINE)! },
        //     { contextMenuBtn: this._menuItemGroups.get('select-search-button')!, actionBtn: actionBarService.getButton(ActionType.SEARCH)! },
        //     { contextMenuBtn: this._menuItemGroups.get('select-git-button')!, actionBtn: actionBarService.getButton(ActionType.GIT)! },
        // ]
        // .forEach(({contextMenuBtn, actionBtn}, index: number ) => {
        //     contextMenuBtn.element.addEventListener('click', () => {
        //         const closeOrOpen = this.switchButtonDisplay(actionBtn, index);
        //         this.switchActionViewDisplay(actionBarService, actionBtn, closeOrOpen, index);
        //         this.contextMenuService.removeContextMenu();
        //     });
        // });

    } 

    // TODO: this function needs to be refactor
    /**
     * @description unchecks a given button. If it is not focused, set it as 
     * focused. Moreover, switch to that action view.
     */
    // public switchActionViewDisplay(actionBarService: IActionBarService, clickedBtn: IButton, closeOrOpen: boolean, clickedIndex: number): void {

    //     // focus the action button and reverse the state of action view
    //     const actionBtnContainer = actionBarService.contentArea!;
    //     const currFocus = actionBarService.getFocusIndex() as number;
    //     const currFocusBtn = actionBtnContainer.children[currFocus] as HTMLElement;
    //     const actionViewService = this.componentService.get(ComponentType.ActionView) as IActionViewService;

    //     let activeBtnCount = 0;
    //     const activeBtnIndex: number[] = [];
    //     for (let i = 0; i < actionBarOpts.options.length; i++) {
    //         if (actionBarOpts.options[i] === true) {
    //             activeBtnCount++;
    //             activeBtnIndex.push(i);
    //         }
    //     }
        
    //     if (activeBtnCount === 0) {
    //         actionBarService.modifyFocusIndex(-1);
    //         //EVENT_EMITTER.emit('EOnActionViewClose');
    //         actionViewService.EOnActionViewClose.fire();
    //         currFocusBtn.classList.remove('action-button-focus'); 
    //     } else if (activeBtnCount === 1) {
    //         // reaches when re-displaying actionBarButton
    //         const i = activeBtnIndex[0]!;
    //         actionBarService.modifyFocusIndex(i);
    //         //EVENT_EMITTER.emit('EOnActionViewOpen');
    //         actionViewService.EOnActionViewOpen.fire();
    //         const checkedBtn = actionBtnContainer.children[i] as HTMLElement;
    //         checkedBtn.classList.add('action-button-focus');
    //         EVENT_EMITTER.emit('onActionViewChange', actionBarOpts.id[i]);  
    //     } else if (clickedIndex >= 0) {
    //         for (let i = clickedIndex; i < 4; i++) {
    //             if (actionBarOpts.options[i]) {
    //                 actionBarService.modifyFocusIndex(i);
    //                 const checkedBtn = actionBtnContainer.children[i] as HTMLElement;
    //                 currFocusBtn.classList.remove('action-button-focus');
    //                 checkedBtn.classList.add('action-button-focus');
    //                 EVENT_EMITTER.emit('onActionViewChange', actionBarOpts.id[i]);
    //                 return;
    //            }
    //         }
    //         for (let i = clickedIndex; i >= 0; i--) {
    //             if (actionBarOpts.options[i]) {
    //                 actionBarService.modifyFocusIndex(i);
    //                 const checkedBtn = actionBtnContainer.children[i] as HTMLElement;
    //                 currFocusBtn.classList.remove('action-button-focus');
    //                 checkedBtn.classList.add('action-button-focus');  
    //                 EVENT_EMITTER.emit('onActionViewChange', actionBarOpts.id[i]);  
    //                 return;
    //             }
    //         }
    //     } else {
    //         throw 'error';
    //     }
    // }  

    public switchButtonDisplay(button: IButton, index: number): boolean {
        return false;
        // TODO: refactor
        // if (button.element.style.display === 'none') {
        //     button.element.style.display = 'initial';
        //     actionBarOpts.options[index] = true;
        //     return true;
        // } else {
        //     button.element.style.display = 'none';
        //     actionBarOpts.options[index] = false;
        //     return false;
        // }
    }
}