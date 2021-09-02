import { ActionBarContextMenu } from "src/base/browser/secondary/contextMenu/actionBar/actionBarContextMenu";
import { ContextMenuType, Coordinate, ContextMenuDimension, IContextMenu } from "src/base/browser/secondary/contextMenu/contextMenu";
import { EditorContextMenu } from "src/base/browser/secondary/contextMenu/editor/editorContextMenu";
import { createDecorator } from "src/code/common/service/instantiation/decorator";

export const IContextMenuService = createDecorator<IContextMenuService>('context-menu-service');

export interface IContextMenuService {
    createContextMenu(type: ContextMenuType, coordinate: Coordinate): void;
    removeContextMenu(): void;
    isContextMenuOn(): boolean;
    edgeDetection(menuDimension: ContextMenuDimension): Coordinate;
}

export class ContextMenuService implements IContextMenuService {

    private _contextMenu: IContextMenu | null;

    constructor() {
        this._contextMenu = null;
    }

    private _initContextMenu(type: ContextMenuType, coordinate: Coordinate): void {
        switch (type) {
            case ContextMenuType.actionBar:
                this._contextMenu = new ActionBarContextMenu(coordinate, this);
                break;
            case ContextMenuType.actionView:

                break;
            case ContextMenuType.editor:
                this._contextMenu = new EditorContextMenu(coordinate, this);
                break;
        }
    }

    public createContextMenu(type: ContextMenuType, coordinate: Coordinate): void {
        
        // if the previous contextMenu is right clicked twice, we simply set a new position
        if (this._contextMenu !== null && type === this._contextMenu.type) {
            this._contextMenu.setNewPosition(coordinate);
            return;
        }

        this.removeContextMenu();
        this._initContextMenu(type, coordinate);

        const windowData = document.getElementById('mainApp')!.getBoundingClientRect();

        let menuDimension: ContextMenuDimension = {
            coordinates: coordinate,
            windowHeight: windowData.height,
            windowWidth: windowData.width,
            contextMenuHeight: this._contextMenu!.getHeight(),
            contextMenuWidth: this._contextMenu!.getWidth(), 
        };

        const newCoordinate = this.edgeDetection(menuDimension);
        this._contextMenu!.setCoordinate(newCoordinate);
        
        this._contextMenu!.create();
        this._contextMenu!.registerListeners();
    }

    public removeContextMenu(): void {
        if (this._contextMenu) {
            this._contextMenu.container.remove();
            this._contextMenu = null;
        }
    }

    public isContextMenuOn(): boolean {
        return this._contextMenu !== null;
    }

    public edgeDetection(menuDimension: ContextMenuDimension): Coordinate {
        const cooridates = menuDimension.coordinates;
        if (cooridates.coordinateX + menuDimension.contextMenuWidth <= menuDimension.windowWidth){
             if (cooridates.coordinateY + menuDimension.contextMenuHeight > menuDimension.windowHeight){
                 cooridates.coordinateY -= menuDimension.contextMenuHeight;
             }  
        } else {
            if (cooridates.coordinateY + menuDimension.contextMenuHeight > menuDimension.windowHeight){
                cooridates.coordinateY -= menuDimension.contextMenuHeight;
                cooridates.coordinateX -= menuDimension.contextMenuWidth;
            } else{
                cooridates.coordinateX -= menuDimension.contextMenuWidth;
            }
        }
        return cooridates;
    }

}
