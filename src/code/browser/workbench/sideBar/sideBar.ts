import { Component, IComponent } from 'src/code/browser/service/component/component';
import { createService } from 'src/code/platform/instantiation/common/decorator';
import { IComponentService } from 'src/code/browser/service/component/componentService';
import { SideButton } from 'src/code/browser/workbench/sideBar/sideBarButton';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Orientation } from 'src/base/browser/basic/dom';
import { Icons } from 'src/base/browser/icon/icons';
import { Emitter, Register } from 'src/base/common/event';
import { IThemeService } from 'src/code/browser/service/theme/themeService';
import { Mutable } from 'src/base/common/util/type';

export const ISideBarService = createService<ISideBarService>('side-bar-service');

export const enum SideType {
    NONE = 'none',
    LOGO = 'logo',

    EXPLORER = 'explorer',
    OUTLINE = 'outline',
    SEARCH = 'search',
    GIT = 'git',

    HELPER = 'helper',
    SETTINGS = 'setting',
}

export interface ISideBarButtonClickEvent {
    
    /**
     * The type of button is clicked.
     */
    readonly type: SideType;

    /**
     * The previous type of button was clicked.
     */
    readonly prevType: SideType;
}

/**
 * An interface only for {@link SideBar}.
 */
export interface ISideBarService extends IComponent {
    
    /**
     * Events fired when the button is clicked.
     */
    readonly onDidClick: Register<ISideBarButtonClickEvent>;

    /**
     * @description Returns a button by provided a buttion type.
     * @param type The type of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getButton(type: SideType): SideButton | undefined;

}

/** @deprecated */
export interface ISideBarOptions {
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
 * @class SideBar provides access to each view and handles the state 
 * transition between each button and display coressponding view.
 */
export class SideBar extends Component implements ISideBarService {

    // [field]

    public static readonly WIDTH = 50;

    private readonly _logoButton!: SideButton;
    private readonly _generalGroup!: WidgetBar<SideButton>;
    private readonly _secondaryGroup!: WidgetBar<SideButton>;

    private _currButtonType = SideType.NONE;

    private readonly _onDidClick = this.__register(new Emitter<ISideBarButtonClickEvent>());
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
    ) {
        super('side-bar', null, themeService, componentService);
    }

    // [public method]

    public getButton(type: SideType): SideButton | undefined {
        return this._generalGroup.getItem(type);
    }

    // [protected override method]

    protected override _createContent(): void {
        
        // logo
        const logo = this.__createLogo();
        
        // upper button group
        const container1 = document.createElement('div');
        container1.className = 'general-button-container';
        (<Mutable<WidgetBar<SideButton>>>this._generalGroup) = this.__createGeneralButtonGroup(container1);
        

        // lower button group
        const container2 = document.createElement('div');
        container2.className = 'secondary-button-container';
        (<Mutable<WidgetBar<SideButton>>>this._secondaryGroup) = this.__createSecondaryButtonGroup(container2);

        this.element.appendChild(logo.element);
        this.element.appendChild(container1);
        this.element.appendChild(container2);

        this.__register(this._generalGroup);
        this.__register(this._secondaryGroup);
    }

    protected override _registerListeners(): void {
        
        /**
         * Register all the buttons click event.
         */
        this._generalGroup.items().forEach(item => {
            item.onDidClick(() => {
                this.__buttonClick(item.type);
            });
        })
        
        // default with opening explorer view
        this.__buttonClick(SideType.EXPLORER);
    }

    // [private helper method]

    /**
     * @description Invoked when the button is clicked.
     * @param clickedType The type of buttion is clicked.
     * 
     * @note Method will fire `this._onDidClick`.
     */
    private __buttonClick(buttonType: SideType): void {

        const button = this.getButton(buttonType)!;
        let previousType = this._currButtonType;

        // has not been rendered yet.
        if (button.element === undefined) {
            return;
        }
        
        // none of button is focused, focus the button.
        if (this._currButtonType === SideType.NONE) {
            this._currButtonType = buttonType;
            button.element.classList.add('focus');
        } 
        
        // if the current focused button is clicked again, remove focus.
        else if (this._currButtonType === buttonType) {
            this._currButtonType = SideType.NONE;
            button.element.classList.remove('focus');
        } 
        
        // other button is clicked, focus the new button.
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

    private __createLogo(): SideButton {
        const logo = new SideButton(SideType.LOGO, { classes: ['logo'] });
        logo.render(document.createElement('div'));

        const text = document.createElement('div');
        text.innerText = 'N';
        logo.element.appendChild(text);

        return logo;
    }

    private __createGeneralButtonGroup(container: HTMLElement): WidgetBar<SideButton> {
        
        const widgetBar = new WidgetBar<SideButton>(container, {
            orientation: Orientation.Vertical,
            render: true,
        });

        [
            {type: SideType.EXPLORER, icon: Icons.Folder},
            {type: SideType.OUTLINE, icon: Icons.List},
            {type: SideType.SEARCH, icon: Icons.Search},
            {type: SideType.GIT, icon: Icons.CodeBranch},
        ]
        .forEach(({ type, icon }) => {
            const button = new SideButton(type, { icon: icon });
            widgetBar.addItem({
                id: type, 
                item: button,
                dispose: button.dispose,
            });
        });

        return widgetBar;
    }

    private __createSecondaryButtonGroup(container: HTMLElement): WidgetBar<SideButton> {
        const widgetBar = new WidgetBar<SideButton>(container, {
            orientation: Orientation.Vertical,
            render: true,
        });

        [
            {type: SideType.HELPER, icon: Icons.CommentQuestion},
            {type: SideType.SETTINGS, icon: Icons.Settings},
        ]
        .forEach(({ type, icon }) => {
            const button = new SideButton(type, {icon: icon});
            widgetBar.addItem({
                id: type, 
                item: button,
                dispose: button.dispose,
            });
        });

        return widgetBar;
    }
}