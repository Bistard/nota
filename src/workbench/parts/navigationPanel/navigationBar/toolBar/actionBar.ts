import 'src/workbench/parts/navigationPanel/navigationBar/toolBar/media/actionBar.scss';
import { ILogService } from 'src/base/common/logger';
import { NavigationButton } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBarButton';
import { INavigationBarButtonClickEvent } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBar';
import { Component } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Emitter } from 'src/base/common/event';
import { Orientation } from 'src/base/browser/basic/dom';
import { Icons } from 'src/base/browser/icon/icons';

export class ActionBar extends Component {

    declare _serviceMarker: undefined;

    // [field]

    public static readonly HEIGHT = 60;

    public readonly _primary: WidgetBar<NavigationButton>;
    
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
        this._primary = new WidgetBar(undefined, { orientation: Orientation.Horizontal });
    }

    // [public method]

    // [protected override method]

    protected override _createContent(): void {
        const actionBarContainer = document.createElement('div');
        actionBarContainer.className = 'main-action-bar';
        this._primary.render(actionBarContainer);
        this.element.appendChild(actionBarContainer);
        this.__register(this._primary);
    }

    protected override _registerListeners(): void {

    }
}