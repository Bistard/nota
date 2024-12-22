import { IDashboardSubView, IDashboardSubViewOpts } from "src/workbench/services/dashboard/dashboardSubView";
import { Disposable } from "src/base/common/dispose";

export class Type2SubView extends Disposable implements IDashboardSubView {

    // [fields]

    public id: string = 'type2';

    // [constructor]

    constructor(
        private opts: IDashboardSubViewOpts
    ) {
        super();
    }

    // [public methods]

    public render(): HTMLElement {
        const subViewContainer = document.createElement("div");
        subViewContainer.classList.add("type2-subview");
        subViewContainer.setAttribute("data-id", this.opts.id);

        const header = document.createElement("div");
        header.classList.add("section-header");

        // Title for the section
        const title = document.createElement("h2");
        title.textContent = this.opts.title || "Default Title";
        header.appendChild(title);

        // Add dropdown to the header
        const sortDropdown = this.__createSortDropdown();
        header.appendChild(sortDropdown);

        subViewContainer.appendChild(header);

        // Create the content items
        const contentContainer = document.createElement("div");
        contentContainer.classList.add("content-container");
        this.opts.content?.forEach(itemText => {
            const itemElement = document.createElement("div");
            itemElement.textContent = itemText;
            itemElement.classList.add("content-item");
            contentContainer.appendChild(itemElement);
        });

        subViewContainer.appendChild(contentContainer);
        return subViewContainer;
    }

    public registerListeners(): void {
        if (this.isDisposed()) {
            return;
        }

        // this.__register(addDisposableListener(this._element, EventType.mousedown, e => this.__initDrag(e)));
    }

    // [private methods]

    private __createSortDropdown(): HTMLElement {
        const sortDropdown = document.createElement("div");
        sortDropdown.classList.add("sort-dropdown");

        // Add triangle icon
        const triangleIcon = document.createElement("div");
        triangleIcon.classList.add("triangle-icon");
        sortDropdown.appendChild(triangleIcon);

        // Add text
        const dropdownText = document.createElement("div");
        dropdownText.classList.add("dropdown-text");
        dropdownText.textContent = "Last modified";
        sortDropdown.appendChild(dropdownText);

        return sortDropdown;
    }
}
