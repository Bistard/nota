import { ContextMenu, ContextMenuType, Coordinate, IContextMenu } from "src/base/browser/secondary/contextMenu/contextMenu";
import { IComponentService } from "src/code/browser/service/componentService";
import { IContextMenuService } from "src/code/browser/service/contextMenuService";
import { ActionViewType } from "src/code/browser/workbench/actionView/actionView";
import { EVENT_EMITTER } from "src/base/common/event";
import { IButton } from "src/base/browser/basic/button";


export class ExplorerViewContextMenu extends ContextMenu implements IContextMenu {

    constructor(
        coordinate: Coordinate,
        private readonly contextMenuService: IContextMenuService,
        @IComponentService componentService: IComponentService,
    ) {
        super(
            ContextMenuType.explorerView,
            coordinate,
            [
                {id: 'new file', classes: ['menu-item'], text: 'New File', role: 'normal'},
                {id: 'new folder', classes: ['menu-item'], text: 'New Folder', role: 'normal'},
                {id: '', text: 'seperator', role: 'seperator'},
                {id: 'copy', classes: ['menu-item'], text: 'Copy', role: 'normal'},
                {id: 'paste', classes: ['menu-item'], text: 'Paste', role: 'normal'},
                {id: 'cut', classes: ['menu-item'], text: 'Cut', role: 'normal'},
                {id: '', text: 'seperator', role: 'seperator'},
                {id: 'rename', classes: ['menu-item'], text: 'Rename', role: 'normal'},
                {id: 'delete', classes: ['menu-item'], text: 'Delete', role: 'normal'},
            ],
            componentService
        );
    }

    protected override _registerListeners(): void {

    } 
}