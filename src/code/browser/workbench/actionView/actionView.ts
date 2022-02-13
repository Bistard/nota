import { Component, ComponentType, IComponent } from 'src/code/browser/workbench/component';
import { ExplorerViewComponent } from "src/code/browser/workbench/actionView/explorer/explorer";
import { Emitter, Register } from 'src/base/common/event';
import { createDecorator } from 'src/code/common/service/instantiationService/decorator';
import { IComponentService } from 'src/code/browser/service/componentService';
import { IInstantiationService } from 'src/code/common/service/instantiationService/instantiation';
import { ActionType } from 'src/code/browser/workbench/actionBar/actionBar';
import { Disposable } from 'src/base/common/dispose';
import { getBuiltInIconClass } from 'src/base/browser/icon/iconRegistry';
import { Icons } from 'src/base/browser/icon/icons';
import { Ii18nService } from 'src/code/platform/i18n/i18n';
import { Section } from 'src/code/platform/i18n/section';
import { registerSingleton } from 'src/code/common/service/instantiationService/serviceCollection';
import { ServiceDescriptor } from 'src/code/common/service/instantiationService/descriptor';

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
 * @class ActionViewComponent displays different action view such as 
 * explorerView, outlineView, gitView and so on.
 */
export class ActionViewComponent extends Component implements IActionViewService {

    /* Static Property */

    public static readonly width: number = 300;

    /* Ends */

    private _currFocusView: ActionType;
    
    private actionViewContentContainer!: HTMLElement;
    
    private actionViewTitlePart: ActionViewTitlePart | undefined;

    private explorerViewComponent!: ExplorerViewComponent;

    /* Events fired when the action view is switched to others */
    private readonly _onActionViewChange = this.__register( new Emitter<ActionType>() );
    public readonly onActionViewChange = this._onActionViewChange.registerListener;
    
    constructor(parentComponent: Component,
                @Ii18nService private readonly i18nService: Ii18nService,
                @IInstantiationService private readonly instantiationService: IInstantiationService,
                @IComponentService componentService: IComponentService,
    ) {
        super(ComponentType.ActionView, parentComponent, null, componentService);
        
        this._currFocusView = ActionType.NONE;
    }

    protected override _createContent(): void {
        
        // wrapper
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'action-view-container';
        
        // action-view content
        this.actionViewContentContainer = document.createElement('div');
        this.actionViewContentContainer.id = 'action-content-container';

        // action-view-title part
        this.actionViewTitlePart = this.__register(new ExplorerTitlePart(this.i18nService));
        this.actionViewTitlePart.render(this.actionViewContentContainer);
        
        // action-view-content part
        // TODO
        this._createActionViewContent(this.actionViewContentContainer);

        
        // render them
        this.contentArea.appendChild(this.actionViewContentContainer);
        this.container.appendChild(this.contentArea);
    }

    protected override _registerListeners(): void {

        this.explorerViewComponent.registerListeners();
        
    }

    private _createActionViewContent(container: HTMLElement): void {
        const actionViewContent = document.createElement('div');
        actionViewContent.id = 'action-view-content';
        
        this.explorerViewComponent = this.instantiationService.createInstance(ExplorerViewComponent, this, actionViewContent);
        this.explorerViewComponent.create();

        // outlineViewComponent...
        
        // searchViewComponent...

        // gitViewComponent...

        container.appendChild(actionViewContent);
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
        this.actionViewTitlePart!.hide(true);
        // if (name === ActionType.EXPLORER) {
        //     $('.title-text').html('Notebook');
        // } else if (name === ActionType.OUTLINE) {
        //     $('.title-text').html('Outline');
        // } else if (name === ActionType.SEARCH) {
        //     $('.title-text').html('Search');
        // } else if (name === ActionType.GIT) {
        //     $('.title-text').html('Git Control');
        // }
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

/**
 * @class The base class for top view part in the action view.
 */
export class ActionViewTitlePart extends Disposable {

    protected _element: HTMLElement;

    constructor() {
        super();

        this._element = document.createElement('div');
        this._element.className = 'action-view-title';
    }
    
    /**
     * @description Renders the title part into the provided container.
     * @param container The HTMLElement to be inserted below.
     */
    public render(container: HTMLElement): void {
        if (this._element === undefined) {
            return;
        }
        
        container.appendChild(this._element);
    }
    
    public hide(value: boolean): void {
        if (this._element) {
            if (value) {
                this._element.classList.add('disabled');
                this._element.setAttribute('disabled', String(true));
            } else {
                this._element.classList.remove('disabled');
                this._element.setAttribute('disabled', String(false));
                this._element.tabIndex = 0;
            }
        }
    }

    public hidden(): boolean {
        return this._element?.classList.contains('disabled') === false;
    }
}

export class ExplorerTitlePart extends ActionViewTitlePart {

    constructor(
        private readonly i18nService: Ii18nService,
    ) {
        super();
    }

    public override render(container: HTMLElement): void {
        super.render(container);
        
        if (this._element === undefined) {
            return;
        }
        
        // wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'action-view-title-container';

        // dropdown icon
        const dropdownIcon = document.createElement('i');
        dropdownIcon.classList.add('icon');
        dropdownIcon.classList.add(getBuiltInIconClass(Icons.AddressBook));
        this._element.appendChild(dropdownIcon);

        // title text
        const topText = document.createElement('div');
        topText.className = 'title-text';
        topText.innerHTML = this.i18nService.trans(Section.Explorer, 'notebook');

        wrapper.append(dropdownIcon);
        wrapper.append(topText);
        this._element.appendChild(wrapper);
    }

}

registerSingleton(IActionViewService, new ServiceDescriptor(ActionViewComponent));