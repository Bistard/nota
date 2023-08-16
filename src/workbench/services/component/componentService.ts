import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IComponent } from "src/workbench/services/component/component";

export const IComponentService = createService<IComponentService>('component-service');

export interface IComponentService extends IService {
    register(component: IComponent, force?: boolean): void;
    unregister(component: IComponent | string): void;
    get(id: string): IComponent | null;
    printAll(): void;
}

/**
 * @class This service is used to store and track all the registered Component.
 */
export class ComponentService {

    declare _serviceMarker: undefined;

    private readonly _componentMap: Map<string, IComponent>;

    constructor() {
        this._componentMap = new Map();
    }

    public register(component: IComponent, force?: boolean): void {
        if (this._componentMap.has(component.id) && force === false) {
            // do log here
        }
        this._componentMap.set(component.id, component);
    }

    public unregister(id: string): void {
        this._componentMap.delete(id);
    }

    public get(id: string): IComponent | null {
        const component = this._componentMap.get(id);
        if (component === undefined) {
            return null;
        }
        return component;
    }

    public printAll(): void {
        console.log(this._componentMap);
    }

}
