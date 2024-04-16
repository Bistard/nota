import 'src/workbench/parts/workspace/titleBar/media/titleBar.scss';
import { Component } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { SearchBar } from 'src/base/browser/basic/searchbar/searchbar';
import { Icons } from 'src/base/browser/icon/icons';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { IProductService } from 'src/platform/product/common/productService';
import { ILogService } from 'src/base/common/logger';

/**
 * @class NavSearchBar stores and handles all the navSearchBar and functionBar 
 * relevant business. 
 */
export class NavSearchBar extends Component {

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IThemeService themeService: IThemeService,
        @IProductService private readonly productService: IProductService,
        @ILogService logService: ILogService,
    ) {
        super('nav-search-bar', null, themeService, componentService, logService);
    }

    protected override _createContent(): void {

        // utility bar
        const utilityBar = this.__createUtilityBar();
        this.element.appendChild(utilityBar);

    }

    protected override _registerListeners(): void {

    }

    // [private helper methods]

    private __createUtilityBar(): HTMLElement {
        const utilityBar = document.createElement('div');
        utilityBar.className = 'utility-bar';

        // search bar
        const searchBar = new SearchBar({
            icon: Icons.Search,
            placeHolder: this.productService.profile.applicationName,
        });
        searchBar.render(document.createElement('div'));
        utilityBar.appendChild(searchBar.element);

        return utilityBar;
    }
}
