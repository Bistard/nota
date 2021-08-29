<<<<<<< HEAD
import { Button, IButton } from 'src/base/browser/basic/button';
import { EVENT_EMITTER } from 'src/base/common/event';
import { ActionViewType } from 'src/code/workbench/browser/actionView/actionView';
import { Component, ComponentType } from 'src/code/workbench/browser/component';
import { IRegisterService } from 'src/code/workbench/service/registerService';
import { ipcRendererOn } from 'src/base/electron/register';
import { getSvgPathByName, SvgType } from 'src/base/common/string';
import { ActionBarContextMenu } from 'src/base/browser/secondary/contextMenu/actionBarContextMenu';
import { Dimension } from 'src/base/browser/secondary/contextMenu/contextMenu';

export interface IActionBarOptions {
    options: [
        isExplorerChecked: boolean,
        isOutlineCheckd:   boolean,
        isSearchChecked:   boolean,
        isGitChecked:      boolean,
    ];
}

/**
 * @description ActionBarComponent provides access to each action view and handles 
 * the state transition between each action button and display coressponding 
 * action view.
 */
export class ActionBarComponent extends Component {

    private actionBarContextMenu!: ActionBarContextMenu;
    private _buttonGroups: IButton[] = [];
    
    // if value is -1, it means actionView is not shown.
    private currFocusActionBtnIndex: number;

    constructor(parent: HTMLElement, 
                registerService: IRegisterService) {
        super(ComponentType.ActionBar, parent, registerService);
        
        this.currFocusActionBtnIndex = -1;
    }

    protected override _createContainer(): void {
        // customize...
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'action-button-container';
        this.container.appendChild(this.contentArea);

        [
            {id: 'explorer-button', src: 'file'},
            {id: 'outline-button', src: 'list'},
            {id: 'search-button', src: 'search'},
            {id: 'git-button', src: 'git'},
            {id: 'setting-button', src: 'setting'},
        ]
        .forEach(({ id, src }) => {
            const button = new Button(id, this.contentArea!);
            button.setClass(['button', 'action-button']);
            button.setImage(getSvgPathByName(SvgType.base, src));
            button.setImageClass(['vertical-center', 'filter-black']);

            this._buttonGroups.push(button);
        });
    }

    protected override _registerListeners(): void {
        //this.actionBarContextMenu.registerListeners();
        const actionBarOpts: IActionBarOptions = { 
            options: [true, true, true, true],
        };

        /**
         * @readonly register context menu listeners (right click menu)
         */
        document.getElementById('mainApp')!.addEventListener('contextmenu', (ev: MouseEvent) => {
            ev.preventDefault();

            console.log(ev.pageX, ev.pageY)
            let dimension: Dimension = {
                coordinateX: ev.pageX,
                coordinateY: ev.pageY,
                width: 20,
                height: 150,
            };
            console.log(dimension)
            const prevContextMenu = document.getElementById("context-menu");
            if ( prevContextMenu === null) {
                this._createContextMenu(dimension);
                this.actionBarContextMenu.registerListeners();

            } 

            //this._createContextMenu(dimension);
            //document.execCommand("cut");
            //console.log()
            //ipcRendererSendData('showContextMenuActionBar', actionBarOpts);    
        })

        document.getElementById('mainApp')!.addEventListener('click', (ev: MouseEvent) => {
            const prevContextMenu = document.getElementById("context-menu");
            if ( prevContextMenu === null) {
                return;
            } 
            prevContextMenu!.remove();
            const mainContextMenu = document.getElementById("contextMenu");

            mainContextMenu!.style.display = 'none';

        })

        // TODO: add an array that stores user preference for action buttons (could be stored in config.ts)
        /**
         * @readonly once user clicked the menu in the main thread and sending 
         * the message back, we listens to that action.
         */
        ipcRendererOn('context-menu-command', (
            _ev: Electron.IpcRendererEvent, 
            _opt: IActionBarOptions, 
            elementID: string, 
            index: number
        ) => {
            const actionButton = document.getElementById(elementID);
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
                actionBarOpts.options[index] = true;
            } else {
                actionButton!.style.display = 'none';
                actionBarOpts.options[index] = false;
            }        
        });

        // TODO: remove later
        // give every actionButton a unique number
        $('.action-button').each(function(index, element) {
            element.setAttribute('btnNum', index.toString());
        });
        
        // default with openning explorer view
        this.clickActionBtn(document.getElementById('explorer-button') as HTMLElement);

