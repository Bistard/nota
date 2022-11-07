import { Component, ComponentType, IComponent } from 'src/code/browser/service/component/component';
import { ExplorerViewComponent } from "src/code/browser/workbench/sideView/explorer/explorer";
import { Emitter, Register } from 'src/base/common/event';
import { createService } from 'src/code/platform/instantiation/common/decorator';
import { IComponentService } from 'src/code/browser/service/component/componentService';
import { IInstantiationService } from 'src/code/platform/instantiation/common/instantiation';
import { SideType } from 'src/code/browser/workbench/sideBar/sideBar';
import { Disposable } from 'src/base/common/dispose';
import { getIconClass } from 'src/base/browser/icon/iconRegistry';
import { Icons } from 'src/base/browser/icon/icons';
import { Ii18nService } from 'src/code/platform/i18n/i18n';
import { Section } from 'src/code/platform/section';
import { IThemeService } from 'src/code/browser/service/theme/themeService';

export const ISideViewService = createService<ISideViewService>('side-view-service');

export interface ISideViewChangeEvent {

    /**
     * The type of view is displaying.
     */
     type: SideType;

     /**
      * The previous type of view was displaying.
      */
     prevType: SideType;

}

/**
 * Representing components which only belongs to {@link SideViewComponent}.
 */
export interface ISideViewComponent extends IComponent {
    // empty
}

/**
 * An interface only for {@link SideViewComponent}.
 */
export interface ISideViewService extends IComponent {

    /** 
     * Events fired when the current side view has changed.
     */
    onDidViewChange: Register<ISideViewChangeEvent>;

    /**
     * @description Switch to the side view by the provided type.
     */
    setView(viewType: SideType): void;
}

/**
 * @class SideViewComponent displays different side view such as 
 * explorerView, outlineView, gitView and so on.
 */
export class SideViewComponent extends Component implements ISideViewService {

    // [field]

    public static readonly WIDTH: number = 300;

    private _contentContainer!: HTMLElement;

    private _currentViewType: SideType;

    private readonly _components: Map<string, ISideViewComponent>;

    private sideViewTitlePart!: SideViewTitlePart;

    // [event]

    private readonly _onDidViewChange = this.__register( new Emitter<ISideViewChangeEvent>() );
    public readonly onDidViewChange = this._onDidViewChange.registerListener;
    
    // [constructor]

    constructor(
        @Ii18nService private readonly i18nService: Ii18nService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
    ) {
        super(ComponentType.SideView, null, themeService, componentService);
        this._currentViewType = SideType.NONE;
        this._components = new Map();
    }

    // [public method]

    public setView(viewType: SideType): void {
        this.__switchToView(viewType);
    }

    // [protected override methods]

    protected override _createContent(): void {
        
        // wrapper
        const container = document.createElement('div');
        container.id = 'side-view-container';
        
        // side-view content
        this._contentContainer = document.createElement('div');
        this._contentContainer.id = 'side-view-content-container';

        // side-view-title
        this.sideViewTitlePart = this.__register(new ExplorerViewTitlePart(this.i18nService)); // TODO
        this.sideViewTitlePart.render(this._contentContainer);

        // default to explorer-view
        this.__switchToView(SideType.EXPLORER);
        
        // render them
        container.appendChild(this._contentContainer);
        this.element.appendChild(container);
    }

    protected override _registerListeners(): void {
        for (const component of this._components.values()) {
            component.registerListeners();
        }
    }

    // [private helper methods]

    /**
     * @description A helper method to switch to the {@link ISideViewComponent}
     * by the provided {@link SideType}.
     * @param viewType The {@link SideType} determines which view to display.
     */
    private __switchToView(viewType: SideType): void {
        if (viewType === this._currentViewType) {
            return;
        }

        let previousView: SideType = this._currentViewType;
        
        this.__switchOrCreateView(this._contentContainer, viewType);

        this._currentViewType = viewType;

        // fires event
        this._onDidViewChange.fire({
            type: viewType,
            prevType: previousView
        });
    }

    /**
     * @description Switches to the corresponding {@link ISideViewComponent}
     * by the provided view type.
     * @param container The HTML container where the new created view to be inserted.
     * @param viewType The {@link SideType} type to determine which view to display.
     * 
     * @note `switching` means removing the old DOM element and inserting the new one.
     * @note If the {@link ISideViewComponent} never created before, we will create one.
     */
    private __switchOrCreateView(container: HTMLElement, viewType: SideType): void {
        
        let prevView = this._components.get(this._currentViewType);
        let view = this._components.get(viewType);
        let justCreated = false;

        // if we are switching to a view that is not in memory
        if (view === undefined) {
            
            switch (viewType) {
                case SideType.EXPLORER:
                    view = this.instantiationService.createInstance(ExplorerViewComponent, container) as ISideViewComponent;
                    this._components.set(viewType, view);
                    break;
    
                case SideType.OUTLINE:
                    // TODO
                    break;
    
                case SideType.SEARCH:
                    // TODO
                    break;
                    
                case SideType.GIT:
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
 * @class The base class for top view part in the side view.
 */
export class SideViewTitlePart extends Disposable {

    protected _element: HTMLElement;

    constructor() {
        super();

        this._element = document.createElement('div');
        this._element.className = 'side-view-title';
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

export class ExplorerViewTitlePart extends SideViewTitlePart {

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
        wrapper.className = 'side-view-title-container';

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