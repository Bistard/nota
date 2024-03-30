import 'src/workbench/parts/navigationPanel/navigationBar/media/quickAccessBar.scss';
import { SearchBar } from 'src/base/browser/basic/searchbar/searchbar';
import { Component } from 'src/workbench/services/component/component';
import { ToolBar, IToolBarButtonClickEvent, ToolButtonType } from './toolBar';
import { QuickAccessBar } from 'src/workbench/parts/navigationPanel/navigationBar/quickAccessBar';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { ILogService } from 'src/base/common/logger';

export class NavigationBar extends Component {

    // private readonly _quickAccessBar: QuickAccessBar;
    // private readonly _toolBar: ToolBar;

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService private readonly logService: ILogService,
    ) {
        super('function-bar', null, themeService, componentService);
        // this._quickAccessBar = new QuickAccessBar();
        // this._toolBar = new ToolBar();
    }

    protected override _createContent(): void {
        // const quickAccessContainer = document.createElement('div');
        // quickAccessContainer.className = 'quick-access-container';
        // this._quickAccessBar.render(quickAccessContainer);

        // const toolBarContainer = document.createElement('div');
        // toolBarContainer.className = 'tool-bar-container';
        // this._toolBar.render(toolBarContainer);

        // this.element.appendChild(quickAccessContainer);
        // this.element.appendChild(toolBarContainer);
    }

    protected override _registerListeners(): void {
        
    }
}