import 'src/workbench/services/component/media.scss';
import { FastElement } from "src/base/browser/basic/fastElement";
import { DomUtility, EventType, Orientation, addDisposableListener } from "src/base/browser/basic/dom";
import { Emitter, Event, Register } from "src/base/common/event";
import { Dimension, IDimension } from "src/base/common/utilities/size";
import { Themable } from "src/workbench/services/theme/theme";
import { FocusTracker } from "src/base/browser/basic/focusTracker";
import { IThemeService } from "src/workbench/services/theme/themeService";
import { assert, check, panic } from "src/base/common/utilities/panic";
import { ISplitView, ISplitViewOpts, SplitView } from "src/base/browser/secondary/splitView/splitView";
import { ISashOpts } from "src/base/browser/basic/sash/sash";
import { IColorTheme } from "src/workbench/services/theme/colorTheme";
import { IFixedSplitViewItemOpts, IResizableSplitViewItemOpts, ISplitViewItemOpts } from "src/base/browser/secondary/splitView/splitViewItem";
import { ILogService } from 'src/base/common/logger';
import { isNonNullable } from 'src/base/common/utilities/type';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { IHostService } from 'src/platform/host/common/hostService';
import { IBrowserEnvironmentService } from 'src/platform/environment/common/environment';

export interface ICreatable {
    create(): void;
    registerListeners(): void;
}

/**
 * The option to configure how to assemble each children component. See more in
 * {@link Component.assembleComponents}.
 */
export type IAssembleComponentOpts = {
    
    /**
     * The child component to render.
     */
    readonly component: IComponent;

    /**
     * Defines the sash behavior that after this component.
     */
    readonly sashConfiguration?: Pick<ISashOpts, 'enable' | 'range' | 'size' | 'visible'>;
} & Pick<ISplitViewItemOpts, 'priority'> 
  & (IResizableSplitViewItemOpts | IFixedSplitViewItemOpts);

/**
 * An interface only for {@link Component}.
 */
export interface IComponent extends ICreatable {

    /**
     * @description Returns the string id of the component.
     */
    readonly id: string;

    /** 
     * Fires when the component is focused or blurred (true represents focused). 
     */
    readonly onDidFocusChange: Register<boolean>;

    /** 
     * Fires when the component visibility is changed. 
     */
    readonly onDidVisibilityChange: Register<boolean>;

    /** 
     * Fires the new dimension of the component when the component is re-layout(ing).
     */
    readonly onDidLayout: Register<IDimension>;

    /** 
     * The DOM element of the current component. 
     */
    readonly element: FastElement<HTMLElement>;

    /**
     * The current dimension of the component.
     */
    readonly dimension: Dimension | undefined;

    /**
     * @description Renders the component itself.
     * @param parentComponent If provided, the component will be registered 
     *                        under this component. If no parentComponent is 
     *                        provided, the component will be rendered under 
     *                        this parent component.
     * @note If both not provided, either renders under the constructor provided 
     *       HTMLElement, or `document.body`.
     * @panic
     */
    create(parentComponent?: IComponent): void;

    /**
     * @description Appends the component to the DOM. This method represents the 
     * first step in the 'create()' process and solely handles the insertion of 
     * the component into the DOM tree.
     * @param parentComponent If provided, the component will be registered 
     *                        under this component. If no parentComponent is 
     *                        provided, the component will be rendered under 
     *                        this parent component.
     * @param avoidRender If provided, this will force to avoid rendering the
     *                    component into the DOM tree. The client must handle
     *                    the rendering by themselves.
     * @note If both not provided, either renders under the constructor provided 
     *       HTMLElement, or `document.body`.
     * @note `createInDom()` and `createContent()` are useful when you wish to
     *       have extra operations between those two operations. Otherwise you
     *       may invoke `create()` for simplicity.
     * @panic
     */
    createInDom(parentComponent?: IComponent, avoidRender?: boolean): void;

    /**
     * @description Renders the content of the component. This method is the 
     * second step in the 'create()' process, following the insertion of the 
     * component into the DOM. 
     * @note It triggers the internal '__createContent' method to render the 
     *       component's actual contents.
     * @note `createInDom()` and `createContent()` are useful when you wish to
     *       have extra operations between those two operations. Otherwise you
     *       may invoke `create()` for simplicity.
     * @panic
     */
    createContent(): void;
    
    /**
     * @description Registers any listeners in the component.
     */
    registerListeners(): void;

