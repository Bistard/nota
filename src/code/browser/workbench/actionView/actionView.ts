import { getSvgPathByName, SvgType } from 'src/base/common/string';
import { Component, ComponentType, IComponent } from 'src/code/browser/workbench/component';
import { ExplorerViewComponent } from "src/code/browser/workbench/actionView/explorer/explorer";
import { EVENT_EMITTER } from 'src/base/common/event';
import { createDecorator } from 'src/code/common/service/instantiationService/decorator';
import { IComponentService } from 'src/code/browser/service/componentService';
import { IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { IInstantiationService } from 'src/code/common/service/instantiationService/instantiation';

export type ActionViewType = 'none' | 'explorer' | 'outline' | 'search' | 'git';

export enum ActionViewComponentType {
    ExplorerView = 'explorer-container',
    OutlineView = 'outline-container',
    SearchView = 'search-container',
    GitView = 'git-container',
}

export const IActionViewService = createDecorator<IActionViewService>('action-view-service');

export interface IActionViewService extends IComponent {

    whichActionView: ActionViewType;

    onActionViewChange(actionViewName: ActionViewType): void;
    actionViewTopTextOnChange(name: string): void;
    hideActionViewContent(): void;
    closeActionView(): void;
    openActionView(): void;
}

/**
 * @description ActionViewComponent displays different action view such as 
 * explorerView, outlineView, gitView and so on.
 */
export class ActionViewComponent extends Component implements IActionViewService {

    public whichActionView: ActionViewType;
    
    private actionViewContentContainer!: HTMLElement;
    private resize!: HTMLElement;
    private actionViewTop!: HTMLElement;
    private actionViewContent!: HTMLElement;

    private explorerViewComponent!: ExplorerViewComponent;
    
    // Others...

    constructor(parentComponent: Component,
                // @INoteBookManagerService private readonly noteBookManagerService: INoteBookManagerService,
                @IInstantiationService private readonly instantiationService: IInstantiationService,
                @IComponentService componentService: IComponentService,
                @IContextMenuService private readonly contextMenuService: IContextMenuService,
    ) {
        super(ComponentType.ActionView, parentComponent, null, componentService);
        
        this.whichActionView = 'none';
    }

    protected override _createContent(): void {
        
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'action-view-container';
        
        this.actionViewContentContainer = document.createElement('div');
        this.actionViewContentContainer.id = 'action-content-container';

        this.resize = document.createElement('div');
        this.resize.id = 'resize';
        this.resize.classList.add('resizeBtn-style', 'vertical-center');

        this.actionViewTop = this._createActionViewTop();
        this.actionViewContent = this._createActionViewContent();

        this.actionViewContentContainer.appendChild(this.actionViewTop);
        this.actionViewContentContainer.appendChild(this.actionViewContent);
        
        this.contentArea.appendChild(this.actionViewContentContainer);
        this.contentArea.appendChild(this.resize);
        
        this.container.appendChild(this.contentArea);

    }

    protected override _registerListeners(): void {

        this.explorerViewComponent.registerListeners();

        EVENT_EMITTER.register('EOnActionViewChange', (name) => this.onActionViewChange(name));
        EVENT_EMITTER.register('EOnActionViewOpen', () => this.openActionView());
        EVENT_EMITTER.register('EOnActionViewClose', () => this.closeActionView());

    }

    private _createActionViewTop(): HTMLElement {
        const actionViewTop = document.createElement('div');
        actionViewTop.id = 'action-view-top';

        const topText = document.createElement('div');
        topText.id = 'action-view-top-text';
        topText.innerHTML = 'Explorer';
        topText.classList.add('pureText', 'captialize');

        const topIcon = document.createElement('img');
        topIcon.id = 'action-view-top-icon';
        topIcon.src = getSvgPathByName(SvgType.base, 'three-dots');
        topIcon.classList.add('vertical-center', 'filter-black');

        actionViewTop.appendChild(topText);
        actionViewTop.appendChild(topIcon);
        return actionViewTop;
    }

    // TODO: only render the view (DOM elements) when it is actually in is visible to user
    private _createActionViewContent(): HTMLElement {
        const actionViewContent = document.createElement('div');
        actionViewContent.id = 'action-view-content';
        
        // this.explorerViewComponent = new ExplorerViewComponent(this, actionViewContent, this._noteBookManager, this.componentService, this.contextMenuService);
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
    public onActionViewChange(actionViewName: ActionViewType): void {
        if (actionViewName === this.whichActionView) {
            return;
        }
        
        this.actionViewTopTextOnChange(actionViewName);
        this.hideActionViewContent();
        
        if (actionViewName === 'explorer') {
            $('#explorer-container').show(0);
        } else if (actionViewName === 'outline') {
            $('#outline-container').show(0);
        } else if (actionViewName === 'search') {
            $('#search-container').show(0);
        } else if (actionViewName === 'git') {
            $('#git-container').show(0);
        } else {
            throw 'error';
        }

        this.whichActionView = actionViewName;
    }

    /**
     * @description display given text on the action view top.
     */
    public actionViewTopTextOnChange(name: string): void {
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
