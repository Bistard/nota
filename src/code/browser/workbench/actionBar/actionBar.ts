import { Component, ComponentType, IComponent } from 'src/code/browser/service/component/component';
import { createService } from 'src/code/platform/instantiation/common/decorator';
import { IComponentService } from 'src/code/browser/service/component/componentService';
import { ActionButton } from 'src/code/browser/workbench/actionBar/actionButton';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Orientation } from 'src/base/browser/basic/dom';
import { Icons } from 'src/base/browser/icon/icons';
import { Emitter, Register } from 'src/base/common/event';
import { IThemeService } from 'src/code/browser/service/theme/themeService';
import { Mutable } from 'src/base/common/util/type';

export const IActionBarService = createService<IActionBarService>('action-bar-service');

export const enum ActionType {
    NONE = 'none',
    LOGO = 'logo',

    EXPLORER = 'explorer',
    OUTLINE = 'outline',
    SEARCH = 'search',
    GIT = 'git',

    HELPER = 'helper',
    SETTINGS = 'setting',
}

export interface IActionBarButtonClickEvent {
    
    /**
     * The type of button is clicked.
     */
    readonly type: ActionType;

    /**
     * The previous type of button was clicked.
     */
    readonly prevType: ActionType;
}

/**
 * An interface only for {@link ActionBarComponent}.
 */
export interface IActionBarService extends IComponent {
    
    /**
     * Events fired when the button is clicked.
     */
    readonly onDidClick: Register<IActionBarButtonClickEvent>;

    /**
     * @description Returns a button by provided a buttion type.
     * @param type The type of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getButton(type: ActionType): ActionButton | undefined;

}

/** @deprecated */
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

    public static readonly WIDTH = 50;

    private readonly _logoButton!: ActionButton;
    private readonly _generalGroup!: WidgetBar<ActionButton>;
    private readonly _secondaryGroup!: WidgetBar<ActionButton>;

    private _currButtonType = ActionType.NONE;

    private readonly _onDidClick = this.__register(new Emitter<IActionBarButtonClickEvent>());
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
    ) {
        super(ComponentType.ActionBar, null, themeService, componentService);
    }

    // [public method]

    public getButton(type: ActionType): ActionButton | undefined {
        return this._generalGroup.getItem(type);
    }

    // [protected override method]

    protected override _createContent(): void {
        
        // logo
        const logo = this.__createLogo();
        
        // upper button group
        const container1 = document.createElement('div');
        container1.className = 'general-button-container';
        (<Mutable<WidgetBar<ActionButton>>>this._generalGroup) = this.__createGeneralButtonGroup(container1);
        

        // lower button group
        const container2 = document.createElement('div');
        container2.className = 'secondary-button-container';
        (<Mutable<WidgetBar<ActionButton>>>this._secondaryGroup) = this.__createSecondaryButtonGroup(container2);

        this.element.appendChild(logo.element);
        this.element.appendChild(container1);
        this.element.appendChild(container2);

        this.__register(this._generalGroup);
        this.__register(this._secondaryGroup);
    }

    protected override _registerListeners(): void {
        
        /**
         * Register all the action buttons click event.
         */
        this._generalGroup.items().forEach(item => {
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
     * @note Method will fire `this._onDidClick`.
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
            button.element.classList.add('focus');
        } 
        
        // if the current focused button is clicked again, remove focus.
        else if (this._currButtonType === buttonType) {
            this._currButtonType = ActionType.NONE;
            button.element.classList.remove('focus');
        } 
        
        // other action button is clicked, focus the new button.
        else {
            const prevButton = this.getButton(this._currButtonType)!;
            prevButton.element!.classList.remove('focus');
            
            this._currButtonType = buttonType;
            button.element.classList.add('focus');
        }

        // fires event
        this._onDidClick.fire({
            type: buttonType,
            prevType: previousType
        });
    }

    private __createLogo(): ActionButton {
        const logo = new ActionButton(ActionType.LOGO, { classes: ['logo'] });
        logo.render(document.createElement('div'));

        const text = document.createElement('div');
        text.innerText = 'N';
        logo.element.appendChild(text);

        return logo;
    }

    private __createGeneralButtonGroup(container: HTMLElement): WidgetBar<ActionButton> {
        
        const widgetBar = new WidgetBar<ActionButton>(container, {
            orientation: Orientation.Vertical
        });

        [
            {type: ActionType.EXPLORER, icon: Icons.Folder},
            {type: ActionType.OUTLINE, icon: Icons.List},
            {type: ActionType.SEARCH, icon: Icons.Search},
            {type: ActionType.GIT, icon: Icons.CodeBranch},
        ]
        .forEach(({ type, icon }) => {
            const button = new ActionButton(type, { icon: icon });
            widgetBar.addItem({
                id: type, 
                item: button,
                dispose: button.dispose,
            });
        });

        return widgetBar;
    }

    private __createSecondaryButtonGroup(container: HTMLElement): WidgetBar<ActionButton> {
        const widgetBar = new WidgetBar<ActionButton>(container, {
            orientation: Orientation.Vertical
        });

        [
            {type: ActionType.HELPER, icon: Icons.CommentQuestion},
            {type: ActionType.SETTINGS, icon: Icons.Settings},
        ]
        .forEach(({ type, icon }) => {
            const button = new ActionButton(type, {icon: icon});
            widgetBar.addItem({
                id: type, 
                item: button,
                dispose: button.dispose,
            });
        });

        return widgetBar;
    }
}