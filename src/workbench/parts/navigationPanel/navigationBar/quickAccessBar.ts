import 'src/workbench/parts/navigationPanel/navigationBar/media/navigationBar.scss';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { NavigationButton } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBarButton';
import { NavigationButtonType } from 'src/workbench/parts/navigationPanel/navigationBar/navigationBar';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { ILogService } from 'src/base/common/logger';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { SearchBar } from 'src/base/browser/basic/searchbar/searchbar';
import { Icons } from 'src/base/browser/icon/icons';
import { IProductService } from 'src/platform/product/common/productService';
import { SearchReply } from 'redis';

export const IQuickAccessBarService = createService<IQuickAccessBarService>('quick-access-bar-service');
export interface IQuickAccessBarService extends IComponent, IService {

}
export class QuickAccessBar extends Component {

    // [fields]

    public static readonly HEIGHT = 40;
    private searchBar!: SearchBar;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IThemeService themeService: IThemeService,
        @IProductService private readonly productService: IProductService,
        @ILogService logService: ILogService,
    ) {
        super('quick-access-bar', null, themeService, componentService, logService);
    }

    public registerButtons(): void {
        
    }

    public search(text: string): void {
        this.searchBar.setText(text);
    }

    // [protected override method]
    
    protected override _createContent(): void {
        const logo = this.__createLogo();
        this.element.appendChild(logo.element);
        const searchBar = this.__createSearchBar();
        this.element.appendChild(searchBar);
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

    private __createSearchBar(): HTMLElement {
        const utilityBar = document.createElement('div');
        utilityBar.className = 'quick-access-search-bar';
        this.searchBar = new SearchBar({
            icon: Icons.Search,
            placeHolder: this.productService.profile.applicationName,
        });
        this.searchBar.render(document.createElement('div'));
        utilityBar.appendChild(this.searchBar.element);
        return utilityBar;
    }
}
