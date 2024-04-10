import 'src/workbench/parts/navigationPanel/navigationBar/media/toolBar.scss';
import { ILogService } from 'src/base/common/logger';
import { ToolButton, IToolButtonOptions } from 'src/workbench/parts/navigationPanel/navigationBar/toolBarButton';
import { IToolBarService, IToolBarButtonClickEvent } from 'src/workbench/parts/navigationPanel/navigationBar/toolBar';
import { Component } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Emitter } from 'src/base/common/event';
import { Orientation } from 'src/base/browser/basic/dom';

export class ActionBar extends Component implements IToolBarService {
    protected override _registerListeners(): void {

    }
    private _widgetBar: WidgetBar<ToolButton>;

    private readonly _primary: WidgetBar<ToolButton>;

    // Emitter for button clicks
    private readonly _onDidClick = new Emitter<IToolBarButtonClickEvent>();

    constructor(@IComponentService componentService: IComponentService,
                @IThemeService themeService: IThemeService,
                @ILogService private readonly logService: ILogService) {
        super('action-bar', null, themeService, componentService);

        this._widgetBar = new WidgetBar(undefined, { orientation: Orientation.Horizontal });
        this._primary = new WidgetBar(undefined, { orientation: Orientation.Horizontal });
    }

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
    }

    declare _serviceMarker: undefined;

    public get onDidClick() {
        return this._onDidClick.registerListener;
    }

    protected override _createContent(): void {
        const actionBarContainer = document.createElement('div');
        // actionBarContainer.className = 'action-bar-container'; // TODO: Rename class
        actionBarContainer.className = 'general-button-container';
        this._widgetBar.render(actionBarContainer);
        this.element.appendChild(actionBarContainer);

        this._widgetBar.items().forEach(item => {
            item.onDidClick(() => this.handleButtonClick(item.id));
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

    private handleButtonClick(buttonId: string): void {

    }
}
