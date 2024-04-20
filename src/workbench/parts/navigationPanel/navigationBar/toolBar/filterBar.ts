import 'src/workbench/parts/navigationPanel/navigationBar/toolBar/media/filterBar.scss';
import { Component } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { createService } from 'src/platform/instantiation/common/decorator';
import { ILogService } from 'src/base/common/logger';
import { NavigationButton } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBarButton';
import { INavigationBarButtonClickEvent, INavigationBarService, NavigationButtonType } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBar';
import { Emitter} from 'src/base/common/event';

export const IFilterBarService = createService<IFilterBarService>('filter-bar-service');

export interface IFilterBarService extends INavigationBarService {
}

export class FilterBar extends Component implements IFilterBarService {

    // [filed]

    declare _serviceMarker: undefined;
    
    // [event]

    private readonly _onDidClick = this.__register(new Emitter<INavigationBarButtonClickEvent>());
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('filter-bar', null, themeService, componentService, logService);
    }

    // [public method]

    // [protected override method]

    protected override _createContent(): void {
        const logo = this.__createLogo(); // TODO: test, delete later
        this.element.appendChild(logo.element);
    }

    protected override _registerListeners(): void {
        
    }

    // [private method]

    // TODO: test, delete later
    private __createLogo(): NavigationButton {
        const logo = new NavigationButton({ id: NavigationButtonType.LOGO, isPrimary: true, classes: ['logo'] });
        logo.render(document.createElement('div'));
        
        const text = document.createElement('div');
        text.innerText = 'N';
        logo.element.appendChild(text);
        
        return logo;
    }
}
