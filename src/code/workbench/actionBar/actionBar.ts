import { ActionViewType } from 'mdnote';
import { ActionViewModule } from "src/code/workbench/actionView/actionView";

/**
 * @description ActionBarModule provides access to each action view and handles 
 * the state transition between each action button and display coressponding 
 * action view.
 */
export class ActionBarModule {

    ActionView: ActionViewModule;

    // indicates which action button is focused, -1 if none.
    currFocusActionBtnIndex: number;

    // indicates whether action view is opened or not.
    isActionViewActive: boolean;

    constructor(ActionViewModule: ActionViewModule) {

        this.ActionView = ActionViewModule;

        this.currFocusActionBtnIndex = -1;

        this.isActionViewActive = false;

        this.initActionBar();
        this._setListeners();
    }

    /**
     * @description initialize creating action bar.
     */
    public initActionBar(): void {
        // give every actionButton a unique number.
        $('.action-button').each(function(index, element) {
            element.setAttribute('btnNum', index.toString());
        })
        
        this.clickActionBtn(document.getElementById('folder-button') as HTMLElement);
    }

    /**
     * @description clicks a given button. If it is not focused, set it as 
     * focused. Moreover, switch to that action view.
     */
    public clickActionBtn(clickedBtn: HTMLElement): void {
        // get which action button is clicking
        const actionName = clickedBtn.id.slice(0, -"-button".length) as ActionViewType;
        
        // switch to the action view
        this.ActionView.switchToActionView(actionName);

        // focus the action button and reverse the state of action view
        const clickedBtnIndex = parseInt(clickedBtn.getAttribute('btnNum') as string);
        const actionBtnContainer = clickedBtn.parentNode as HTMLElement;
        const currBtn = actionBtnContainer.children[this.currFocusActionBtnIndex] as HTMLElement;
            
        if (this.currFocusActionBtnIndex == -1) {
            // none of action button is focused, open the action view
            this.currFocusActionBtnIndex = clickedBtnIndex;
            this.ActionView.openActionView();
            clickedBtn.classList.add('action-button-focus');
        } else if (this.currFocusActionBtnIndex == clickedBtnIndex) {
            // if the current focused button is clicked again, close action view.
            this.currFocusActionBtnIndex = -1;
            this.ActionView.closeActionView();
            currBtn.classList.remove('action-button-focus');
        } else if (this.currFocusActionBtnIndex >= 0) {
            // other action button is clicked, only change the style
            this.currFocusActionBtnIndex = clickedBtnIndex;
            currBtn.classList.remove('action-button-focus');
            clickedBtn.classList.add('action-button-focus');
        } else {
            throw 'error';
        }
    }

    /**
     * @description set actionBar listeners.
     */
    private _setListeners(): void {
        // TODO: comeplete using my own API
        $('.action-button').on('click', { ActionBarModule: this }, function (event) {
            let that = event.data.ActionBarModule;
            that.clickActionBtn(this);
        })
    }

}
