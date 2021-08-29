import { LIGHT_RED } from "src/base/common/color";
import { Component } from "src/code/workbench/browser/component";

export enum ContextMenuType {
    actionBarMenu,
    actionViewMenu,
    editorMenu,
    // more and more...
}

export type Dimension = {
    coordinateX: number;
    coordinateY: number;
    width: number;
    height: number;
}
export interface IContextMenu {
    
    readonly type: ContextMenuType;
    readonly dimension: Dimension;

}

export abstract class ContextMenu extends Component implements IContextMenu {

    public readonly type: ContextMenuType;
    public readonly dimension: Dimension;

    constructor(type: ContextMenuType,
                dimension: Dimension,
                parentComponnet: Component
    ) {
        super('context-menu', parentComponnet);
        this.type = type;
        this.dimension = dimension;
    }

    protected override _createContent(): void {
        this.container.style.position = 'fixed';
        // always generates a context menu to the bottom-right of the click
        this.container.style.left = this.dimension.coordinateX.toString();
        this.container.style.right = this.dimension.coordinateY.toString();
        this.container.style.width = this.dimension.width.toString();
        this.container.style.height = this.dimension.height.toString();
        
        this.container.style.background = LIGHT_RED.toString();
    }
}