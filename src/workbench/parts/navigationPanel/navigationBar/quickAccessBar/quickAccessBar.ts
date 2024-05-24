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
import { IHostService } from 'src/platform/host/common/hostService';
import { MacWindowBar } from 'src/workbench/parts/navigationPanel/navigationBar/quickAccessBar/macWindowBar';

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
    private macWindowBar?: MacWindowBar;

    constructor(
        @IHostService private readonly hostService: IHostService,
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
            this.macWindowBar = new MacWindowBar(this.componentService, this.hostService, this.themeService, this.logService);
            this.element.appendChild(this.macWindowBar.element);
        } else {
            const buttonContainer = this.__createOutlineButton().element;
            this.element.appendChild(buttonContainer);
        }

        const searchBar = this.__createSearchBar();
        this.element.appendChild(searchBar);
    }

    protected override _registerListeners(): void {
        
    }

    private __createOutlineButton(): Button {
        const outlineButton = new Button({
            id: 'menu', icon: Icons.Menu, classes: ['menu-button']
        });
        outlineButton.render(document.createElement('div'));
        return outlineButton;
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