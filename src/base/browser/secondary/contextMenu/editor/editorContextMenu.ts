import { ContextMenu, ContextMenuType, Coordinate, IContextMenu } from "src/base/browser/secondary/contextMenu/contextMenu";
import { IComponentService } from "src/code/browser/service/componentService";
import { IContextMenuService } from "src/code/browser/service/contextMenuService";
const { clipboard } = require('electron')
const electron = require('electron');

export class EditorContextMenu extends ContextMenu implements IContextMenu {
    
    constructor(
        coordinate: Coordinate,
        private readonly contextMenuService: IContextMenuService,
        @IComponentService componentService: IComponentService,
    ) {
        super(
            ContextMenuType.actionBar, 
            coordinate,
            [
                {id: 'copy', classes: ['menu-item'], text: 'Copy', role: 'normal'},
                {id: 'paste', classes: ['menu-item'], text: 'Paste', role: 'normal'},
                {id: 'cut', classes: ['menu-item'], text: 'Cut', role: 'normal'},
                {text: 'seperator', role: 'seperator'},
                {id: 'select all', classes: ['menu-item'], text: 'Select All', role: 'normal'},
                {id: 'search', classes: ['menu-item'], text: 'Search With Google', role: 'normal'},
                {text: 'seperator', role: 'seperator'},
                {id: 'Delete', classes: ['menu-item'], text: 'Delete', role: 'normal', enable: false},
                {id: 'Sub Menu', classes: ['menu-item'], text: 'Sub Menu', role: 'subMenu', subMenuItem: [   {id: 'paste', classes: ['menu-item'], text: 'Paste', role: 'normal'},]},
            ],
            componentService,
        );
    }

    protected override _registerListeners(): void {
        
        document.getElementById('copy')!.addEventListener('click', (ev) => {
            document.execCommand("copy");
            this.contextMenuService.removeContextMenu();
        });

        document.getElementById('paste')!.addEventListener('click', (ev) => {
            document.execCommand("paste");
            this.contextMenuService.removeContextMenu();
        });

        document.getElementById('cut')!.addEventListener('click', (ev) => {
            document.execCommand("cut");
            this.contextMenuService.removeContextMenu();
        });

        document.getElementById('select all')!.addEventListener('click', (ev) => {
            document.execCommand("selectAll");
            this.contextMenuService.removeContextMenu();
        });

        document.getElementById('search')!.addEventListener('click', (ev) => {
            const url = new URL('https://www.google.com/search');
            //const text = clipboard.readText()
            const selection = window.getSelection()!.toString();
            if (selection != ''){
                url.searchParams.set('q', selection);
                electron.shell.openExternal(url.toString());
                this.contextMenuService.removeContextMenu();
            };
        });

    } 
}