import { DashboardSlider } from "./dashboardSlider";
import { Component } from "src/workbench/services/component/component";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IDashboardViewOpts } from "src/workbench/services/dashboard/dashboardView";

export class DashboardSubView extends Component {
    private slider: DashboardSlider;
    private opts: IDashboardViewOpts;

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        opts: IDashboardViewOpts
    ) {
        super("navigation-view", null, instantiationService);
        this.opts = opts;
        this.slider = new DashboardSlider(
            instantiationService,
            this.createSliderItems(opts.content || [])
        );
    }

    public render(): HTMLElement {
        const subViewContainer = document.createElement("div");
        subViewContainer.classList.add("dashboard-subview");
        subViewContainer.setAttribute("data-id", this.opts.id);

        // Create section header
        const header = document.createElement("div");
        header.classList.add("section-header");

        // Append title and dropdown to the header
        const title = this.__createSubViewTitle(this.opts.title || "Default Title");
        const sortDropdown = this.__createSortDropdown();

        header.appendChild(title);
        header.appendChild(sortDropdown);

        // Append header to container
        subViewContainer.appendChild(header);

        // Add slider content
        const sliderElement = this.slider.createView();
        subViewContainer.appendChild(sliderElement);

        return subViewContainer;
    }

    protected override _createContent(): void {
        this.render();
    }

    protected override _registerListeners(): void {
        // Add event listeners here if necessary
    }

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

    private __createSubViewTitle(titleText: string): HTMLElement {
        const title = document.createElement("h2");
        title.textContent = titleText;
        return title;
    }

    private createSliderItems(content: string[]): HTMLElement[] {
        return content.map((itemText) => {
            const itemElement = document.createElement("div");
            itemElement.textContent = itemText;
            itemElement.classList.add("slider-item");
            return itemElement;
        });
    }
}
