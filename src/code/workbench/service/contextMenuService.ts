import { ActionBarContextMenu } from "src/base/browser/secondary/contextMenu/actionBar/actionBarContextMenu";
import { ContextMenu, ContextMenuType, Dimension } from "src/base/browser/secondary/contextMenu/contextMenu";
import { EditorContextMenu } from "src/base/browser/secondary/contextMenu/editor/editorContextMenu";

export interface IContextMenuService {
    
    createContextMenu(type: ContextMenuType, dimension: Dimension): void;
    removeContextMenu(): void;
    isContextMenuOn(): boolean;

}

export class ContextMenuService implements IContextMenuService {

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

}

// TODO: add this to the DI in the future
export const CONTEXT_MENU_SERVICE = new ContextMenuService();