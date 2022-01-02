import { Button, IButton } from 'src/base/browser/basic/button';
import { Component, ComponentType, IComponent } from 'src/code/browser/workbench/component';
import { getSvgPathByName, SvgType } from 'src/base/common/string';
import { ContextMenuType, Coordinate } from 'src/base/browser/secondary/contextMenu/contextMenu';
import { createDecorator } from 'src/code/common/service/instantiationService/decorator';
import { IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { IComponentService } from 'src/code/browser/service/componentService';

export const IActionBarService = createDecorator<IActionBarService>('action-bar-service');

export enum ActionType {
    NONE = 'none',
    EXPLORER = 'explorer',
    OUTLINE = 'outline',
    SEARCH = 'search',
    GIT = 'git',
    SETTINGS = 'setting',
}

export interface IActionBarService extends IComponent {
    
    /**
     * @description Invoked when the action button is clicked. The button will 
     * be focus.
     * @param clickedType The type of buttion is clicked.
     */
    actionButtonClick(clickedType: ActionType): void;
    
    /**
     * @description Returns a button by provided a buttion type.
     * @param type The type of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getButton(type: ActionType): IButton | undefined;
    
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

    private readonly _buttonGroups = new Map<ActionType, IButton>();
    
    private _currFocusButton: ActionType;

    constructor(
        parentComponent: Component,
        @IComponentService componentService: IComponentService,
        @IContextMenuService private readonly contextMenuService: IContextMenuService,
    ) {
        super(ComponentType.ActionBar, parentComponent, null, componentService);
        
        this._currFocusButton = ActionType.NONE;

    }

    protected override _createContent(): void {
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'action-button-container';
        this.container.appendChild(this.contentArea);

        [
            {id: ActionType.EXPLORER, src: 'file'},
            {id: ActionType.OUTLINE, src: 'list'},
            {id: ActionType.SEARCH, src: 'search'},
            {id: ActionType.GIT, src: 'git'},
        ]
        .forEach(({ id, src }) => {
            const button = new Button(id, this.contentArea!);
            button.setClass(['button', 'action-button']);
            button.setImage(getSvgPathByName(SvgType.base, src));
            button.setImageClass(['vertical-center', 'filter-black']);

            this._buttonGroups.set(id, button);
        });
    }

    protected override _registerListeners(): void {
        
        /**
         * @readonly register context menu listeners (right click menu) // review
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

        // default with openning explorer view
        this.actionButtonClick(ActionType.EXPLORER);
    }

    /**
     * @description Clicks a given button. 
     * @param buttonType Specify which button to be clicked.
     */
    public actionButtonClick(buttonType: ActionType): void {
        const button = this._buttonGroups.get(buttonType)!;
        
        // none of action button is focused, open the action view
        if (this._currFocusButton == ActionType.NONE) {
            this._currFocusButton = buttonType;
            button.element.classList.add('action-button-focus');
        } 
        
        // if the current focused button is clicked again, close action view.
        else if (this._currFocusButton == buttonType) {
            this._currFocusButton = ActionType.NONE;
            button.element.classList.remove('action-button-focus');
        } 
        
        // other action button is clicked, only change the style
        else {
            const prevButton = this._buttonGroups.get(this._currFocusButton)!;
            prevButton.element.classList.remove('action-button-focus');
            this._currFocusButton = buttonType;
            button.element.classList.add('action-button-focus');
        }
    }

    public getButton(type: ActionType): IButton | undefined {
        return this._buttonGroups.get(type);
    }

}