        // TODO: comeplete using my own API
        $('.action-button').on('click', { ActionBarComponent: this }, function (event) {
            let that = event.data.ActionBarComponent;
            that.clickActionBtn(this);
        });
    }

    /**
     * @description clicks a given button. If it is not focused, set it as 
     * focused. Moreover, switch to that action view.
     */
    public clickActionBtn(clickedBtn: HTMLElement): void {
        
        // get which action button is clicking
        const actionName = clickedBtn.id.slice(0, -"-button".length) as ActionViewType;
        
        // switch to the action view
        EVENT_EMITTER.emit('EOnActionViewChange', actionName);

        // focus the action button and reverse the state of action view
        const clickedBtnIndex = parseInt(clickedBtn.getAttribute('btnNum') as string);
        const actionBtnContainer = clickedBtn.parentNode as HTMLElement;
        const currBtn = actionBtnContainer.children[this.currFocusActionBtnIndex] as HTMLElement;
            
        if (this.currFocusActionBtnIndex == -1) {
            // none of action button is focused, open the action view
            this.currFocusActionBtnIndex = clickedBtnIndex;
            EVENT_EMITTER.emit('EOnActionViewOpen');
            clickedBtn.classList.add('action-button-focus');
        } else if (this.currFocusActionBtnIndex == clickedBtnIndex) {
            // if the current focused button is clicked again, close action view.
            this.currFocusActionBtnIndex = -1;
            EVENT_EMITTER.emit('EOnActionViewClose');
            currBtn.classList.remove('action-button-focus');
        } else if (this.currFocusActionBtnIndex >= 0) {
            // other action button is clicked, only change the style
            this.currFocusActionBtnIndex = clickedBtnIndex;
            currBtn.classList.remove('action-button-focus');
            clickedBtn.classList.add('action-button-focus');
        } else {
            throw 'error';
        }
    }

    private _createContextMenu(dimension: Dimension): void {
        //.createElement('div');
        //actionButtonContextMenu.id = 'action-button-context-menu';
        const actionButtonContextMenu = document.getElementById('contextMenu');
        if (actionButtonContextMenu === null) {
            return;
        }
        this.actionBarContextMenu = new ActionBarContextMenu(dimension, actionButtonContextMenu, this);
        this.actionBarContextMenu.create();
        actionButtonContextMenu.style.top = `${dimension.coordinateY}px`;
        actionButtonContextMenu.style.left =`${dimension.coordinateX}px`;
        actionButtonContextMenu.style.width = `${dimension.width}px`;
        actionButtonContextMenu.style.height = `${dimension.height}px`;
        actionButtonContextMenu.style.display = 'initial';

    }

=======
import { Button, IButton } from 'src/base/browser/basic/button';
import { EVENT_EMITTER } from 'src/base/common/event';
import { ActionViewType } from 'src/code/workbench/browser/actionView/actionView';
import { Component, ComponentType } from 'src/code/workbench/browser/component';
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSendData } from 'src/base/electron/register';
import { IRegisterService } from 'src/code/workbench/service/registerService';
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSendData, domNodeByIdMouseEventAddListener } from 'src/base/electron/register';
import { getSvgPathByName, SvgType } from 'src/base/common/string';
import { ActionBarContextMenu } from 'src/base/browser/secondary/contextMenu/actionBarContextMenu';
import { Dimension } from 'src/base/browser/secondary/contextMenu/contextMenu';

export interface IActionBarOptions {
    options: [
        isExplorerChecked: boolean,
        isOutlineCheckd:   boolean,
        isSearchChecked:   boolean,
        isGitChecked:      boolean,
    ];
}

/**
 * @description ActionBarComponent provides access to each action view and handles 
 * the state transition between each action button and display coressponding 
 * action view.
 */
export class ActionBarComponent extends Component {

    private actionBarContextMenu!: ActionBarContextMenu;
    private _buttonGroups: IButton[] = [];
    
    // if value is -1, it means actionView is not shown.
    private currFocusActionBtnIndex: number;

    constructor(parentComponent: Component) {
        super(ComponentType.ActionBar, parentComponent);
        
        this.currFocusActionBtnIndex = -1;
    }

    protected override _createContent(): void {
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'action-button-container';
        this.container.appendChild(this.contentArea);

        [
            {id: 'explorer-button', src: 'file'},
            {id: 'outline-button', src: 'list'},
            {id: 'search-button', src: 'search'},
            {id: 'git-button', src: 'git'},
            {id: 'setting-button', src: 'setting'},
        ]
        .forEach(({ id, src }) => {
            const button = new Button(id, this.contentArea!);
            button.setClass(['button', 'action-button']);
            button.setImage(getSvgPathByName(SvgType.base, src));
            button.setImageClass(['vertical-center', 'filter-black']);

            this._buttonGroups.push(button);
        });
    }

