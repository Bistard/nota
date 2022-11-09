import { Component } from 'src/code/browser/service/component/component';
import { WindowBar } from 'src/code/browser/workbench/workspace/titleBar/windowBar';
import { IComponentService } from 'src/code/browser/service/component/componentService';
import { IInstantiationService } from 'src/code/platform/instantiation/common/instantiation';
import { IThemeService } from 'src/code/browser/service/theme/themeService';
import { SearchBar } from 'src/base/browser/basic/searchbar/searchbar';
import { Icons } from 'src/base/browser/icon/icons';

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
            icon: Icons.Search,
            emptyText: 'nota',
        });
        searchBar.render(document.createElement('div'));
        utilityBar.appendChild(searchBar.element);

        return utilityBar;
    }
}
