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

    readonly parentComponent: Component | null;
    readonly parent: HTMLElement | null;
    container: HTMLElement;
    contentArea: HTMLElement | undefined;
    readonly componentMap: Map<string, Component>;

    /**
     * @description Renders the component itself.
     */
    create(): void;

    /**
     * @description Registers any listeners in the component.
     */
    registerListeners(): void;

    /**
     * @description after 'create()' has been called, HTMLElements are ready to
     * be registered with events.
     */
    registerComponent(component: Component): void;
    
    /**
     * @description Returns the sub component by id.
     * 
     * @warn If no such component exists, an error throws.
     * 
     * @param id The string ID of the component.
     * @returns The required Component.
     */
    getComponentById(id: string): Component;

    /**
     * @description Triggers the onDidVisibilityChange event.
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
    
    public readonly parentComponent: Component | null = null;
    public readonly parent: HTMLElement | null = null;

    public container: HTMLElement = document.createElement('div');
    public contentArea: HTMLElement | undefined;

    public readonly componentMap: Map<string, Component> = new Map();

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
                parentComponent: Component | null,
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

    // [method]

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

    public registerComponent(component: Component): void {
        if (this.componentMap) {
            this.componentMap.set(component.getId(), component);
        } else {
            throw new Error('componentMap is undefined, cannot register component');
        }
    }

    public getId(): string {
        return this.container.id;
    }

    public setVisible(value: boolean): void {
        this._onDidVisibilityChange.fire(value);
    }

    public getComponentById(id: string): Component {
        const component = this.componentMap.get(id);
        if (!component) {
            throw new Error(`trying to get an unknown component ${id}`);
        }
        return component;
    }

    public override dispose(): void {
        for (const child of this.componentMap.values()) {
            child.dispose();
        }
        super.dispose();
    }

}
