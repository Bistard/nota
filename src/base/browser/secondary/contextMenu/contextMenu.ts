import { CONTEXT_MENU_ITEM_HEIGHT, CONTEXT_MENU_WIDTH, IMenuItem, IMenuItemOption, MenuItem } from "src/base/browser/secondary/contextMenu/menuItem";
import { IComponentService } from "src/code/browser/service/componentService";
import { Component, IComponent } from "src/code/browser/workbench/component";

export enum ContextMenuType {
    actionBar,
    actionView,
    editor,
    // more and more...
}

export type Coordinate = {
    coordinateX: number;
    coordinateY: number;
}

export type Dimension = {
    width: number;
    height: number;
}

export type ContextMenuDimension = {
    coordinates: Coordinate;
    windowHeight: number;
    windowWidth: number;
    contextMenuHeight: number;
    contextMenuWidth: number;
}

export interface IContextMenu extends IComponent {
    
    readonly type: ContextMenuType;
    
    /**
     * @description change the actual position based on the given coordiate.
     */
    setNewPosition(coordinate: Coordinate): void;

    /**
     * @description only set a new coordinate but will not change the actual coordinate.
     */
    setCoordinate(coordinate: Coordinate): void;

    /**
     * @description returns the current coordinate.
     */
    getCoordinate(): Coordinate;

    /**
     * @description returns the actual width of the contextMenu.
     */
    getWidth(): number;

    /**
     * @description returns the actual height of the contextMenu.
     */
    getHeight(): number;

    /**
     * @description returns the dimension of the contextMenu.
     */
    getDimension(): Dimension;
}

export interface IContextMenuOption {
    contextMenuItems: IMenuItemOption[];
}

export abstract class ContextMenu extends Component implements IContextMenu {

    public readonly type: ContextMenuType;

    public readonly menuItemGroups: IMenuItem[];
    public readonly menuItemOptions: IMenuItemOption[];

    private _dimension: Dimension = { width: CONTEXT_MENU_WIDTH, height: 0 }
    private _coordinate: Coordinate;
    
    constructor(type: ContextMenuType,
                coordinate: Coordinate,
                menuItemOptions: IMenuItemOption[],
                @IComponentService componentService: IComponentService,
    ) {
        super('context-menu', null, document.body, componentService);
        this.type = type;
        this._coordinate = coordinate;
        this.menuItemGroups = [];
        this.menuItemOptions = menuItemOptions;

        for (const _menuItemOpt of menuItemOptions) {
            this._dimension.height += CONTEXT_MENU_ITEM_HEIGHT;
        }
    }

    public setNewPosition(coordinate: Coordinate): void {
        this.setCoordinate(coordinate);
        this.container.style.top = `${this._coordinate.coordinateY}px`;
        this.container.style.left =`${this._coordinate.coordinateX}px`;
    }

    public setCoordinate(coordinate: Coordinate): void {
        this._coordinate = coordinate;
    }

    public getCoordinate(): Coordinate {
        return this._coordinate;
    }

    public getWidth(): number {
        return this._dimension.width;
    }
    
    public getHeight(): number {
        return this._dimension.height;
    }

    public getDimension(): Dimension {
        return this._dimension;
    }

    protected override _createContent(): void {
        this.setNewPosition(this._coordinate);
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