    /**
     * @description Layout the component to the given dimension. This function
     * will modify {@link Component.prototype.dimension} attribute.
     * 
     * @param width The width of dimension.
     * @param height The height of dimension.
     * @param preventDefault If sets to `true`, the {@link onDidLayout} event 
     *                       will not be triggered. Default sets to `true`.
     * @param mockDimension If set, this dimension will be fired through the 
     *                      emitters instead of the actual one. This allows you
     *                      to do hacky thing.
     * @returns The new dimension of the component.
     * 
     * @note This function will only mutate the {@link dimension} and do not 
     *       actually change anything in DOM tree.
     * @note If no dimensions is provided, the component will try to be filled
     *       with the parent HTMLElement. If any dimensions is provided, the 
     *       component will layout the missing one either with the previous 
     *       value or just zero.
     * @note Will trigger {@link onDidLayout} event.
     */
    layout(width?: number, height?: number, preventDefault?: boolean, mockDimension?: IDimension): IDimension;

    /**
     * @description Register a child {@link IComponent} into the current Component.
     * @param override If sets to true, it will override the existed one which 
     *                 has the same component id. Defaults to false.
     * 
     * @panic Throws an error if the component has already been registered and
     *        override sets to false.
     * @deprecated
     */
    registerComponent(component: IComponent, override?: boolean): void;

    /**
     * @description Determines if the component with the given id has been 
     * registered in the current component.
     * @param id The id of the component.
     * 
     * @returns If the component founded.
     */
    hasComponent(id: string): boolean;

    /**
     * @description Returns the sub component by id.
     * @param id The string ID of the component.
     * @returns The required Component.
     * @panic If no such component exists, an error throws.
     */
    getComponent<T extends IComponent>(id: string): T | undefined;

    /**
     * @description Unregister the component with the given id.
     * @param id The id of the component.
     * @note The corresponding component will not be disposed automatically.
     * @deprecated
     */
    unregisterComponent(id: string): void;

    /**
     * @description Returns all the registered components that as the direct
     * children of the current component.
     * @deprecated
     */
    getDirectComponents(): [string, IComponent][];

    /**
     * @description Constructs and arranges child components within this 
     * component based on {@link SplitView}. Each child component configuration 
     * is defined in {@link IAssembleComponentOpts} which includes details like 
     * size constraints and sash behaviors.
     * 
     * @param orientation The orientation (horizontal or vertical) to arrange the 
     *                    child components.
     * @param options An array of options for configuring each child component.
     * 
     * @note This method initializes each child component in the DOM, configures 
     *       their placement using {@link SplitView}.
     * @panic If `assembleComponents` is invoked twice.
     */
    assembleComponents(orientation: Orientation, options: IAssembleComponentOpts[]): void;

    /**
     * @description Sets the visibility of the current component.
     * @param value to visible or invisible.
     */
    setVisible(value: boolean): void;

    /**
     * @description Sets if to focus the current component.
     * @param value To focus or blur.
     */
    setFocusable(value: boolean): void;

    /**
     * @description Checks if the component has created.
     */
    isCreated(): boolean;

    /**
     * @description Disposes the current component and all its children 
     * components.
     */
    dispose(): void;
}

/**
 * @class An abstract base class for UI components, providing structure and 
 * common functionality.
 * 
 * @note It encapsulates element creation, layout management, focus tracking, 
 * and component registration. Subclasses should implement the abstract methods:
 *      1. `__createContent()` for content creation and
 *      2. `__registerListeners()` for event listener registration.
 * 
 * @note The class also offers methods for component lifecycle management, 
 * visibility control, and layout adjustments.
 * 
 * @note A component is disposable, once it get disposed, all its children will
 * also be disposed. The component cannot be disposed / create() / 
 * registerListener() twice.
 */
export abstract class Component extends Themable implements IComponent {

    // [field]

    /**
     * Client-provided parent that the component should be rendered under.
     */
    private _customParent?: HTMLElement;

    private readonly _element: FastElement<HTMLElement>;
    private readonly _children: Map<string, IComponent>;
    private _dimension?: Dimension;

    private readonly _focusTracker: FocusTracker;

    private _isInDom: boolean;    // is rendered in DOM tree
    private _created: boolean;    // is `__createContent` invoked
    private _registered: boolean; // is `__registerListeners` invoked
    
    /** Relate to {@link assembleComponents()} */
    protected _splitView: ISplitView | undefined;

    protected readonly logService: ILogService;

    // [event]

    public readonly onDidFocusChange: Register<boolean>;

