import { Button, IButton } from 'src/base/browser/basic/button';
import { Emitter, EVENT_EMITTER, EVENT_EMITTER_TEST } from 'src/base/common/event';
import { ActionViewType } from 'src/code/browser/workbench/actionView/actionView';
import { Component, ComponentType, IComponent } from 'src/code/browser/workbench/component';
import { getSvgPathByName, SvgType } from 'src/base/common/string';
import { ContextMenuType, Coordinate } from 'src/base/browser/secondary/contextMenu/contextMenu';
import { createDecorator } from 'src/code/common/service/instantiationService/decorator';
import { IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { IComponentService } from 'src/code/browser/service/componentService';

export const IActionBarService = createDecorator<IActionBarService>('action-bar-service');

export interface IActionBarService extends IComponent {
    contentArea: any;
    
    readonly buttonGroups: IButton[];

    clickActionBtn(clickedBtn: HTMLElement): void;
    getButton(id: string): IButton | null;
    modifyFocusIndex (position: number): void;
    getFocusIndex (): number;

}

export interface IActionBarOptions {
    options: [
        isExplorerChecked: boolean,
        isOutlineCheckd:   boolean,
        isSearchChecked:   boolean,
        isGitChecked:      boolean,
    ];
    id: [
       explorerId: string,
       outlineId: string,
       searchId: string,
       gitId: string,
    ];
}

/**
 * @description ActionBarComponent provides access to each action view and handles 
 * the state transition between each action button and display coressponding 
 * action view.
 */
export class ActionBarComponent extends Component implements IActionBarService {

    public readonly buttonGroups: IButton[] = [];
    
   // if value is -1, it means actionView is not shown.
    private currFocusActionBtnIndex: number;

    constructor(
        parentComponent: Component,
        @IComponentService componentService: IComponentService,
        @IContextMenuService private readonly contextMenuService: IContextMenuService,
    ) {
        super(ComponentType.ActionBar, parentComponent, null, componentService);
        
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

            this.buttonGroups.push(button);
        });
    }

    protected override _registerListeners(): void {

        /**
         * @readonly register context menu listeners (right click menu)
         */
        document.getElementById('action-bar')!.addEventListener('contextmenu', (ev: MouseEvent) => {
            ev.preventDefault();
            this.contextMenuService.removeContextMenu();
            let coordinate: Coordinate = {
                coordinateX: ev.pageX,
                coordinateY: ev.pageY,
            };

            this.contextMenuService.createContextMenu(ContextMenuType.actionBar, coordinate);

        });

        // TODO: remove later
        // give every actionButton a unique number
        $('.action-button').each(function(index, element) {
            element.setAttribute('btnNum', index.toString());
        });
        
        // default with openning explorer view
        this.clickActionBtn(document.getElementById('explorer-button') as HTMLElement);
        
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
            //EVENT_EMITTER.emit('EOnActionViewClose');
            EVENT_EMITTER_TEST.fire()

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

    public getButton(id: string): IButton | null {
        for (const button of this.buttonGroups) {
            if (button.id === id) {
                return button;
            }
        }
        return null;
    }

    public modifyFocusIndex(position: number): void{
        this.currFocusActionBtnIndex = position;
    }

    public getFocusIndex(): number {
        return this.currFocusActionBtnIndex;
    }

}