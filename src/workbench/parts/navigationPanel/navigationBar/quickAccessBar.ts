import 'src/workbench/parts/navigationPanel/navigationBar/media/navigationBar.scss';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { NavigationButton } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBarButton';
import { NavigationButtonType } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBar';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { ILogService } from 'src/base/common/logger';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { NavSearchBar } from 'src/workbench/parts/navigationPanel/navigationBar/navSearch';

export const IQuickAccessBarService = createService<IQuickAccessBarService>('quick-access-bar-service');
export interface IQuickAccessBarService extends IComponent, IService {

}
export class QuickAccessBar extends Component {

    // [fields]

    public static readonly HEIGHT = 40;
    private searchBarComponent!: NavSearchBar;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('quick-access-bar', null, themeService, componentService, logService);
    }

    public registerButtons(): void {
        
    }

    public search(text: string): void {
        // this.searchBarComponent.setText(text);
    }

    // [protected override method]
    
    protected override _createContent(): void {
        const logo = this.__createLogo();
        this.element.appendChild(logo.element);
        this.__createSearchBar();
    }
    
    protected override _registerListeners(): void {
        
    }

    // [private helper method]
    
    private __createLogo(): NavigationButton {
        const logo = new NavigationButton({ id: NavigationButtonType.LOGO, isPrimary: true, classes: ['logo'] });
        logo.render(document.createElement('div'));
        const text = document.createElement('div');
        text.innerText = 'N';
        logo.element.appendChild(text);
        return logo;
    }

    private __createSearchBar(): void {
        this.searchBarComponent = this.instantiationService.createInstance(NavSearchBar);
        this.searchBarComponent.create(this);
    }
}
