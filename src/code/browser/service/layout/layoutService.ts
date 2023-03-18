import { createService } from "src/code/platform/instantiation/common/decorator";

export const ILayoutService = createService<ILayoutService>('layout-service');

export interface ILayoutService {

    /**
     * The parent container that will contains all the browser HTMLElements.
     */
    readonly parentContainer: HTMLElement;
}

export class LayoutService implements ILayoutService {

    // [field]

    public readonly parentContainer: HTMLElement;

    // [constructor]

    constructor() {
        this.parentContainer = document.body;
    }
}