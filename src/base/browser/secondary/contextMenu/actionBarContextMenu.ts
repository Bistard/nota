import { ContextMenu, ContextMenuType, Dimension } from "src/base/browser/secondary/contextMenu/contextMenu";
import { Component } from "src/code/workbench/browser/component";


export class ActionBarContextMenu extends ContextMenu {

    constructor(dimension: Dimension,
                parentComponent: Component
    ) {
        super(ContextMenuType.actionBarMenu, dimension, parentComponent);
    }

    

}