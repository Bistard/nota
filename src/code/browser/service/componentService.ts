import { createDecorator } from "src/code/common/service/instantiation/decorator";
import { Component } from "src/code/browser/workbench/component";

export const IComponentService = createDecorator<IComponentService>('component-service');

export interface IComponentService {
    
    readonly componentMap: Map<string, Component>;

    register(component: Component, force?: boolean): void;
    getComponent(id: string): Component | null;
}

/**
 * @description This service is used to store and track all the registered 
 * Component.
 */
export class ComponentService {

    public readonly componentMap: Map<string, Component>;

    constructor() {
        this.componentMap = new Map();
    }

    public register(component: Component, force?: boolean): void {
        if (this.componentMap.has(component.getId()) && force === false) {
            // do log her
            throw Error('component has been already registered');
        }
        this.componentMap.set(component.getId(), component);
    }

    public getComponent(id: string): Component | null {
        const component = this.componentMap.get(id);
        if (component === undefined) {
            return null;
        }
        return component;
    }

}

// export const COMPONENT_SERVICE = new ComponentService();