import { IWorkbenchService } from "src/code/workbench/service/workbenchService";

export const enum ComponentType {
    ActionBar = 'action-bar',
    ActionView = 'action-view',
    ContentView = 'content-view',
    TabBar = 'tab-bar',
}

export abstract class Component {
    
    protected parent!: HTMLElement;
    protected container: HTMLElement = document.createElement('div');
    protected contentArea: HTMLElement | undefined;

    protected workbenchService!: IWorkbenchService;

    constructor(id: string,
                workbenchService: IWorkbenchService) {
        this.container.id = id;
        this.workbenchService = workbenchService;
        
        workbenchService.registerComponent(this);
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
    public register(): void {
        this._registerListensers();
    }

    /**
     * @description function to create the actual html layout and will be called
     * by 'create()' from the Component class to create the whole component.
     * 
     * subclasses should override this function.
     */
    protected _createContainer(): void {
        return;
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
    protected _registerListensers(): void {
        return;
    }

    public getId(): string {
        return this.container.id;
    }

}
