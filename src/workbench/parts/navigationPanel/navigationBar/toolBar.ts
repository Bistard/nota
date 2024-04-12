import 'src/workbench/parts/navigationPanel/navigationBar/media/toolBar.scss';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IToolButtonOptions, ToolButton } from 'src/workbench/parts/navigationPanel/navigationBar/toolBarButton';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Orientation } from 'src/base/browser/basic/dom';
import { Emitter, Priority, Register } from 'src/base/common/event';
import { ILogService } from 'src/base/common/logger';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { IQuickAccessBarService, QuickAccessBar } from 'src/workbench/parts/navigationPanel/navigationBar/quickAccessBar';
import { ActionBar, IActionBarService } from 'src/workbench/parts/navigationPanel/navigationBar/actionBar';
import { Icons } from 'src/base/browser/icon/icons';

export const IToolBarService = createService<IToolBarService>('tool-bar-service');

export const enum ToolButtonType {
    NONE = 'none',
    LOGO = 'logo',

    EXPLORER = 'explorer',
    OUTLINE = 'outline',
    SEARCH = 'search',
    GIT = 'git',

    HELPER = 'helper',
    SETTINGS = 'setting',
}

export interface IToolBarButtonClickEvent {

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
 * An interface only for {@link ToolBar}.
 */
export interface IToolBarService extends IComponent, IService {

    /**
     * Events fired when the button is clicked.
     */
    readonly onDidClick: Register<IToolBarButtonClickEvent>;

    /**
     * @description Returns a button by provided a button ID.
     * @param ID The ID of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getButton(ID: string): ToolButton | undefined;

    /**
     * @description Returns a primary button by provided a button ID.
     * @param ID The ID of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getPrimaryButton(ID: string): ToolButton | undefined;

    /**
     * @description Register a new primary button.
     * @param opts The options to construct the button.
     * @returns A boolean indicates if the button has created.
     */
    registerPrimaryButton(opts: IToolButtonOptions): boolean;
}

/**
 * @class ToolBar provides access to each view and handles the state 
 * transition between each button and display corresponding view.
 */
export class ToolBar extends Component implements IToolBarService {

    declare _serviceMarker: undefined;

    // [field]

    public static readonly HEIGHT = 100;

    // This flag toggles between ActionBar and FilterBar
    private _toggleState: boolean = false;  /** ONLY FOR TEST PRUPOSES */

    private readonly _primary: WidgetBar<ToolButton>;

    private _currButtonType: string = ToolButtonType.NONE;

    private readonly _onDidClick = this.__register(new Emitter<IToolBarButtonClickEvent>());
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        @IQuickAccessBarService private readonly quickAccessBarService: IQuickAccessBarService,
        @IActionBarService private readonly actionBarService: IActionBarService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService private readonly logService: ILogService,
    ) {
        super('tool-bar', null, themeService, componentService);
        this._primary = new WidgetBar(undefined, { orientation: Orientation.Horizontal });
    }

    // [public method]

    public getButton(ID: string): ToolButton | undefined {
        return this.getPrimaryButton(ID);
    }

    public getPrimaryButton(ID: string): ToolButton | undefined {
        return this._primary.getItem(ID);
    }

    public registerPrimaryButton(opts: IToolButtonOptions): boolean {
        return this.__registerButton(opts, this._primary);
    }

    // [protected override method]

    protected override _createContent(): void {

        // Register buttons along with future development
        // Now registered one in layout.ts - EXPLORE folder icon

        const partConfigurations = [
            { 
                component: this.quickAccessBarService,
                minimumSize: QuickAccessBar.HEIGHT,
                maximumSize: QuickAccessBar.HEIGHT,
                initSize: QuickAccessBar.HEIGHT,
                priority: Priority.Normal,
            },
            { 
                component: this.actionBarService,
                minimumSize: ActionBar.HEIGHT,
                maximumSize: Number.MAX_VALUE, //
                initSize: ActionBar.HEIGHT,
                priority: Priority.Normal,
            },
        ];
        this.assembleComponents(Orientation.Vertical, partConfigurations); 
    }

    protected override _registerListeners(): void {

        // Register all the buttons click event.
        this._primary.items().forEach(item => {
            item.onDidClick(() => this.__buttonClick(item.id));
        });

        // default with opening explorer view
        this.__buttonClick(ToolButtonType.EXPLORER);
    }

    // [private helper method]

    /**
     * @description Invoked when the button is clicked.
     * @param clickedType The ID of button is clicked.
     * 
     * @note Method will fire `this._onDidClick`.
     */
    private __buttonClick(buttonType: string): void {

        /** ONLY FOR `ACTION BAR` TEST PRUPOSES */

        // const event: IToolBarButtonClickEvent = {
        //     ID: buttonType,
        //     prevType: this._currButtonType,
        //     isPrimary: false
        // };
        
        // // Determine which bar to delegate to based on the clicked button
        // if (buttonType === ToolButtonType.LOGO) {
        //     // Toggle the state and call the appropriate handle function
        //     this._toggleState = !this._toggleState;
        //     if (this._toggleState) {
        //         // If the toggle state is true, then it corresponds to the FilterBar
        //         // this._filterBar.handleButtonClick(event);
        //     } else {
        //         // If the toggle state is false, then it corresponds to the ActionBar
        //         this._actionBar.handleButtonClick(event);
        //     }
        // }

        // Update the current button type
        // this._currButtonType = buttonType;

        /** ONLY FOR TEST PRUPOSES */

        const button = this.getButton(buttonType)!;
        const previousType = this._currButtonType;

        // has not been rendered yet.
        if (!button || button.element === undefined) {
            return;
        }

        // none of button is focused, focus the button.
        if (this._currButtonType === ToolButtonType.NONE) {
            this._currButtonType = buttonType;
            button.element.classList.add('focus');
        }

        // if the current focused button is clicked again, remove focus.
        else if (this._currButtonType === buttonType) {
            this._currButtonType = ToolButtonType.NONE;
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

    private __registerButton(opts: IToolButtonOptions, widgetBar: WidgetBar<ToolButton>): boolean {
        const button = new ToolButton(opts);

        if (widgetBar.hasItem(opts.id)) {
            this.logService.warn('ToolBarService', `Cannot register the tool bar button with duplicate ID.`, { ID: opts.id });
            return false;
        }

        widgetBar.addItem({
            id: opts.id,
            item: button,
            dispose: button.dispose,
        });

        return true;
    }
}