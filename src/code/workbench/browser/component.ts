import { IWorkbenchService } from "src/code/workbench/service/workbenchService";

export const enum ComponentType {
    ActionBar = 'action-bar',
    ActionView = 'action-view',
    ContentView = 'content-view',
}

export abstract class Component {
    
    public id: string;

    public parent: HTMLElement | undefined;
    public container: HTMLElement;
    public contentArea: HTMLElement | undefined;

    constructor(id: string,
                workbenchService: IWorkbenchService) {
        this.id = id;
        this.container = document.createElement('div');
        
        workbenchService.registerComponent(this);
    }

    /**
     * @description gneric function for every subclasses to be created.
     */
    public create(parent: HTMLElement): void {
        this.parent = parent;
        this.contentArea = this._createContentArea(parent);

        if (this.parent && this.contentArea) {
            this.parent.appendChild(this.contentArea);
        }
    }

    /**
     * @description after 'create()' has been called, HTMLElements are ready to
     * be registered with events.
     */
    public register(): void {
        this._registerListensers();
    }

    /**
     * @description subclasses override this function to create the actual 
     * content.
     */
    protected _createContentArea(_parent: HTMLElement): HTMLElement | undefined {
        return undefined;
    }

    /**
     * @description subclasses override this function to register listeners.
     */
    protected _registerListensers(): void {
        return;
    }

    public getId(): string {
        return this.id;
    }

}
