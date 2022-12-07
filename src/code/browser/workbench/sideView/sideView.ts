import { Component, IComponent } from 'src/code/browser/service/component/component';
import { Emitter, Register, RelayEmitter } from 'src/base/common/event';
import { createService } from 'src/code/platform/instantiation/common/decorator';
import { IComponentService } from 'src/code/browser/service/component/componentService';
import { IInstantiationService } from 'src/code/platform/instantiation/common/instantiation';
import { IThemeService } from 'src/code/browser/service/theme/themeService';
import { Constructor, Mutable } from 'src/base/common/util/type';
import { ILogService } from 'src/base/common/logger';
import { SideViewTitlePart } from 'src/code/browser/workbench/sideView/sideViewTitle';

export const ISideViewService = createService<ISideViewService>('side-view-service');

export interface ISideViewChangeEvent {

    /**
     * The current id of the view that is displaying.
     */
    readonly id?: string;

    /**
     * The current displaying view.
     */
    readonly view?: ISideView;
}

/**
 * An interface only for {@link SideViewService}.
 */
export interface ISideViewService extends IComponent {

    /** 
     * Events fired when the current side view has changed. 
     */
    readonly onDidViewChange: Register<ISideViewChangeEvent>;

    /**
     * @description Register a view with the corresponding ID. The view will not
     * be created immediately.
     * @param id The id of the view for future look up.
     * @param viewCtor The side view.
     */
    registerView(id: string, viewCtor: Constructor<ISideView>): void;

    /**
     * @description Unregisters a view if ever registered.
     * @param id The id of the view.
     * @returns A boolean returned if the operation is successed.
     */
    unregisterView(id: string): boolean;

    /**
     * @description Switch to the view by the provided id.
     * @param id The id of the view.
     */
    switchView(id: string): void;

    /**
     * @description Closes the current view.
     */
    closeView(): void;

    /**
     * @description Returns the registered view by the given ID.
     * @param id The id of the view.
     */
    getView<T extends ISideView>(id: string): T | undefined;

    /**
     * @description Returns the current displaying side view. Undefined is
     * returned if no views are displaying.
     */
    currView<T extends ISideView>(): T | undefined;
}

/**
 * @class The service manages and displays different {@link ISideView}. It is
 * also a {@link Component}.
 */
export class SideViewService extends Component implements ISideViewService {

    // [field]

    /** The id of the current displaying view. */
    private _currView?: string;

    /** The container that only contains the {@link ISideView}. */
    private _viewContainer?: HTMLElement;

    private readonly _viewCtors: Map<string, Constructor<ISideView>>;

    // [event]

    private readonly _onDidViewChange = this.__register( new Emitter<ISideViewChangeEvent>() );
    public readonly onDidViewChange = this._onDidViewChange.registerListener;
    
    // [constructor]

    constructor(
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService private readonly logService: ILogService,
    ) {
        super('side-view', null, themeService, componentService);
        this._viewCtors = new Map();
    }

    // [public method]

    public registerView(id: string, viewCtor: Constructor<ISideView>): void {
        this.logService.trace(`sideViewService#registers a view with id ${id}`);

        if (this.hasComponent(id)) {
            this.logService.warn(`The side view with id ${id} is already registered.`);
            return;
        }

        this._viewCtors.set(id, viewCtor);
    }

    public unregisterView(id: string): boolean {
        
        /**
         * If the view is never constructed, we simply delete the registered 
         * constructor.
         */
        const ctor = this._viewCtors.get(id);
        if (ctor) {
            this._viewCtors.delete(id);
            return true;
        }

        /**
         * If the corresponding view does not exist, returns false indicates
         * the operation fails.
         */
        const view = this.getComponent<ISideView>(id);
        if (!view) {
            return false;
        }

        /**
         * If the view is created and also displaying currently, switch to any
         * other avaliable views if any, then destroy the view.
         */
        if (id === this._currView) {
            const avaliableID = this.__getAnyAvaliableView();
            if (avaliableID) {
                this.switchView(avaliableID);
            } else {
                this.closeView();
            }
        }

        this.__destroyView(id);
        return true;
    }

    public switchView(id: string): void {
        const view = this.__getOrConstructView(id);
        if (!view) {
            return;
        }
        this.__switchView(view);
    }

    public closeView(): void {
        if (this._currView) {
            this.__unloadView(this._currView);
        }
        this._onDidViewChange.fire({ id: undefined, view: undefined });
    }
 
    public getView<T extends ISideView>(id: string): T | undefined {
        const view = this.getComponent<T>(id);
        if (view) {
            return view;
        }

        const ctor = this._viewCtors.get(id);
        if (!ctor) {
            return undefined;
        }

        const newView = this.__getOrConstructView<T>(id);
        return newView;
    }
 
    public currView<T extends ISideView>(): T | undefined {
        if (this._currView) {
            return this.getComponent<T>(this._currView);
        }
        return undefined;
    }

    // [protected override methods]

    protected override _createContent(): void {

        // empty side view at the beginning
        this._viewContainer = document.createElement('div');
        this._viewContainer.className = 'side-view-container';
        this.element.appendChild(this._viewContainer);
    }

    protected _registerListeners(): void {}

    // [private helper methods]

    private __getOrConstructView<T extends ISideView>(id: string): T | undefined {
        const view = this.getComponent<T>(id);
        if (view) {
            return view;
        }
        
        const viewOrCtor = this._viewCtors.get(id);
        if (!viewOrCtor) {
            return undefined;
        }

        const newView = this.instantiationService.createInstance(viewOrCtor, this._viewContainer);
        this._viewCtors.delete(id);

        newView.create();
        newView.registerListeners();
        this.registerComponent(newView);
        
        return newView as T;
    }

    private __switchView(view: ISideView): void {
        if (!this._viewContainer) {
            return;
        }

        // if any view is displaying, unload it first.
        if (this._currView) {
            this.__unloadView(this._currView);
        }

        // load the new view
        this._viewContainer.appendChild(view.element.element);
        this._currView = view.id;
        
        this._onDidViewChange.fire({ id: view.id, view: view });
    }

    private __unloadView(id: string): void {
        if (!this._viewContainer) {
            return;
        }
        
        const currView = this.getComponent<ISideView>(id)!;
        this._viewContainer.removeChild(currView.element.element);
        this._currView = undefined;
    }

    private __destroyView(id: string): void {
        const view = this.getComponent<ISideView>(id);
        if (view) {
            this.unregisterComponent(id);
            view.dispose();
        }
    }

    private __getAnyAvaliableView(): string | undefined {
        const children = this.getDirectComponents();
        if (children.length === 0) {
            return undefined;
        }
        return children[0]![0];
    }
}

/**
 * An interface only for {@link SideView}.
 */
export interface ISideView extends IComponent {

    /**
     * The ID of the view.
     */
    readonly id: string;
}

/**
 * @class The base class to be inherited from to be inserted into 
 * {@link SideViewService}.
 */
export abstract class SideView extends Component implements ISideView {

    // [field]

    public static readonly WIDTH = 300;

    // TODO: try to use a splitView. So that we can use a sash instead of manually set the border.
    protected readonly _titlePart!: SideViewTitlePart;

    // [protected override methods]

    protected __createTitlePart(): SideViewTitlePart {
        return new SideViewTitlePart();
    };

    protected _createContent(): void {
        (<Mutable<SideViewTitlePart>>this._titlePart) = this.__createTitlePart();
    }

    protected _registerListeners(): void {}

    // [private methods]
}