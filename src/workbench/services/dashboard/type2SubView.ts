import { IDashboardSubView, IDashboardSubViewOpts } from "src/workbench/services/dashboard/dashboardSubView";
import { Disposable } from "src/base/common/dispose";
import { addDisposableListener } from "src/base/browser/basic/dom";

export class Type2SubView extends Disposable implements IDashboardSubView {

    // [fields]

    public id: string = 'type2';
    private _subViewContainer: HTMLElement;

    // [constructor]

    constructor(
        private opts: IDashboardSubViewOpts
    ) {
        super();
        this._subViewContainer = document.createElement("div");
        this._subViewContainer.classList.add("type2-subview");
        this._subViewContainer.setAttribute("data-id", this.opts.id);
    }

    // [public methods]

    public render(): HTMLElement {
        this._subViewContainer.innerHTML = "";

        const header = document.createElement("div");
        header.classList.add("section-header");

        // Title for the section
        const title = document.createElement("h2");
        title.textContent = this.opts.title || "Default Title";
        header.appendChild(title);

        // Add dropdown to the header
        const sortDropdown = this.__createSortDropdown();
        header.appendChild(sortDropdown);

        this._subViewContainer.appendChild(header);

        // Create the content items
        const contentContainer = document.createElement("div");
        contentContainer.classList.add("content-container");
        this.opts.content?.forEach(itemText => {
            const itemElement = document.createElement("div");
            itemElement.textContent = itemText;
            itemElement.classList.add("content-item");
            contentContainer.appendChild(itemElement);
        });

        this._subViewContainer.appendChild(contentContainer);

        return this._subViewContainer;
    }

    public registerListeners(): void {
        if (this.isDisposed()) {
            return;
        }
    }

    // [protected methods]

    public override dispose(): void {
        super.dispose();
        this._subViewContainer.remove();
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

        this.__register(addDisposableListener(sortDropdown, "click", () => {
            console.log("Sort dropdown clicked");
        }));

        return sortDropdown;
    }
}
