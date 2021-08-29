import { IMenuItem, IMenuItemOption, MenuItem } from "src/base/browser/secondary/contextMenu/menuItem";
import { Component } from "src/code/workbench/browser/component";

export enum ContextMenuType {
    actionBar,
    actionView,
    editor,
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

export interface IContextMenuOption {
    contextMenuItems: IMenuItemOption[];
}

export abstract class ContextMenu extends Component implements IContextMenu {

    public readonly type: ContextMenuType;
    public readonly dimension: Dimension;
    
    public readonly menuItemGroups: IMenuItem[];
    public readonly menuItemOptions: IMenuItemOption[];
    
    constructor(type: ContextMenuType,
                dimension: Dimension,
                menuItemOptions: IMenuItemOption[],
    ) {
        super('context-menu', null, document.body);
        this.type = type;
        this.dimension = dimension;
        this.menuItemGroups = [];
        this.menuItemOptions = menuItemOptions;
    }

    public setNewPosition(dimension: Dimension): void {
        this.container.style.top = `${dimension.coordinateY}px`;
        this.container.style.left =`${dimension.coordinateX}px`;
        this.container.style.width = `${dimension.width}px`;
        this.container.style.height = `${dimension.height}px`;
    }

    protected override _createContent(): void {
        this.setNewPosition(this.dimension);
        
        this.contentArea = document.createElement('ul');
        this.contentArea.id = 'context-menu-container';
        this.container.appendChild(this.contentArea);

        this._createMenuItems(this.menuItemOptions);
    }

    private _createMenuItems(menuItemOptions: IMenuItemOption[]): void {
        for (const opt of menuItemOptions) {
            const item = new MenuItem(this.contentArea!, opt);
            this.menuItemGroups.push(item);
        }
    }
}