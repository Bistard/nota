import 'src/workbench/parts/navigationPanel/navigationBar/quickAccessBar/media/quickAccessBar.scss';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { ILogService } from 'src/base/common/logger';
import { SearchBar } from 'src/base/browser/basic/searchbar/searchbar';
import { Icons } from 'src/base/browser/icon/icons';
import { Button } from 'src/base/browser/basic/button/button';
import { OPERATING_SYSTEM, Platform } from 'src/base/common/platform';
import { MacWindowBar } from 'src/workbench/parts/navigationPanel/navigationBar/quickAccessBar/macWindowBar';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';

export const IQuickAccessBarService = createService<IQuickAccessBarService>('quick-access-bar-service');

export interface IQuickAccessBarService extends IComponent, IService {
    /**
     * Retrieves the search bar component.
     * 
     * @returns The search bar component, or undefined if it doesn't exist.
     */
    getSearchBar(): SearchBar | undefined;
}

export class QuickAccessBar extends Component implements IQuickAccessBarService {
    
    declare _serviceMarker: undefined;
    public static readonly HEIGHT = 40;

    private _searchBar?: SearchBar;
    private _macWindowBar?: MacWindowBar;
    private _menuButton?: Button;

    constructor(
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('quick-access-bar', null, themeService, componentService, logService);
        this._createContent();
    }

    public getSearchBar(): SearchBar | undefined {
        return this._searchBar;
    }

    protected override _createContent(): void {
        if (OPERATING_SYSTEM === Platform.Mac) {
            this._macWindowBar = this.__register(this.instantiationService.createInstance(MacWindowBar));
            this.element.appendChild(this._macWindowBar.element);
        } 
        else {
            this._menuButton = this.__register(this.__createMenuButton());
            this.element.appendChild(this._menuButton.element);
        }

        const searchBar = this.__createSearchBar();
        this.element.appendChild(searchBar);
    }

    protected override _registerListeners(): void {}

    private __createMenuButton(): Button {
        const button = new Button({
            id: 'menu', icon: Icons.Menu, classes: ['menu-button']
        });
        button.render(document.createElement('div'));
        return button;
    }

    private __createSearchBar(): HTMLElement {
        const utilityBar = document.createElement('div');
        utilityBar.className = 'quick-access-search-bar';

        if (OPERATING_SYSTEM === Platform.Mac) {
            utilityBar.classList.add('macos');
        }

        this._searchBar = this.__register(new SearchBar({
            icon: Icons.Search, placeHolder: "search for anything ..."
        }));
        this._searchBar.render(document.createElement('div'));
        utilityBar.appendChild(this._searchBar.element);
        return utilityBar;
    }
}