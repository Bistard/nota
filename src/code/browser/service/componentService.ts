import { createDecorator } from "src/code/common/service/instantiationService/decorator";
import { IComponent } from "src/code/browser/workbench/component";

export const IComponentService = createDecorator<IComponentService>('component-service');

export interface IComponentService {
    register(component: IComponent, force?: boolean): void;
    unregister(component: IComponent | string): void;
    get(id: string): IComponent | null;
    printAll(): void;
}

/**
 * @class This service is used to store and track all the registered Component.
 */
export class ComponentService {

    private readonly _componentMap: Map<string, IComponent>;

    constructor() {
        this._componentMap = new Map();
    }

    public register(component: IComponent, force?: boolean): void {
        if (this._componentMap.has(component.getId()) && force === false) {
            // do log here
        }
        this._componentMap.set(component.getId(), component);
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
