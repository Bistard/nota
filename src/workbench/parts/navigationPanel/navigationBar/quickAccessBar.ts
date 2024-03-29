import 'src/workbench/parts/navigationPanel/navigationBar/media/quickAccessBar.scss';
import { SearchBar } from 'src/base/browser/basic/searchbar/searchbar';

export class QuickAccessBar {
    private searchBox: SearchBar;

    constructor(container: HTMLElement) {
        const barContainer = document.createElement('div');
        barContainer.className = 'quick-access-bar';

        // Create search box
        this.searchBox = new SearchBar();
        const searchBoxContainer = document.createElement('div');
        searchBoxContainer.className = 'search-box';
        this.searchBox.render(searchBoxContainer);

        barContainer.appendChild(searchBoxContainer);
        container.appendChild(barContainer);
    }
}
