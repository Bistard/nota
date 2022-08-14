import { Component, ComponentType, IComponent } from 'src/code/browser/workbench/component';
import { ContextMenuType, Coordinate } from 'src/base/browser/secondary/contextMenu/contextMenu';
import { createDecorator } from 'src/code/platform/instantiation/common/decorator';
import { IContextMenuService } from 'src/code/browser/service/contextMenuService';
import { IComponentService } from 'src/code/browser/service/componentService';
import { ActionButton } from 'src/code/browser/workbench/actionBar/actionButton';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Orientation } from 'src/base/common/dom';
import { Icons } from 'src/base/browser/icon/icons';
import { registerSingleton } from 'src/code/platform/instantiation/common/serviceCollection';
import { ServiceDescriptor } from 'src/code/platform/instantiation/common/descriptor';
import { Emitter, Register } from 'src/base/common/event';

export const IActionBarService = createDecorator<IActionBarService>('action-bar-service');

export const enum ActionType {
    NONE = 'none',
    EXPLORER = 'explorer',
    OUTLINE = 'outline',
    SEARCH = 'search',
    GIT = 'git',
    SETTINGS = 'setting',
}

export interface IActionBarButtonClickEvent {
    
    /**
     * The type of button is clicked.
     */
    type: ActionType;

    /**
     * The previous type of button was clicked.
     */
    prevType: ActionType;

}

export interface IActionBarService extends IComponent {
    
    /**
     * Events fired when the button is clicked.
     */
    onDidButtonClick: Register<IActionBarButtonClickEvent>;

    /**
     * @description Returns a button by provided a buttion type.
     * @param type The type of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getButton(type: ActionType): ActionButton | undefined;

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
 * @class ActionBarComponent provides access to each action view and handles 
 * the state transition between each action button and display coressponding 
 * action view.
 */
export class ActionBarComponent extends Component implements IActionBarService {

    // [field]

    public static readonly width = 50;

    /* Stores all the action buttons. */
    private _widgetBar!: WidgetBar<ActionButton>;

    private _currButtonType = ActionType.NONE;

    private _onDidButtonClick = this.__register(new Emitter<IActionBarButtonClickEvent>());
    public onDidButtonClick = this._onDidButtonClick.registerListener;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IContextMenuService private readonly contextMenuService: IContextMenuService,
    ) {
        super(ComponentType.ActionBar, null, componentService);
    }

    // [public method]

    public getButton(type: ActionType): ActionButton | undefined {
        return this._widgetBar.getItem(type);
    }

    // [protected override method]

    protected override _createContent(): void {
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'action-button-container';
        this.container.appendChild(this.contentArea);

        this._widgetBar = this.__register(this.__createWidgetBar(this.contentArea));
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

        /**
         * Register all the action buttons click event.
         */
        this._widgetBar.items().forEach(item => {
            item.onDidClick(() => {
                this.__actionButtonClick(item.type);
            });
        })
        

        // default with opening explorer view
        this.__actionButtonClick(ActionType.EXPLORER);
    }

    // [private helper method]

    /**
     * @description Invoked when the action button is clicked.
     * @param clickedType The type of buttion is clicked.
     * 
     * @note Method will fire `this._onDidButtonClick`.
     */
    private __actionButtonClick(buttonType: ActionType): void {

        const button = this.getButton(buttonType)!;
        let previousType = this._currButtonType;

        // has not been rendered yet.
        if (button.element === undefined) {
            return;
        }
        
        // none of action button is focused, focus the button.
        if (this._currButtonType === ActionType.NONE) {
            this._currButtonType = buttonType;
            button.element.classList.add('action-button-focus');
        } 
        
        // if the current focused button is clicked again, remove focus.
        else if (this._currButtonType === buttonType) {
            this._currButtonType = ActionType.NONE;
            button.element.classList.remove('action-button-focus');
        } 
        
        // other action button is clicked, focus the new button.
        else {
            const prevButton = this.getButton(this._currButtonType)!;
            prevButton.element!.classList.remove('action-button-focus');
            
            this._currButtonType = buttonType;
            button.element.classList.add('action-button-focus');
        }

        // fires event
        this._onDidButtonClick.fire({
            type: buttonType,
            prevType: previousType
        });
    }

    /**
     * @description A helper method for creating a series of action buttons using
     * {@link WidgetBar}.
     * @param container The container of the widget bar.
     * @returns The created widget bar.
     */
    private __createWidgetBar(container: HTMLElement): WidgetBar<ActionButton> {
        
        // constructs a new widgetBar
        const widgetBar = new WidgetBar<ActionButton>(container, {
            orientation: Orientation.Vertical
        });

        // creates all the action buttons
        [
            {type: ActionType.EXPLORER, icon: Icons.Book},
            {type: ActionType.OUTLINE, icon: Icons.List},
            {type: ActionType.SEARCH, icon: Icons.Search},
            {type: ActionType.GIT, icon: Icons.Share},
        ]
        .forEach(({ type, icon }) => {
            const button = new ActionButton(type, {icon: icon});
            widgetBar.addItem({
                id: type, 
                item: button,
                dispose: button.dispose
            });
        });

        return widgetBar;
    }

}

registerSingleton(IActionBarService, new ServiceDescriptor(ActionBarComponent));