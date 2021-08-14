import { IRegisterService } from "src/code/workbench/service/registerService";

export const enum ComponentType {
    ActionBar = 'action-bar',
    ActionView = 'action-view',
    ContentView = 'content-view',
    TabBar = 'tab-bar',
}

export interface IComponent {
    
}

export abstract class Component implements IComponent, IRegisterService {
    
    protected parent!: HTMLElement;
    protected container: HTMLElement = document.createElement('div');
    protected contentArea: HTMLElement | undefined;
    protected contentAreaMap: Map<string, Component> = new Map();
    
    protected registerService!: IRegisterService;

    constructor(id: string,
                registerService: IRegisterService) {
        this.container.id = id;
        this.registerService = registerService;
        
        registerService.registerComponent(this);
    }

    /**
     * @description gneric function for every subclasses object to be created.
     */
    public create(parent: HTMLElement): void {
        this.parent = parent;
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
        if (this.contentAreaMap) {
            this.contentAreaMap.set(component.getId(), component);
        } else {
            throw new Error('contentAreaMap is undefined, cannot register component');
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
