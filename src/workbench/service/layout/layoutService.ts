import { IService, createService } from "src/platform/instantiation/common/decorator";

export const ILayoutService = createService<ILayoutService>('layout-service');

/**
 * Interface only for {@link LayoutService}.
 */
export interface ILayoutService extends IService {

    /**
     * The parent container that will contains all the browser HTMLElements.
     */
    readonly parentContainer: HTMLElement;
}

export class LayoutService implements ILayoutService {

    _serviceMarker: undefined;

    // [field]

    public readonly parentContainer: HTMLElement;

    // [constructor]

    constructor() {
        this.parentContainer = document.body;
    }
}