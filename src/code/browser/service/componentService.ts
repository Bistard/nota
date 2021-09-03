import { createDecorator } from "src/code/common/service/instantiation/decorator";
import { Component } from "src/code/browser/workbench/component";

export const IComponentService = createDecorator<IComponentService>('component-service');

export interface IComponentService {
    register(component: Component, force?: boolean): void;
    unregister(component: Component | string): void;
    get(id: string): Component | null;
    printAll(): void;
}

/**
 * @description This service is used to store and track all the registered 
 * Component.
 */
export class ComponentService {

    private readonly _componentMap: Map<string, Component>;

    constructor() {
        this._componentMap = new Map();
    }

    public register(component: Component, force?: boolean): void {
        if (this._componentMap.has(component.getId()) && force === false) {
            // do log her
            throw Error('component has been already registered');
        }
        this._componentMap.set(component.getId(), component);
    }

    public unregister(id: string): void {
        this._componentMap.delete(id);
    }

    public get(id: string): Component | null {
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

// export const COMPONENT_SERVICE = new ComponentService();