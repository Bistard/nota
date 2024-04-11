import 'src/workbench/parts/navigationPanel/navigationBar/media/toolBar.scss';
import { ILogService } from 'src/base/common/logger';
import { ToolButton, IToolButtonOptions } from 'src/workbench/parts/navigationPanel/navigationBar/toolBarButton';
import { IToolBarService, IToolBarButtonClickEvent, ToolButtonType } from 'src/workbench/parts/navigationPanel/navigationBar/toolBar';
import { Component } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Emitter } from 'src/base/common/event';
import { Orientation } from 'src/base/browser/basic/dom';

export class ActionBar extends Component implements IToolBarService {

    declare _serviceMarker: undefined;

    // [field]

    private readonly _primary: WidgetBar<ToolButton>;
    private _currButtonType: string = ToolButtonType.NONE;
    private readonly _onDidClick = new Emitter<IToolBarButtonClickEvent>();
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(@IComponentService componentService: IComponentService,
                @IThemeService themeService: IThemeService,
                @ILogService private readonly logService: ILogService) {
        super('action-bar', null, themeService, componentService);
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

    public render(container: HTMLElement): void {
        this._createContent();
        container.appendChild(this.element.element);
    }

    // [protected override method]

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
        this.__buttonClick(ToolButtonType.EXPLORER);
    }

    // [private helper method]

    private __buttonClick(buttonType: string): void {

        const button = this.getButton(buttonType)!;
        const previousType = this._currButtonType;

        // has not been rendered yet.
        if (button.element === undefined) {
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
