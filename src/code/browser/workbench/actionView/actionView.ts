import { Component, ComponentType, IComponent } from 'src/code/browser/workbench/component';
import { ExplorerViewComponent } from "src/code/browser/workbench/actionView/explorer/explorer";
import { Emitter, Register } from 'src/base/common/event';
import { createDecorator } from 'src/code/platform/instantiation/common/decorator';
import { IComponentService } from 'src/code/browser/service/componentService';
import { IInstantiationService } from 'src/code/platform/instantiation/common/instantiation';
import { ActionType } from 'src/code/browser/workbench/actionBar/actionBar';
import { Disposable } from 'src/base/common/dispose';
import { getIconClass } from 'src/base/browser/icon/iconRegistry';
import { Icons } from 'src/base/browser/icon/icons';
import { Ii18nService } from 'src/code/platform/i18n/i18n';
import { Section } from 'src/code/platform/section';
import { registerSingleton } from 'src/code/platform/instantiation/common/serviceCollection';
import { ServiceDescriptor } from 'src/code/platform/instantiation/common/descriptor';
import { IThemeService } from 'src/code/browser/service/theme/themeService';

export const IActionViewService = createDecorator<IActionViewService>('action-view-service');

export interface IActionViewChangeEvent {

    /**
     * The type of view is displaying.
     */
     type: ActionType;

     /**
      * The previous type of view was displaying.
      */
     prevType: ActionType;

}

/**
 * Representing components which only belongs to {@link ActionViewComponent}.
 */
export interface IActionViewComponent extends IComponent {
    // empty
}

/**
 * An interface only for {@link ActionViewComponent}.
 */
export interface IActionViewService extends IComponent {

    /** 
     * Events fired when the current action view has changed.
     */
    onDidActionViewChange: Register<IActionViewChangeEvent>;

    /**
     * @description Switch to the action view by the provided type.
     */
    setActionView(viewType: ActionType): void;
}

/**
 * @class ActionViewComponent displays different action view such as 
 * explorerView, outlineView, gitView and so on.
 */
export class ActionViewComponent extends Component implements IActionViewService {

    // [field]

    public static readonly width: number = 300;

    private actionViewContentContainer!: HTMLElement;

    private _currentViewType: ActionType;
    private _defaultViewType: ActionType;

    private _components: Map<string, IActionViewComponent>;

    private actionViewTitlePart!: ActionViewTitlePart;

    // [event]

    private readonly _onActionViewChange = this.__register( new Emitter<IActionViewChangeEvent>() );
    public readonly onDidActionViewChange = this._onActionViewChange.registerListener;
    
    // [constructor]

    constructor(defaultView: ActionType, // REVIEW: should not be in ctor
                @Ii18nService private readonly i18nService: Ii18nService,
                @IInstantiationService private readonly instantiationService: IInstantiationService,
                @IComponentService componentService: IComponentService,
                @IThemeService themeService: IThemeService,
    ) {
        super(ComponentType.ActionView, null, themeService, componentService);
        
        this._defaultViewType = defaultView;
        this._currentViewType = ActionType.NONE; // TODO: read from config
        this._components = new Map();
    }

    // [public method]

    public setActionView(viewType: ActionType): void {
        this.__switchToActionView(viewType);
    }

    // [protected override methods]

    protected override _createContent(): void {
        
        // wrapper
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'action-view-container';
        
        // action-view content
        this.actionViewContentContainer = document.createElement('div');
        this.actionViewContentContainer.id = 'action-content-container';

        // action-view-title
        this.actionViewTitlePart = this.__register(new ExplorerTitlePart(this.i18nService)); // TODO
        this.actionViewTitlePart.render(this.actionViewContentContainer);

        this.__switchToActionView(this._defaultViewType);
        
        // render them
        this.contentArea.appendChild(this.actionViewContentContainer);
        this.element.appendChild(this.contentArea);
    }

    protected override _registerListeners(): void {

        for (const component of this._components.values()) {
            component.registerListeners();
        }
        
    }

    // [private helper methods]

    /**
     * @description A helper method to switch to the {@link IActionViewComponent}
     * by the provided {@link ActionType}.
     * @param viewType The {@link ActionType} determines which view to display.
     */
    private __switchToActionView(viewType: ActionType): void {
        if (viewType === this._currentViewType) {
            return;
        }

        let previousView: ActionType = this._currentViewType;
        
        this.__switchOrCreateActionView(this.actionViewContentContainer, viewType);

        this._currentViewType = viewType;

        // fires event
        this._onActionViewChange.fire({
            type: viewType,
            prevType: previousView
        });
    }

    /**
     * @description Switches to the corresponding {@link IActionViewComponent}
     * by the provided view type.
     * @param container The HTML container where the new created view to be inserted.
     * @param viewType The {@link ActionType} type to determine which view to display.
     * 
     * @note `switching` means removing the old DOM element and inserting the new one.
     * @note If the {@link IActionViewComponent} never created before, we will create one.
     */
    private __switchOrCreateActionView(container: HTMLElement, viewType: ActionType): void {
        
        let prevView = this._components.get(this._currentViewType);
        let view = this._components.get(viewType);
        let justCreated = false;

        // if we are switching to a view that is not in memory
        if (view === undefined) {
            
            switch (viewType) {
                case ActionType.EXPLORER:
                    view = this.instantiationService.createInstance(ExplorerViewComponent, container) as IActionViewComponent;
                    this._components.set(viewType, view);
                    break;
    
                case ActionType.OUTLINE:
                    // TODO
                    break;
    
                case ActionType.SEARCH:
                    // TODO
                    break;
                    
                case ActionType.GIT:
                    // TODO
                    break;
            }
            justCreated = true;
        }

        if (justCreated && view) {
            view.create(this);
        }

        if (prevView) {
            // prevView.setVisible(false);
            container.removeChild(prevView.element.element);
        }
        
        if (view) {
            container.appendChild(view.element.element);
            // view.setVisible(true);
        }
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
        dropdownIcon.classList.add(...getIconClass(Icons.AddressBook));
        this._element.appendChild(dropdownIcon);

        // title text
        const topText = document.createElement('div');
        topText.className = 'title-text';
        topText.textContent = this.i18nService.trans(Section.Explorer, 'notebook');

        wrapper.append(dropdownIcon);
        wrapper.append(topText);
        this._element.appendChild(wrapper);
    }

}

registerSingleton(IActionViewService, new ServiceDescriptor(ActionViewComponent));