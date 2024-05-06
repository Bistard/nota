import 'src/workbench/parts/navigationPanel/navigationBar/toolBar/media/actionBar.scss';
import { ILogService } from 'src/base/common/logger';
import { INavigationBarButtonClickEvent } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBar';
import { Component } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Emitter } from 'src/base/common/event';
import { Orientation } from 'src/base/browser/basic/dom';
import { Button, IButtonOptions } from 'src/base/browser/basic/button/button';

export class ActionBar extends Component {

    declare _serviceMarker: undefined;

    // [field]

    public static readonly HEIGHT = 60;

    private readonly _buttons: WidgetBar<Button>;
    
    // [event]
    
    private readonly _onDidClick = new Emitter<INavigationBarButtonClickEvent>();
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('action-bar', null, themeService, componentService, logService);
        this._buttons = new WidgetBar(undefined, { orientation: Orientation.Horizontal });
    }

    // [public method]
    public getButton(ID: string): Button | undefined {
        return this.getPrimaryButton(ID);
    }

    public getPrimaryButton(ID: string): Button | undefined {
        return this._buttons.getItem(ID);
    }

    public registerPrimaryButton(opts: IButtonOptions): boolean {
        return this.__registerButton(opts, this._buttons);
    }


    // [protected override method]

    protected override _createContent(): void {
        const actionBarContainer = document.createElement('div');
        actionBarContainer.className = 'main-action-bar';
        this._buttons.render(actionBarContainer);
        this.element.appendChild(actionBarContainer);
        this.__register(this._buttons);
    }

    protected override _registerListeners(): void {

    }

    // [private method]
    private __registerButton(opts: IButtonOptions, widgetBar: WidgetBar<Button>): boolean {
        const button = new Button(opts);

        if (widgetBar.hasItem(opts.id)) {
            this.logService.warn('ActionBarService', `Cannot register the action bar button with duplicate ID.`, { ID: opts.id });
            return false;
        }

        widgetBar.addItem({
            id: opts.id,
            item: button,
            dispose: button.dispose.bind(button),
        });

        return true;
    }
}