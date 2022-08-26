import { ContextMenu, ContextMenuType, Coordinate, IContextMenu } from "src/base/browser/secondary/contextMenu/contextMenu";
import { IComponentService } from "src/code/browser/service/component/componentService";
import { IContextMenuService } from "src/code/browser/service/contextMenuService";
import { IThemeService } from "src/code/browser/service/theme/themeService";


export class ExplorerViewContextMenu extends ContextMenu implements IContextMenu {

    constructor(
        coordinate: Coordinate,
        private readonly contextMenuService: IContextMenuService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
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
            componentService,
            themeService,
        );
    }

    protected override _registerListeners(): void {

    } 
}