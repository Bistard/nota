export const enum ComponentType {
    ActionBar = 'action-bar',
    ActionView = 'action-view',
    editor = 'editor-view',
}

export interface IComponent {
    create(): void;
    registerListeners(): void;
    registerComponent(component: Component): void;
    getId(): string;
}

export abstract class Component implements IComponent {
    
    public readonly parentComponent: Component | null;
    public readonly parent: HTMLElement | null;

    public readonly container: HTMLElement = document.createElement('div');

    protected contentArea: HTMLElement | undefined;
    protected componentMap: Map<string, Component> = new Map();

    constructor(id: string, 
                parentComponent: Component | null = null,
                // this parameter gives chance to customize parentElement
                parentElement?: HTMLElement 
    ) {
        this.container.id = id;
        
        this.parentComponent = parentComponent;
        if (parentComponent) {
            this.parent = parentComponent.container;
            parentComponent.registerComponent(this);
        } else {
            this.parent = null;
        }

        if (parentElement) {
            this.parent = parentElement;
        }
    }

    /**
     * @description gneric function for every subclasses object to be created.
     */
    public create(): void {
        this.parent?.appendChild(this.container);
        this._createContainer();
    }

    /**
     * @description after 'create()' has been called, HTMLElements are ready to
     * be registered with events.
     */
    public registerListeners(): void {
        this._registerListeners();
    }

    /**
     * @description register component into mapping.
     */
    public registerComponent(component: Component): void {
        if (this.componentMap) {
            this.componentMap.set(component.getId(), component);
        } else {
            throw new Error('componentMap is undefined, cannot register component');
        }
    }

    /**
     * @description function to create the actual html layout and will be called
     * by 'create()' from the Component class to create the whole component.
     * 
     * subclasses should override this function.
     */
    protected _createContainer(): void {
        this._createContentArea();
    }

    /**
     * @description if needed, this function will be called inside the function
     * '_createContainer()' to create the actual content of the component.
     * 
     * subclasses should override this function.
     */
    protected _createContentArea(): void {
        return undefined;
    }

    /**
     * @description to register listeners for the component and its content.
     * 
     * subclasses should override this function.
     */
    protected _registerListeners(): void {
        return;
    }

    public getId(): string {
        return this.container.id;
    }

}