    private readonly _onDidVisibilityChange = this.__register(new Emitter<boolean>());
    public readonly onDidVisibilityChange = this._onDidVisibilityChange.registerListener;

    private readonly _onDidLayout = this.__register(new Emitter<IDimension>());
    public readonly onDidLayout = this._onDidLayout.registerListener;

    // [constructor]

    /**
     * @param id The id for the Component.
     * @param customParent If provided, customParent will replace the HTMLElement 
     *      from the provided parentComponent when creating. Otherwise 
     *      defaults to `document.body`.
     */
    constructor(
        id: string,
        customParent: HTMLElement | null,
        protected readonly instantiationService: IInstantiationService,
    ) {
        const themeService = instantiationService.getOrCreateService(IThemeService);
        super(themeService);
        this.logService = instantiationService.getOrCreateService(ILogService);
        
        this._isInDom    = false;
        this._created    = false;
        this._registered = false;
        this._children   = new Map();
        this._splitView  = undefined;

        this._element = this.__register(new FastElement(document.createElement('div')));
        this._element.addClassList('component-ui');
        this._element.setID(id);

        this._focusTracker = this.__register(new FocusTracker(this._element.raw, false));
        this.onDidFocusChange = this._focusTracker.onDidFocusChange;

        this._customParent = customParent ?? undefined;
        this.logService.trace(`${this.id}`, 'UI component constructed.');
    }

    // [getter]

    get id() { return this._element.getID(); }

    get element() { return this._element; }

    get dimension() { return this._dimension; }

    // [abstract method]

    /**
     * @description if needed, this function will be called inside the function
     * '_createContainer()' to create the actual content of the component.
     * 
     * subclasses should override this function.
     */
    protected abstract __createContent(): void;

    /**
     * @description to register listeners for the component and its content.
     * 
     * subclasses should override this function.
     */
    protected abstract __registerListeners(): void;

    // [protected override method]

    protected override __onThemeChange(newTheme: IColorTheme): void {
        if (this.isCreated()) {
            super.__onThemeChange(newTheme);
        }
    }

    protected override __updateStyles(): void { /** noop */ }

    // [public method]

    public create(parentComponent?: IComponent): void {
        this.createInDom(parentComponent);
        this.createContent();
    }

    public createInDom(parentComponent?: IComponent, avoidRender: boolean = false): void {
        check(this._isInDom     === false, 'Cannot "createInDom()" twice.');
        check(this.isCreated()  === false, 'Must be called before "createContent()"');
        check(this.isDisposed() === false, 'The component is already disposed.');
        
        if (parentComponent) {
            parentComponent.registerComponent(this);
        }

        // actual rendering
        if (avoidRender === false) {
            this._customParent = parentComponent?.element.raw ?? this._customParent ?? document.body;
            this._customParent.appendChild(this._element.raw);
            this._isInDom = true;
        }
        
        this.logService.trace(`${this.id}`, 'Component is rendered under the DOM tree.');
    }

    public createContent(): void {
        check(this.isCreated()  === false, 'Cannot "createContent()" twice.');
        check(this.isDisposed() === false, 'The component is already disposed.');

        this.logService.trace(`${this.id}`, 'Component is about to create content...');
        this.__createContent();
        
        this.logService.trace(`${this.id}`, 'Component content created successfully.');
        this._created = true;
    }

    public layout(width?: number, height?: number, preventDefault?: boolean, mockDimension?: IDimension): IDimension {
        
        // If no dimensions provided, we default to layout to fit to parent.
        if (width === undefined && height === undefined) {
            const actualParent = this._element.raw.parentElement;
            const parent = assert(actualParent, 'layout() expect to have a parent HTMLElement when there is no provided dimension.');
            check(DomUtility.Elements.ifInDomTree(parent), 'layout() expect the parent HTMLElement is rendered in the DOM tree.');
            this._dimension = DomUtility.Positions.getClientDimension(parent);
        }
        // If any dimensions is provided, we force to follow it.
        else {
            this._dimension = isNonNullable(this._dimension)
                ? this._dimension.clone(width, height)
                : new Dimension(width ?? 0, height ?? 0);
        }

        if (preventDefault !== true) {
            this._onDidLayout.fire(mockDimension ?? this._dimension);
        }
        
        return this._dimension;
    }

