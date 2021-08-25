import { ContextMenu, ContextMenuType, Dimension } from "src/base/browser/secondary/contextMenu/contextMenu";
import { IRegisterService } from "src/code/workbench/service/registerService";


export class ActionBarContextMenu extends ContextMenu {

    constructor(dimension: Dimension,
                parent: HTMLElement,
                registerService: IRegisterService
    ) {
        super(ContextMenuType.actionBarMenu, dimension, parent, registerService);
    }

    

}