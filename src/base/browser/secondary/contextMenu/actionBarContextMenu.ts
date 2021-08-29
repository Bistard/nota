import { ContextMenu, ContextMenuType, Dimension } from "src/base/browser/secondary/contextMenu/contextMenu";
import { Component } from "src/code/workbench/browser/component";
import { IMenuItem, MenuItem, Role } from "src/base/browser/secondary/contextMenu/menuItem"

export class ActionBarContextMenu extends ContextMenu {
    private _menuItemGroups: IMenuItem[] = [];

    constructor(dimension: Dimension,
                parentComponent: Component
    ) {
        super(ContextMenuType.actionBarMenu, dimension, parentComponent);
    }

    protected override _createContent(): void {
        this.container.style.display = 'block';
        this.container.style.backgroundColor  = 'F5F5F5';
        /*
        this.parent.appendChild(this.container);
        // customize...
        //this._createContentArea();
        this.contentArea = document.createElement('ul');
        this.contentArea.id = 'menu-item';
        this.container.appendChild(this.contentArea);
        [
            {id: 'show-explorer-button'},
            {id: 'show-outline-button'},
            {id: 'show-search-button'},
            {id: 'show-git-button'},
        ]
        .forEach(({ id }) => {
            const button = new Button(id, this.contentArea!);
            button.setClass(['button', 'context-action-button']);
           // button.setImage(getSvgPathByName(SvgType.base, src));
           // button.setImageClass(['vertical-center', 'filter-black']);

            this._buttonGroups.push(button);
        });
*/

        this.contentArea = document.createElement('ul');
        this.contentArea.id = 'context-menu-container';
        this.contentArea.style.listStyle = 'none';
        this.contentArea.style.textAlign= '-webkit-match-parent';
        this.contentArea.style.padding = '0';
        this.contentArea.style.margin = '0';
        this.container.appendChild(this.contentArea);

        [
            {id: 'select-explorer-button', textContent: 'Explorer', role: <Role>"normal"}, 
            {id: 'select-outline-button', textContent: 'Outline', role: <Role>'normal'}, 
            {id: 'select-search-button', textContent: 'Search', role: <Role>'normal'},
            {id: 'select-git-button', textContent: 'Git', role: <Role>'normal'},
        ]
        .forEach(({ textContent, id, role }) => {
            const item = new MenuItem(id, this.contentArea!, role);
            
            switch (role) {
                case 'normal':
                    item.setClass(['context-action-button']);
                    item.setItem(textContent);                  
                    break;
                case 'checkBox':
                  break;
                default:
                  console.log(`Invalid Menu Item Type`);
              }
            this._menuItemGroups.push(item);
        });
    }

    protected override _registerListeners(): void {
        document.getElementById('select-explorer-button')!.addEventListener('click', (ev) => {
            //ev.preventDefault();
            console.log('good')
            const actionButton = document.getElementById("explorer-button");
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
                //actionBarOpts.options[index] = true;
            } else {
                actionButton!.style.display = 'none';
                //actionBarOpts.options[index] = false;
            } 

        })
    } 
}