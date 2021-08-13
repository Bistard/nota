import { ActionViewType } from 'mdnote';
import { getSvgPathByName } from 'src/base/common/string';
import { Component, ComponentType } from 'src/code/workbench/browser/component';
import { IActionViewService } from 'src/code/workbench/service/actionViewService';
import { IWorkbenchService } from 'src/code/workbench/service/workbenchService';

/**
 * @description ActionViewComponent displays different action view such as 
 * folderView, outlineView, gitView and so on.
 */
export class ActionViewComponent extends Component implements IActionViewService {

    public whichActionView: ActionViewType;

    constructor(workbenchService: IWorkbenchService) {
        super(ComponentType.ActionView, workbenchService);
        
        this.whichActionView = 'none';
    }

    // TODO: complete
    /**
     * @description function to create the actual html layout and will be called
     * by 'create()' from the Component class.
     */
     public override _createContentArea(parent: HTMLElement): HTMLElement {
        this.parent = parent;
        
        const contentArea = document.createElement('div');
        contentArea.id = 'action-view-container';

        const actionViewTop = this._createActionViewTop();
        const actionViewContent = this._createActionViewContent();

        contentArea.appendChild(actionViewTop);
        contentArea.appendChild(actionViewContent);
        return contentArea;
    }

    // TODO: genericize
    private _createActionViewTop(): HTMLElement {
        const actionViewTop = document.createElement('div');
        actionViewTop.id = 'action-view-top';

        const topText = document.createElement('div');
        topText.id = 'action-view-top-text';
        topText.innerHTML = 'Notebook';
        topText.classList.add('pureText', 'captialize');

        const topIcon = document.createElement('img');
        topIcon.id = 'action-view-top-icon';
        topIcon.src = getSvgPathByName('three-dots');
        topIcon.classList.add('vertical-center', 'filter-white');

        actionViewTop.appendChild(topText);
        actionViewTop.appendChild(topIcon);
        return actionViewTop;
    }

    // TODO: genericize
    private _createActionViewContent(): HTMLElement {
        const actionViewContent = document.createElement('div');
        actionViewContent.id = 'action-view-content';

        // TODO: maybe not to initialize them all
        [
            'folder-tree-container',
            'outline-container',
            'search-container',
            'git-container',
        ]
        .forEach(name => {
            const subView = document.createElement('div');
            subView.id = name;

            actionViewContent.appendChild(subView);
        });

        return actionViewContent;
    }

    /**
     * @description switch to that action view given a specific name.
     */
    public switchToActionView(actionViewName: ActionViewType): void {
        if (actionViewName == this.whichActionView) {
            return;
        }
        
        this.displayActionViewTopText(actionViewName);
        this.hideActionViewContent();
        
        if (actionViewName == 'folder') {
            $('#folder-tree-container').show(0);
        } else if (actionViewName == 'outline') {
            $('#outline-container').show(0);
        } else if (actionViewName == 'search') {

        } else if (actionViewName == 'git') {
        
        } else {
            throw 'error';
        }

        this.whichActionView = actionViewName;
    }

    /**
     * @description display given text on the action view top.
     */
    public displayActionViewTopText(name: string): void {
        if (name == 'folder') {
            $('#action-view-top-text').html('Notebook');
        } else if (name == 'git') {
            $('#action-view-top-text').html('Git Control');
        } else {
            $('#action-view-top-text').html(name);
        }
    }

    /**
     * @description simple function for hiding the current content of action view.
     */
    public hideActionViewContent(): void {
        $('#action-view-content').children().each(function() {
            $(this).hide(0);
        });
    }

    /**
     * @description NOT displaying action view.
     */
    public closeActionView(): void {
        $('#action-view').hide(0);
        $('#resize').hide(0);
    }
    
    /**
     * @description displays action view.
     */
    public openActionView(): void {
        $('#action-view').show(0);
        $('#resize').show(0);
    }

}
