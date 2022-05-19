import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { IComponentService } from "src/code/browser/service/componentService";

/**
 * List of all the types of {@link Component}.
 */
export const enum ComponentType {
    Workbench = 'workbench',
    ActionBar = 'action-bar',
    ActionView = 'action-view',
    Editor = 'editor-view',
    ExplorerView = 'explorer-container',
    OutlineView = 'outline-container',
    SearchView = 'search-container',
    GitView = 'git-container',
}

export interface ICreateable {
    create(): void;
    registerListeners(): void;
}

/**
 * An interface only for {@link Component}.
 */
export interface IComponent extends ICreateable {

    readonly parentComponent: IComponent | null;
    readonly parent: HTMLElement | null;
    container: HTMLElement;
    contentArea: HTMLElement | undefined;

    /**
     * @description Renders the component itself.
     */
    create(): void;

    /**
     * @description Registers any listeners in the component.
     */
    registerListeners(): void;

    /**
     * @description Register a child {@link Component} into the current Component.
     * @param override If sets to true, it will override the existed one which 
     *                 has the same component id. Defaults to false.
     * 
     * @warn Throws an error if the component has already been registered and
     *       override sets to false.
     */
    registerComponent(component: Component, override?: boolean): void;
    
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
     * 
     * @warn If no such component exists, an error throws.
     * 
     * @param id The string ID of the component.
     * @returns The required Component.
     */
    getComponent(id: string): Component;

    /**
     * @description Sets the visibility of the current component.
     * @param value to visible or invisible.
     */
    setVisible(value: boolean): void;

    /**
     * @description Returns the string id of the component.
     */
    getId(): string;

    /**
     * @description Disposes the current component and all its children 
     * components.
     */
    dispose(): void;

}

/**
 * @class Abstract base class for every composed / complicated UI component.
 * {@link Component} has ability to nest other {@link Component}s.
 * 
 * {@link Component} is disposable, once it get disposed, all its children will
 * also be disposed.
 * 
 * {@link Component} cannot be disposed / create() / registerListener() twice.
 */
export abstract class Component extends Disposable implements IComponent {
    
    // [field]
    
    public readonly parentComponent: IComponent | null = null;
    public readonly parent: HTMLElement | null = null;
    public container: HTMLElement = document.createElement('div');
    
    // TODO: try to remove this stupid stuff
    public contentArea: HTMLElement | undefined;

    private readonly _componentMap: Map<string, Component> = new Map();

    private _created: boolean = false;
    private _registered: boolean = false;

    // [event]
    
    private readonly _onDidVisibilityChange = this.__register( new Emitter<boolean>() );
    public readonly onDidVisibilityChange = this._onDidVisibilityChange.registerListener;

    // [constructor]

    /**
     * @param id The id for the Component.
     * @param parentComponent The parent Component.
     * @param parentElement If provided, parentElement will replace the HTMLElement 
     *                      from the provided parentComponent. Else defaults to 
     *                      `document.body`.
     * @param componentService ComponentService for the registration purpose.
     */
    constructor(id: string, 
                parentComponent: IComponent | null,
                parentElement: HTMLElement | null,
                protected readonly componentService: IComponentService,
    ) {
        super();

        this.container.id = id;
        
        this.parentComponent = parentComponent;
        if (parentComponent) {
            this.parent = parentComponent.container;
            parentComponent.registerComponent(this);
        }

        if (parentElement) {
            this.parent = parentElement;
        }

        this.componentService.register(this);
    }

    // [abstract method]

    /**
     * @description if needed, this function will be called inside the function
     * '_createContainer()' to create the actual content of the component.
     * 
     * subclasses should override this function.
     */
    protected abstract _createContent(): void;

    /**
     * @description to register listeners for the component and its content.
     * 
     * subclasses should override this function.
     */
    protected abstract _registerListeners(): void;

    // [public method]

    public create(): void {
        if (this.isDisposed() || this._created) {
            return; 
        }
        
        this.parent?.appendChild(this.container); //TODO: try to remove `?`
        this._createContent();
        this._created = true;
    }

    public registerListeners(): void {
        if (this.isDisposed() || this._registered || !this._created) {
            return; 
        }
        
        this._registerListeners();
        this._registered = true;
    }

    public registerComponent(component: Component, override: boolean = false): void {
        const id = component.getId();
        const registered = this._componentMap.has(id);
        
        if (registered && !override) {
            throw new Error('component has been already registered');
        }

        if (registered && override) {
            const deprecated = this._componentMap.get(id)!;
            deprecated.dispose();
        }

        this._componentMap.set(id, component);
    }

    public getId(): string {
        return this.container.id;
    }

    public setVisible(value: boolean): void {
        
        if (value === true) {
            this.container.style.visibility = 'visible';
        } else {
            this.container.style.visibility = 'hidden';
        }

        this._onDidVisibilityChange.fire(value);
    }

    public hasComponent(id: string): boolean {
        return this._componentMap.has(id);
    }

    public getComponent(id: string): Component {
        const component = this._componentMap.get(id);
        if (!component) {
            throw new Error(`trying to get an unknown component ${id}`);
        }
        return component;
    }

    public override dispose(): void {
        for (const child of this._componentMap.values()) {
            child.dispose();
        }
        super.dispose();
    }

}
