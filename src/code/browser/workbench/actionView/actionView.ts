import { getSvgPathByName, SvgType } from 'src/base/common/string';
import { Component, ComponentType, IComponent } from 'src/code/browser/workbench/component';
import { ExplorerViewComponent } from "src/code/browser/workbench/actionView/explorer/explorer";
import { Emitter, EVENT_EMITTER, Register } from 'src/base/common/event';
import { createDecorator } from 'src/code/common/service/instantiationService/decorator';
import { IComponentService } from 'src/code/browser/service/componentService';
import { IInstantiationService } from 'src/code/common/service/instantiationService/instantiation';
import { ActionType } from 'src/code/browser/workbench/actionBar/actionBar';

export const IActionViewService = createDecorator<IActionViewService>('action-view-service');

export interface IActionViewService extends IComponent {

    actionViewChange(actionViewName: ActionType): void;
    actionViewTopTextOnChange(name: string): void;
    hideActionViewContent(): void;
    closeActionView(): void;
    openActionView(): void;

    onActionViewChange: Register<ActionType>;
}

/**
 * @description ActionViewComponent displays different action view such as 
 * explorerView, outlineView, gitView and so on.
 */
export class ActionViewComponent extends Component implements IActionViewService {

    private _currFocusView: ActionType;
    
    private actionViewContentContainer!: HTMLElement;
    private resize!: HTMLElement;
    private actionViewTitle!: HTMLElement;
    private actionViewContent!: HTMLElement;

    private explorerViewComponent!: ExplorerViewComponent;

    /* Events fired when the action view is switched to others */
    private readonly _onActionViewChange = this.__register( new Emitter<ActionType>() );
    public readonly onActionViewChange = this._onActionViewChange.registerListener;
    
    constructor(parentComponent: Component,
                // @INoteBookManagerService private readonly noteBookManagerService: INoteBookManagerService,
                @IInstantiationService private readonly instantiationService: IInstantiationService,
                @IComponentService componentService: IComponentService,
    ) {
        super(ComponentType.ActionView, parentComponent, null, componentService);
        
        this._currFocusView = ActionType.NONE;
    }

    protected override _createContent(): void {
        
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'action-view-container';
        
        this.actionViewContentContainer = document.createElement('div');
        this.actionViewContentContainer.id = 'action-content-container';

        this.resize = document.createElement('div');
        this.resize.id = 'resize';
        this.resize.classList.add('resizeBtn-style', 'vertical-center');

        this.actionViewTitle = this._createActionViewTop();
        this.actionViewContent = this._createActionViewContent();

        this.actionViewContentContainer.appendChild(this.actionViewTitle);
        this.actionViewContentContainer.appendChild(this.actionViewContent);
        
        this.contentArea.appendChild(this.actionViewContentContainer);
        this.contentArea.appendChild(this.resize);
        
        this.container.appendChild(this.contentArea);

    }

    protected override _registerListeners(): void {

        this.explorerViewComponent.registerListeners();

    }

    private _createActionViewTop(): HTMLElement {
        const actionViewTitle = document.createElement('div');
        actionViewTitle.id = 'action-view-top';

        const topText = document.createElement('div');
        topText.id = 'action-view-top-text';
        topText.innerHTML = 'Explorer';
        topText.classList.add('pureText', 'captialize');

        const topIcon = document.createElement('img');
        topIcon.id = 'action-view-top-icon';
        topIcon.src = getSvgPathByName(SvgType.base, 'three-dots-horizontal');
        topIcon.classList.add('vertical-center', 'filter-black');

        actionViewTitle.appendChild(topText);
        actionViewTitle.appendChild(topIcon);
        return actionViewTitle;
    }

    // TODO: only render the view (DOM elements) when it is actually in is visible to user
    private _createActionViewContent(): HTMLElement {
        const actionViewContent = document.createElement('div');
        actionViewContent.id = 'action-view-content';
        
        this.explorerViewComponent = this.instantiationService.createInstance(ExplorerViewComponent, this, actionViewContent);
        this.explorerViewComponent.create();

        // outlineViewComponent...
        
        // searchViewComponent...

        // gitViewComponent...

        // settingViewComponent...

        return actionViewContent;
    }

    /**
     * @description switch to that action view given a specific name.
     */
    public actionViewChange(viewType: ActionType): void {
        if (viewType === this._currFocusView) {
            return;
        }
        
        this.actionViewTopTextOnChange(viewType);
        this.hideActionViewContent();
        
        if (viewType === ActionType.EXPLORER) {
            $('#explorer-container').show(0);
        } else if (viewType === ActionType.OUTLINE) {
            $('#outline-container').show(0);
        } else if (viewType === ActionType.SEARCH) {
            $('#search-container').show(0);
        } else if (viewType === ActionType.GIT) {
            $('#git-container').show(0);
        } else {
            throw 'error';
        }

        this._currFocusView = viewType;
        this._onActionViewChange.fire(viewType);
    }

    /**
     * @description display given text on the action view top.
     */
    public actionViewTopTextOnChange(name: ActionType): void {
        if (name === ActionType.EXPLORER) {
            $('#action-view-top-text').html('Notebook');
        } else if (name === ActionType.OUTLINE) {
            $('#action-view-top-text').html('Outline');
        } else if (name === ActionType.SEARCH) {
            $('#action-view-top-text').html('Search');
        } else if (name === ActionType.GIT) {
            $('#action-view-top-text').html('Git Control');
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
        $('#action-view').hide(100);
        $('#resize').hide(100);
    }
    
    /**
     * @description displays action view.
     */
    public openActionView(): void {
        $('#action-view').show(100);
        $('#resize').show(100);
    }

}