    public registerListeners(): void {
        check(this._registered  === false, 'Cannot invoke "registerListeners()" twice.');
        check(this._created      === true, 'Must be invoked after "createContent()".');
        check(this.isDisposed() === false, 'The component is already disposed.');

        this.logService.trace(`${this.id}`, 'Component is about to register listeners...');
        this.__registerListeners();

        // automatically re-layout
        {
            this.__register(addDisposableListener(window, EventType.resize, () => {
                this.layout();
            }));

            const hostService = this.instantiationService.getOrCreateService(IHostService);
            const environmentService = this.instantiationService.getOrCreateService(IBrowserEnvironmentService);
            const anyEvents = Event.any([
                hostService.onDidEnterFullScreenWindow,
                hostService.onDidLeaveFullScreenWindow,
                hostService.onDidMaximizeWindow,
                hostService.onDidUnMaximizeWindow,
            ]);
            this.__register(anyEvents(windowID => {
                if (windowID === environmentService.windowID) {
                    this.layout();
                }
            }));
        }
        

        this.logService.trace(`${this.id}`, 'Component register listeners succeeded.');
        this._registered = true;
    }

    public registerComponent(component: IComponent, override: boolean = false): void {
        const id = component.id;
        const registered = this._children.has(id);

        if (registered) {
            if (!override) {
                panic('component has been already registered');
            }
            const deprecated = this._children.get(id)!;
            deprecated.dispose();
        }

        this._children.set(id, component);
        this.__register(component);
    }

    public isCreated(): boolean {
        return this._isInDom && this._created && this._registered;
    }

    public setVisible(value: boolean): void {
        if (value === true) {
            this._element.setOpacity(1);
            this._element.setPointerEvents('auto');
        } else {
            this._element.setOpacity(0);
            this._element.setPointerEvents('none');
        }
        this._onDidVisibilityChange.fire(value);
    }

    public setFocusable(value: boolean): void {
        this._focusTracker.setFocusable(value);
    }

    public hasComponent(id: string): boolean {
        return this._children.has(id);
    }

    public getComponent<T extends IComponent>(id: string): T | undefined {
        const component = this._children.get(id);
        if (!component) {
            return undefined;
        }
        return <T>component;
    }

    public unregisterComponent(id: string): void {
        this._children.delete(id);
    }

    public getDirectComponents(): [string, IComponent][] {
        const result: [string, IComponent][] = [];
        for (const entry of this._children) {
            result.push(entry);
        }
        return result;
    }

    public assembleComponents(orientation: Orientation, options: IAssembleComponentOpts[]): void {
        check(!this._splitView, 'Cannot invoke "assembleComponents()" twice.');
        this.logService.trace(`${this.id}`, `Component assembling children components: [${options.map(each => each.component.id).join(', ')}]`);

        const splitViewOption: Required<ISplitViewOpts> = {
            orientation,
            viewOpts: [],
        };

        /**
         * Since {@link SplitView} manages its own rendering process, setting 
         * `avoidRender` to true prevents component self-rendering. The component 
         * will be automatically rendered under the {@link SplitViewItem}.
         */
        const avoidRender = true;
        for (const each of options) {
            each.component.createInDom(this, avoidRender);
            splitViewOption.viewOpts.push({
                ID: each.component.id,
                element: each.component.element.raw,
                ...each,
            });
        }
        
        /**
         * Construct the {@link SplitView}. The child component will be rendered 
         * into the DOM tree after the construction.
         */
        this._splitView = this.__register(new SplitView(this.element.raw, splitViewOption));
    
        /**
         * Construct child components recursively. The children's 
         * `this.__createContent` will be invoked recursively.
         */
        for (const { component } of options) {
            component.createContent();
            component.registerListeners();
        }

        // apply sash configuration if any (ignore the last configuration)
        for (let i = 0; i < this._splitView.count - 1; i++) {
            const option = options[i]!;

            const sashOpts = option.sashConfiguration;
            if (!sashOpts) {
                continue;
            }
            
            const sash = assert(this._splitView.getSashAt(i));
            sash.setOptions(sashOpts);
        }
    
        // re-layout
        this.__register(this.onDidLayout(newDimension => {
            /**
             * hack: Let the component may decide to not re-layout the 
             * {@link SplitView} by providing -1 value.
             */
            if (newDimension.width !== -1 && newDimension.height !== -1) {
                this._splitView?.layout(newDimension.width, newDimension.height);
            }
        }));

        this.logService.trace(`${this.id}`, 'Component assembling components succeeded.');
    }

    public override dispose(): void {
        super.dispose();
        for (const [id, child] of this._children) {
            child.dispose();
        }
        this._splitView?.dispose();
    }
}