import 'src/workbench/parts/navigationPanel/navigationBar/media/navigationBar.scss';
import { INavigationButtonOptions, NavigationButton } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBarButton';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { INavigationBarButtonClickEvent, NavigationButtonType } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBar';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { Emitter, Register } from 'src/base/common/event';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { ILogService } from 'src/base/common/logger';
import { Orientation } from 'src/base/browser/basic/dom';

export const IFunctionBarService = createService<IFunctionBarService>('function-bar-service');

/**
 * An interface only for {@link FunctionBar}.
 */
export interface IFunctionBarService extends IComponent, IService {

    /**
     * Events fired when the button is clicked.
     */
    readonly onDidClick: Register<INavigationBarButtonClickEvent>;

    /**
     * @description Returns a button by provided a button ID.
     * @param ID The ID of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getButton(ID: string): NavigationButton | undefined;

    /**
     * @description Returns a secondary button by provided a button ID.
     * @param ID The ID of the required button.
     * @returns The required button. Returns undefined if it does not exists.
     */
    getSecondaryButton(ID: string): NavigationButton | undefined;

    /**
     * @description Register a new secondary button.
     * @param opts The options to construct the button.
     * @returns A boolean indicates if the button has created.
     */
    registerSecondaryButton(opts: INavigationButtonOptions): boolean;
}

export class FunctionBar extends Component implements IFunctionBarService {
    
    declare _serviceMarker: undefined;

    // [field]
    
    public static readonly HEIGHT = 40;
    private _currButtonType: string = NavigationButtonType.NONE;
    private readonly _secondary: WidgetBar<NavigationButton>;
    
    // [event]
    
    private readonly _onDidClick = this.__register(new Emitter<INavigationBarButtonClickEvent>());
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('function-bar', null, themeService, componentService, logService);
        this._secondary = new WidgetBar(undefined, { orientation: Orientation.Horizontal });
    }
    
    // [public method]

    public getButton(ID: string): NavigationButton | undefined {
        return this.getSecondaryButton(ID);
    }
    public getSecondaryButton(ID: string): NavigationButton | undefined {
        return this._secondary.getItem(ID);
    }
    public registerSecondaryButton(opts: INavigationButtonOptions): boolean {
        return this.__registerButton(opts, this._secondary);
    }

    // [protected override method]

    protected override _createContent(): void {

        // lower button group
        const secondaryContainer = document.createElement('div');
        secondaryContainer.className = 'secondary-button-container';
        this._secondary.render(secondaryContainer);

        this.element.appendChild(secondaryContainer);

        this.__register(this._secondary);
    }

    protected override _registerListeners(): void {
        this._secondary.items().forEach(item => {
            item.onDidClick(() => this.__buttonClick(item.id));
        });
        this.__buttonClick(NavigationButtonType.EXPLORER);
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

        // Check if button is undefined and log an error or return early
        if (!button) {
            this.logService.error('FunctionBar', `Button with ID ${buttonType} not found.`);
            return;
        }

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
            this.logService.warn('FunctionBarService', `Cannot register the function bar button with duplicate ID.`, { ID: opts.id });
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
