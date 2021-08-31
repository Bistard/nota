import { ActionBarContextMenu } from "src/base/browser/secondary/contextMenu/actionBarContextMenu";
import { ContextMenu, ContextMenuDimension, ContextMenuType, Dimension } from "src/base/browser/secondary/contextMenu/contextMenu";
import { EditorContextMenu } from "src/base/browser/secondary/contextMenu/editorContextMenu";

export class ContextMenuService {

    private _contextMenu: ContextMenu | null;

    constructor() {
        this._contextMenu = null;
    }

    public createContextMenu(type: ContextMenuType, dimension: Dimension): void {
        if (this._contextMenu !== null) {
            this._contextMenu.setNewPosition(dimension);
            return;
        }
        
        switch (type) {
            case ContextMenuType.actionBar:
                this._contextMenu = new ActionBarContextMenu(dimension);
                break;
            case ContextMenuType.actionView:

                break;
            case ContextMenuType.editor:
                this._contextMenu = new EditorContextMenu(dimension);
                break;
        }
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

    public edgeDetection(menuDimension: ContextMenuDimension): Dimension {
        if (menuDimension.coordinates.coordinateX + menuDimension.contextMenuWidth <= menuDimension.windowWidth){
             if (menuDimension.coordinates.coordinateY + menuDimension.contextMenuHeight > menuDimension.windowHeight){
                 menuDimension.coordinates.coordinateY -= menuDimension.contextMenuHeight;
             }  
        } else {
            if (menuDimension.coordinates.coordinateY + menuDimension.contextMenuHeight > menuDimension.windowHeight){
                menuDimension.coordinates.coordinateY -= menuDimension.contextMenuHeight;
                menuDimension.coordinates.coordinateX -= menuDimension.contextMenuWidth;
            } else{
                menuDimension.coordinates.coordinateX -= menuDimension.contextMenuWidth;
            }
        }
        return menuDimension.coordinates
    }

}

// TODO: add this to the DI in the future
export const CONTEXT_MENU_SERVICE = new ContextMenuService();