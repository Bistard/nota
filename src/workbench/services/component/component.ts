import 'src/workbench/services/component/media.scss';
import { FastElement } from "src/base/browser/basic/fastElement";
import { Orientation } from "src/base/browser/basic/dom";
import { Emitter, Register } from "src/base/common/event";
import { FocusTracker } from "src/base/browser/basic/focusTracker";
import { assert, check } from "src/base/common/utilities/panic";
import { ISplitView, ISplitViewOpts, SplitView } from "src/base/browser/secondary/splitView/splitView";
import { ISashOpts } from "src/base/browser/basic/sash/sash";
import { IFixedSplitViewItemOpts, IResizableSplitViewItemOpts, ISplitViewItemOpts } from "src/base/browser/secondary/splitView/splitViewItem";
import { ILogService } from 'src/base/common/logger';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { ILayoutable, Layoutable } from 'src/workbench/services/component/layoutable';
import { nullable } from 'src/base/common/utilities/type';

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
export interface IComponent extends ICreatable, ILayoutable {

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
     * The DOM element of the current component. 
     */
    readonly element: FastElement<HTMLElement>;

    /**
     * The parent of this component. This does not necessarily indicates the
     * true parent HTMLElement.
     */
    readonly parent: Component | undefined;

    /**
     * @description Renders the component itself.
     * @param parent If provided, the component will be registered under this 
     *               component. If no parent is provided, the component will be 
     *               rendered under this parent component.
     * @note If both not provided, either renders under the constructor provided 
     *       HTMLElement, or `document.body`.
     * @panic
     */
    create(parent?: Component): void;

    /**
     * @description Appends the component to the DOM. This method represents the 
     * first step in the 'create()' process and solely handles the insertion of 
     * the component into the DOM tree.
     * @param parent If provided, the component will be registered under this 
     *               component. If no parent is provided, the component will be 
     *               rendered under this parent component.
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
    createInDom(parent?: Component, avoidRender?: boolean): void;

    /**
     * @description Reverse operation of {@link createInDom()}.
     */
    detachFromDom(): void;

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
     * @description Returns the sub component by id.
     * @param id The string ID of the component.
     * @returns The required Component.
     * @panic If no such component exists, an error throws.
     */
    getChild<T extends IComponent>(id: string): T | undefined;

    /**
     * @description Returns all the registered components that as the direct
     * children of the current component.
     */
    getChildren(): [string, IComponent][];

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
export abstract class Component extends Layoutable implements IComponent {

    // [field]

    /**
     * Client-provided parent that the component should be rendered under.
     */
    private _parentContainer: HTMLElement | undefined;
    private _parent?: Component;

    private readonly _element: FastElement<HTMLElement>;
    private readonly _children: Map<string, IComponent>;

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
        instantiationService: IInstantiationService,
    ) {
        super(instantiationService);
        this.logService = instantiationService.getOrCreateService(ILogService);
        
        this._isInDom    = false;
        this._created    = false;
        this._registered = false;
        this._children   = new Map();
        this._splitView  = undefined;
        this._parentContainer = customParent ?? undefined;

        this._element = this.__register(new FastElement(document.createElement('div')));
        this._element.addClassList('component-ui');
        this._element.setID(id);

        this._focusTracker = this.__register(new FocusTracker(this._element.raw, false));
        this.onDidFocusChange = this._focusTracker.onDidFocusChange;

        this.logService.trace(`${this.id}`, 'UI component constructed.');
    }

    // [getter]

    get id() { return this._element.getID(); }
    get element() { return this._element; }
    get parent() { return this._parent; }

    public override getLayoutElement(): HTMLElement | nullable {
        return this._element.raw;
    }

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

    // [public method]

    public create(parent?: Component): void {
        this.createInDom(parent);
        this.createContent();
    }

    public detachFromDom(): void {
        if (!this.isCreated()) {
            return;
        }

        // remove from the DOM
        this.element.remove();
        this._isInDom = false;

        // remove linking from the parent if needed
        if (this.parent) {
            this.parent._children.delete(this.id);
        }
    }

    public createInDom(parent?: Component, avoidRender: boolean = false): void {
        check(this._isInDom === false, 'Cannot "createInDom()" twice.');
        
        if (parent) {
            this._parent = parent;
            parent._children.set(this.id, this);
        }

        // actual rendering
        if (avoidRender === false) {
            const actualParent = this._parentContainer ?? parent?.element.raw ?? document.body;
            actualParent.appendChild(this._element.raw);
            this._isInDom = true;
        }
        
        this.logService.trace(`${this.id}`, 'Component is rendered under the DOM tree.');
    }

    public createContent(): void {
        check(this.isCreated() === false, 'Cannot "createContent()" twice.');
        this.logService.trace(`${this.id}`, 'Component is about to create content...');

        this.__createContent();
        
        this.logService.trace(`${this.id}`, 'Component content created successfully.');
        this._created = true;
    }

    public registerListeners(): void {
        check(this._registered === false, 'Cannot invoke "registerListeners()" twice.');
        check(this._created    === true, 'Must be invoked when the component is created.');
        this.logService.trace(`${this.id}`, 'Component is about to register listeners...');

        this.__registerListeners();
        this.registerAutoLayout();

        this.logService.trace(`${this.id}`, 'Component register listeners succeeded.');
        this._registered = true;
    }

    public isCreated(): boolean {
        return this._created && !this.isDisposed();
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

    public getChild<T extends IComponent>(id: string): T | undefined {
        const component = this._children.get(id);
        if (!component) {
            return undefined;
        }
        return <T>component;
    }

    public getChildren(): [string, IComponent][] {
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
        this.detachFromDom();
        this._splitView?.dispose();
    }
}