    protected override _registerListeners(): void {
        //this.actionBarContextMenu.registerListeners();
        const actionBarOpts: IActionBarOptions = { 
            options: [true, true, true, true],
        };

        /**
         * @readonly register context menu listeners (right click menu)
         */
        document.getElementById('mainApp')!.addEventListener('contextmenu', (ev: MouseEvent) => {
            ev.preventDefault();

            console.log(ev.pageX, ev.pageY)
            let dimension: Dimension = {
                coordinateX: ev.pageX,
                coordinateY: ev.pageY,
                width: 20,
                height: 150,
            };
            console.log(dimension)
            const prevContextMenu = document.getElementById("context-menu");
            if ( prevContextMenu === null) {
                this._createContextMenu(dimension);
                this.actionBarContextMenu.registerListeners();

            } 

            //this._createContextMenu(dimension);
            //document.execCommand("cut");
            //console.log()
            //ipcRendererSendData('showContextMenuActionBar', actionBarOpts);    
        })

        document.getElementById('mainApp')!.addEventListener('click', (ev: MouseEvent) => {
            const prevContextMenu = document.getElementById("context-menu");
            if ( prevContextMenu === null) {
                return;
            } 
            prevContextMenu!.remove();
            const mainContextMenu = document.getElementById("contextMenu");

            mainContextMenu!.style.display = 'none';

        })

        // TODO: add an array that stores user preference for action buttons (could be stored in config.ts)
        /**
         * @readonly once user clicked the menu in the main thread and sending 
         * the message back, we listens to that action.
         */
        ipcRendererOn('context-menu-command', (
            _ev: Electron.IpcRendererEvent, 
            _opt: IActionBarOptions, 
            elementID: string, 
            index: number
        ) => {
            const actionButton = document.getElementById(elementID);
            console.log(actionButton?.style.display);
            if (actionButton!.style.display == 'none') {
                actionButton!.style.display = 'initial';
                actionBarOpts.options[index] = true;
            } else {
                actionButton!.style.display = 'none';
                actionBarOpts.options[index] = false;
            }        
        });

        // TODO: remove later
        // give every actionButton a unique number
        $('.action-button').each(function(index, element) {
            element.setAttribute('btnNum', index.toString());
        });
        
        // default with openning explorer view
        this.clickActionBtn(document.getElementById('explorer-button') as HTMLElement);

        // TODO: comeplete using my own API
        $('.action-button').on('click', { ActionBarComponent: this }, function (event) {
            let that = event.data.ActionBarComponent;
            that.clickActionBtn(this);
        });
    }

    /**
     * @description clicks a given button. If it is not focused, set it as 
     * focused. Moreover, switch to that action view.
     */
    public clickActionBtn(clickedBtn: HTMLElement): void {
        
        // get which action button is clicking
        const actionName = clickedBtn.id.slice(0, -"-button".length) as ActionViewType;
        
        // switch to the action view
        EVENT_EMITTER.emit('EOnActionViewChange', actionName);

        // focus the action button and reverse the state of action view
        const clickedBtnIndex = parseInt(clickedBtn.getAttribute('btnNum') as string);
        const actionBtnContainer = clickedBtn.parentNode as HTMLElement;
        const currBtn = actionBtnContainer.children[this.currFocusActionBtnIndex] as HTMLElement;
            
        if (this.currFocusActionBtnIndex == -1) {
            // none of action button is focused, open the action view
            this.currFocusActionBtnIndex = clickedBtnIndex;
            EVENT_EMITTER.emit('EOnActionViewOpen');
            clickedBtn.classList.add('action-button-focus');
        } else if (this.currFocusActionBtnIndex == clickedBtnIndex) {
            // if the current focused button is clicked again, close action view.
            this.currFocusActionBtnIndex = -1;
            EVENT_EMITTER.emit('EOnActionViewClose');
            currBtn.classList.remove('action-button-focus');
        } else if (this.currFocusActionBtnIndex >= 0) {
            // other action button is clicked, only change the style
            this.currFocusActionBtnIndex = clickedBtnIndex;
            currBtn.classList.remove('action-button-focus');
            clickedBtn.classList.add('action-button-focus');
        } else {
            throw 'error';
        }
    }

    private _createContextMenu(dimension: Dimension): void {
        //.createElement('div');
        //actionButtonContextMenu.id = 'action-button-context-menu';
        const actionButtonContextMenu = document.getElementById('contextMenu');
        if (actionButtonContextMenu === null) {
            return;
        }
        this.actionBarContextMenu = new ActionBarContextMenu(dimension, actionButtonContextMenu, this);
        this.actionBarContextMenu.create();
        actionButtonContextMenu.style.top = `${dimension.coordinateY}px`;
        actionButtonContextMenu.style.left =`${dimension.coordinateX}px`;
        actionButtonContextMenu.style.width = `${dimension.width}px`;
        actionButtonContextMenu.style.height = `${dimension.height}px`;
        actionButtonContextMenu.style.display = 'initial';

    }

>>>>>>> origin/master
}