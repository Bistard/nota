import { Component } from "src/code/workbench/browser/component";

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