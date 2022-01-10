import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { IComponentService } from "src/code/browser/service/componentService";

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

export interface IComponent extends ICreateable {

    readonly parentComponent: Component | null;
    readonly parent: HTMLElement | null;
    container: HTMLElement;
    contentArea: HTMLElement | undefined;
    readonly componentMap: Map<string, Component>;

    registerComponent(component: Component): void;
    getId(): string;
}

export abstract class Component extends Disposable implements IComponent {
    
    /* events */
    
    private readonly _onDidVisibilityChange = this.__register( new Emitter<boolean>() );
    public readonly onDidVisibilityChange = this._onDidVisibilityChange.registerListener;

    /* end */

    public readonly parentComponent: Component | null = null;
    public readonly parent: HTMLElement | null = null;

    public container: HTMLElement = document.createElement('div');
    public contentArea: HTMLElement | undefined;

    public readonly componentMap: Map<string, Component> = new Map();

    /**
     * @param id The id for the Component.
     * @param parentComponent The parent Component.
     * @param parentElement If provided, parentElement will replace the HTMLElement from the provided parentComponent.
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

    /**
     * @description gneric function for every subclasses object to be created.
     */
    public create(): void {
        this.parent?.appendChild(this.container);
        this._createContent();
    }

    /**
     * @description after 'create()' has been called, HTMLElements are ready to
     * be registered with events.
     */
    public registerListeners(): void {
        // customize later
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

    public getId(): string {
        return this.container.id;
    }

    /**
     * @description Triggers the onDidVisibilityChange event.
     * @param value to visible or invisible.
     */
    public setVisible(value: boolean): void {
        this._onDidVisibilityChange.fire(value);
    }

    /**
     * @description Returns the sub component by id.
     * 
     * @warn If no such component exists, an error throws.
     * 
     * @param id The string ID of the component.
     * @returns The required Component.
     */
    public getComponentById(id: string): Component {
        const component = this.componentMap.get(id);
        if (!component) {
            throw new Error(`trying to get an unknown component ${id}`);
        }
        return component;
    }

}
