import 'src/workbench/parts/workspace/titleBar/media/titleBar.scss';
import { Component } from 'src/workbench/services/component/component';
import { WindowBar } from 'src/workbench/parts/workspace/titleBar/windowBar';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { SearchBar } from 'src/base/browser/basic/searchbar/searchbar';
import { Icons } from 'src/base/browser/icon/icons';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { IProductService } from 'src/platform/product/common/productService';

/**
 * @class TitleBar stores and handles all the titleBar and functionBar 
 * relevant business. 
 */
export class TitleBar extends Component {

    private windowBar!: WindowBar;

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IThemeService themeService: IThemeService,
        @IProductService private readonly productService: IProductService,
    ) {
        super('title-bar', null, themeService, componentService);
    }

    protected override _createContent(): void {

        // utility bar
        const utilityBar = this.__createUtilityBar();
        this.element.appendChild(utilityBar);

        // window bar
        this.windowBar = this.instantiationService.createInstance(WindowBar);
        this.windowBar.create(this);
    }

    protected override _registerListeners(): void {

        // component registration
        this.windowBar.registerListeners();
    }

    // [private helper methods]

    private __createUtilityBar(): HTMLElement {
        const utilityBar = document.createElement('div');
        utilityBar.className = 'utility-bar';

        // search bar
        const searchBar = new SearchBar({
            icon: Icons.Help,
            placeHolder: this.productService.profile.applicationName,
        });
        searchBar.render(document.createElement('div'));
        utilityBar.appendChild(searchBar.element);

        return utilityBar;
    }
}
