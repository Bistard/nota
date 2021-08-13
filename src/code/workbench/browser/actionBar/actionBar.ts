import { ActionViewType } from 'mdnote';
import { Button, IButton } from 'src/base/browser/ui/button';
import { ActionViewComponent } from "src/code/workbench/browser/actionView/actionView";
import { Component, ComponentType } from 'src/code/workbench/browser/component';
import { IWorkbenchService } from 'src/code/workbench/service/workbenchService';

/**
 * @description ActionBarComponent provides access to each action view and handles 
 * the state transition between each action button and display coressponding 
 * action view.
 */
export class ActionBarComponent extends Component {

    private _buttonGroups: IButton[] = [];

    actionViewComponent: ActionViewComponent;

    // indicates which action button is focused, -1 if none.
    currFocusActionBtnIndex: number;

    // indicates whether action view is opened or not.
    isActionViewActive: boolean;

    constructor(workbenchService: IWorkbenchService,
                ActionViewComponent: ActionViewComponent) {
        super(ComponentType.ActionBar, workbenchService);
        
        this.actionViewComponent = ActionViewComponent;

        this.currFocusActionBtnIndex = -1;

        this.isActionViewActive = false;
    }

    protected override _createContainer(): void {
        this.parent.appendChild(this.container);
        // customize...
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'action-button-container';
        this.container.appendChild(this.contentArea);

        [
            {id: 'folder-button', src: 'file'},
            {id: 'outline-button', src: 'list'},
            {id: 'search-button', src: 'search'},
            {id: 'git-button', src: 'git'},
            {id: 'setting-button', src: 'setting'},
        ]
        .forEach(({ id, src }) => {
            const button = new Button(id, this.contentArea!);
            button.setClass('button', 'action-button');
            button.setImage(src);
            button.setImageClass('vertical-center', 'filter-white');

            this._buttonGroups.push(button);
        });
    }

    protected override _registerListensers(): void {

        // TODO: remove later
        // give every actionButton a unique number.
        $('.action-button').each(function(index, element) {
            element.setAttribute('btnNum', index.toString());
        })
        
        this.clickActionBtn(document.getElementById('folder-button') as HTMLElement);

        // TODO: comeplete using my own API
        $('.action-button').on('click', { ActionBarComponent: this }, function (event) {
            let that = event.data.ActionBarComponent;
            that.clickActionBtn(this);
        })
    }

    /**
     * @description clicks a given button. If it is not focused, set it as 
     * focused. Moreover, switch to that action view.
     */
    public clickActionBtn(clickedBtn: HTMLElement): void {
        
        // get which action button is clicking
        const actionName = clickedBtn.id.slice(0, -"-button".length) as ActionViewType;
        
        // switch to the action view
        this.actionViewComponent.switchToActionView(actionName);

        // focus the action button and reverse the state of action view
        const clickedBtnIndex = parseInt(clickedBtn.getAttribute('btnNum') as string);
        const actionBtnContainer = clickedBtn.parentNode as HTMLElement;
        const currBtn = actionBtnContainer.children[this.currFocusActionBtnIndex] as HTMLElement;
            
        if (this.currFocusActionBtnIndex == -1) {
            // none of action button is focused, open the action view
            this.currFocusActionBtnIndex = clickedBtnIndex;
            this.actionViewComponent.openActionView();
            clickedBtn.classList.add('action-button-focus');
        } else if (this.currFocusActionBtnIndex == clickedBtnIndex) {
            // if the current focused button is clicked again, close action view.
            this.currFocusActionBtnIndex = -1;
            this.actionViewComponent.closeActionView();
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

}
