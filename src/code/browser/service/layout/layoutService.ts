import { IMicroService, createService } from "src/code/platform/instantiation/common/decorator";

export const ILayoutService = createService<ILayoutService>('layout-service');

/**
 * Interface only for {@link LayoutService}.
 */
export interface ILayoutService extends IMicroService {

    /**
     * The parent container that will contains all the browser HTMLElements.
     */
    readonly parentContainer: HTMLElement;
}

export class LayoutService implements ILayoutService {

    _microserviceIdentifier: undefined;

    // [field]

    public readonly parentContainer: HTMLElement;

    // [constructor]

    constructor() {
        this.parentContainer = document.body;
    }
}