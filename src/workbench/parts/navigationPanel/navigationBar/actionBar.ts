import 'src/workbench/parts/navigationPanel/navigationBar/media/navigationBar.scss';
import { ILogService } from 'src/base/common/logger';
import { NavigationButton, INavigationButtonOptions } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBarButton';
import { INavigationBarButtonClickEvent, NavigationButtonType } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBar';
import { Component } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Emitter } from 'src/base/common/event';
import { Orientation } from 'src/base/browser/basic/dom';
import { INavigationBarService } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBar';
import { createService } from 'src/platform/instantiation/common/decorator';

export const IActionBarService = createService<IActionBarService>('action-bar-service');

export interface IActionBarService extends INavigationBarService {  
    /**
     * @description Returns a button by provided a button ID.
     * @param ID The ID of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getButton(ID: string): NavigationButton | undefined;

    /**
     * @description Returns a primary button by provided a button ID.
     * @param ID The ID of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getPrimaryButton(ID: string): NavigationButton | undefined;

    /**
     * @description Register a new primary button.
     * @param opts The options to construct the button.
     * @returns A boolean indicates if the button has created.
     */
    registerPrimaryButton(opts: INavigationButtonOptions): boolean;  
}

export class ActionBar extends Component implements IActionBarService {

    declare _serviceMarker: undefined;

    // [field]
    public static readonly HEIGHT = 60;

    /** ONLY FOR TEST PRUPOSES */
    // This flag toggles between ActionBar and FilterBar
    private _toggleState: boolean = false;

    private readonly _primary: WidgetBar<NavigationButton>;
    private _currButtonType: string = NavigationButtonType.NONE;
    private readonly _onDidClick = new Emitter<INavigationBarButtonClickEvent>();
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('action-bar', null, themeService, componentService, logService);
        this._primary = new WidgetBar(undefined, { orientation: Orientation.Vertical }); // Make it horizontal
    }

    // [public method]

    public getButton(ID: string): NavigationButton | undefined {
        return this.getPrimaryButton(ID);
    }

    public getPrimaryButton(ID: string): NavigationButton | undefined {
        return this._primary.getItem(ID);
    }

    public registerPrimaryButton(opts: INavigationButtonOptions): boolean {
        return this.__registerButton(opts, this._primary);
    }

    public render(container: HTMLElement): void {
        this._createContent();
        container.appendChild(this.element.element);
    }

    // [protected override method]

    // actionBar.create()

    protected override _createContent(): void {
        const actionBarContainer = document.createElement('div');
        actionBarContainer.className = 'main-action-bar';
        this._primary.render(actionBarContainer);
        this.element.appendChild(actionBarContainer);
        this.__register(this._primary);
    }

    protected override _registerListeners(): void {

        // Register all the buttons click event.
        this._primary.items().forEach(item => {
            item.onDidClick(() => this.__buttonClick(item.id));
        });

        // default with opening explorer view
        this.__buttonClick(NavigationButtonType.EXPLORER);
    }

    // [private helper method]

    private __buttonClick(buttonType: string): void {

         /** ONLY FOR `ACTION BAR` TEST PRUPOSES */

        // const event: INavigationBarButtonClickEvent = {
        //     ID: buttonType,
        //     prevType: this._currButtonType,
        //     isPrimary: false
        // };
        
        // // Determine which bar to delegate to based on the clicked button
        // if (buttonType === NavigationButtonType.LOGO) {
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
        if (button.element === undefined) {
            return;
        }

        // none of button is focused, focus the button.
        if (this._currButtonType === NavigationButtonType.NONE) {
            this._currButtonType = buttonType;
            button.element.classList.add('focus');
        }

        // if the current focused button is clicked again, remove focus.
        else if (this._currButtonType === buttonType) {
            this._currButtonType = NavigationButtonType.NONE;
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

    private __registerButton(opts: INavigationButtonOptions, widgetBar: WidgetBar<NavigationButton>): boolean {
        const button = new NavigationButton(opts);

        if (widgetBar.hasItem(opts.id)) {
            this.logService.warn('ActionBarService', `Cannot register the action bar button with duplicate ID.`, { ID: opts.id });
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
