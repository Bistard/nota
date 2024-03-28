import 'src/workbench/parts/sideBar/media/sideBar.scss';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { ISideButtonOptions, SideButton } from 'src/workbench/parts/sideBar/sideBarButton';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Orientation } from 'src/base/browser/basic/dom';
import { Emitter, Register } from 'src/base/common/event';
import { ILogService } from 'src/base/common/logger';
import { IThemeService } from 'src/workbench/services/theme/themeService';

export const ISideBarService = createService<ISideBarService>('side-bar-service');

export const enum SideButtonType {
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
     * The ID of button is clicked.
     */
    readonly ID: string;

    /**
     * The previous ID of button was clicked.
     */
    readonly prevType: string;

    /**
     * If the button clicked is primary.
     */
    readonly isPrimary: boolean;
}

/**
 * An interface only for {@link SideBar}.
 */
export interface ISideBarService extends IComponent, IService {

    /**
     * Events fired when the button is clicked.
     */
    readonly onDidClick: Register<ISideBarButtonClickEvent>;

    /**
     * @description Returns a button by provided a button ID.
     * @param ID The ID of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getButton(ID: string): SideButton | undefined;

    /**
     * @description Returns a primary button by provided a button ID.
     * @param ID The ID of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getPrimaryButton(ID: string): SideButton | undefined;

    /**
     * @description Returns a secondary button by provided a button ID.
     * @param ID The ID of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getSecondaryButton(ID: string): SideButton | undefined;

    /**
     * @description Register a new primary button.
     * @param opts The options to construct the button.
     * @returns A boolean indicates if the button has created.
     */
    registerPrimaryButton(opts: ISideButtonOptions): boolean;

    /**
     * @description Register a new secondary button.
     * @param opts The options to construct the button.
     * @returns A boolean indicates if the button has created.
     */
    registerSecondaryButton(opts: ISideButtonOptions): boolean;
}

/**
 * @class SideBar provides access to each view and handles the state 
 * transition between each button and display corresponding view.
 */
export class SideBar extends Component implements ISideBarService {

    declare _serviceMarker: undefined;

    // [field]

    public static readonly WIDTH = 50;

    private readonly _logoButton!: SideButton;
    private readonly _primary: WidgetBar<SideButton>;
    private readonly _secondary: WidgetBar<SideButton>;

    private _currButtonType: string = SideButtonType.NONE;

    private readonly _onDidClick = this.__register(new Emitter<ISideBarButtonClickEvent>());
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService private readonly logService: ILogService,
    ) {
        super('side-bar', null, themeService, componentService);
        this._primary = new WidgetBar(undefined, { orientation: Orientation.Vertical });
        this._secondary = new WidgetBar(undefined, { orientation: Orientation.Vertical });
    }

    // [public method]

    public getButton(ID: string): SideButton | undefined {
        return this.getPrimaryButton(ID) || this.getSecondaryButton(ID);
    }

    public getPrimaryButton(ID: string): SideButton | undefined {
        return this._primary.getItem(ID);
    }

    public getSecondaryButton(ID: string): SideButton | undefined {
        return this._secondary.getItem(ID);
    }

    public registerPrimaryButton(opts: ISideButtonOptions): boolean {
        return this.__registerButton(opts, this._primary);
    }

    public registerSecondaryButton(opts: ISideButtonOptions): boolean {
        return this.__registerButton(opts, this._secondary);
    }

    // [protected override method]

    protected override _createContent(): void {

        // logo
        const logo = this.__createLogo();

        // upper button group
        const primaryContainer = document.createElement('div');
        primaryContainer.className = 'general-button-container';
        this._primary.render(primaryContainer);

        // lower button group
        const secondaryContainer = document.createElement('div');
        secondaryContainer.className = 'secondary-button-container';
        this._secondary.render(secondaryContainer);

        this.element.appendChild(logo.element);
        this.element.appendChild(primaryContainer);
        this.element.appendChild(secondaryContainer);

        this.__register(this._primary);
        this.__register(this._secondary);
    }

    protected override _registerListeners(): void {

        // Register all the buttons click event.
        this._primary.items().forEach(item => {
            item.onDidClick(() => this.__buttonClick(item.id));
        });
        this._secondary.items().forEach(item => {
            item.onDidClick(() => this.__buttonClick(item.id));
        });

        // default with opening explorer view
        this.__buttonClick(SideButtonType.EXPLORER);
    }

    // [private helper method]

    /**
     * @description Invoked when the button is clicked.
     * @param clickedType The ID of button is clicked.
     * 
     * @note Method will fire `this._onDidClick`.
     */
    private __buttonClick(buttonType: string): void {

        const button = this.getButton(buttonType)!;
        const previousType = this._currButtonType;

        // has not been rendered yet.
        if (button.element === undefined) {
            return;
        }

        // none of button is focused, focus the button.
        if (this._currButtonType === SideButtonType.NONE) {
            this._currButtonType = buttonType;
            button.element.classList.add('focus');
        }

        // if the current focused button is clicked again, remove focus.
        else if (this._currButtonType === buttonType) {
            this._currButtonType = SideButtonType.NONE;
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
            ID: buttonType,
            prevType: previousType,
            isPrimary: button.isPrimary,
        });
    }

    private __registerButton(opts: ISideButtonOptions, widgetBar: WidgetBar<SideButton>): boolean {
        const button = new SideButton(opts);

        if (widgetBar.hasItem(opts.id)) {
            this.logService.warn('SideBarService', `Cannot register the side bar button with duplicate ID.`, { ID: opts.id });
            return false;
        }

        widgetBar.addItem({
            id: opts.id,
            item: button,
            dispose: button.dispose,
        });

        return true;
    }

    private __createLogo(): SideButton {
        const logo = new SideButton({ id: SideButtonType.LOGO, isPrimary: true, classes: ['logo'] });
        logo.render(document.createElement('div'));

        const text = document.createElement('div');
        text.innerText = 'N';
        logo.element.appendChild(text);

        return logo;
    }
}