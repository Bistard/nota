import { IDashboardSubView, IDashboardSubViewOpts } from "src/workbench/services/dashboard/dashboardSubView";
import { Disposable } from "src/base/common/dispose";
import { addDisposableListener } from "src/base/browser/basic/dom";
import { DashboardSlider } from "src/workbench/services/dashboard/dashboardSlider";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

export class Type2SubView extends Disposable implements IDashboardSubView {

    // [fields]

    public id: string = 'type2';
    private _subViewContainer: HTMLElement;
    private _slider: DashboardSlider;

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        private opts: IDashboardSubViewOpts
    ) {
        super();
        this.opts = opts;
        this._subViewContainer = document.createElement("div");
        this._subViewContainer.classList.add("type2-subview");
        this._subViewContainer.setAttribute("data-id", this.opts.id);
        this._slider = new DashboardSlider(
            instantiationService,
            this.__createSliderItems(this.opts.content || [])
        );
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

        // Add slider to the subview container
        const sliderElement = this._slider.createView();
        this._subViewContainer.appendChild(sliderElement);

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

    private __createSliderItems(content: string[]): HTMLElement[] {
        return content.map((itemText) => {
            const itemElement = document.createElement("div");
            itemElement.textContent = itemText;
            itemElement.classList.add("slider-item");
            return itemElement;
        });
    }
}
