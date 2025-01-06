import 'src/workbench/parts/navigationPanel/navigationBar/quickAccessBar/media/quickAccessBar.scss';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { SearchBar } from 'src/base/browser/basic/searchbar/searchbar';
import { Icons } from 'src/base/browser/icon/icons';
import { Button } from 'src/base/browser/basic/button/button';
import { OPERATING_SYSTEM, Platform } from 'src/base/common/platform';
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
    
    // [fields]

    declare _serviceMarker: undefined;
    public static readonly HEIGHT = 20;

    private _searchBar?: SearchBar;
    private _menuButton?: Button;

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super('quick-access-bar', null, instantiationService);
    }

    // [public methods]

    public getSearchBar(): SearchBar | undefined {
        return this._searchBar;
    }
    
    // [protected methods]

    protected override __createContent(): void {
        if (OPERATING_SYSTEM !== Platform.Mac) {
            this._menuButton = this.__register(this.__createMenuButton());
            this.element.appendChild(this._menuButton.element);
        }
        const searchBar = this.__createSearchBar();
        this.element.appendChild(searchBar);
    }

    protected override __registerListeners(): void {}

    // [private methods]

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