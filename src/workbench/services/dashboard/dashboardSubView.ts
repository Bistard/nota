import { DashboardSlider } from "./dashboardSlider";
import { Component } from "src/workbench/services/component/component";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

export interface IDashboardSubView {
    readonly id: string;
    render(parentElement: HTMLElement): HTMLElement;
    dispose(): void;
}

export interface IDashboardSubViewOpts {
    id: string;
    title?: string;
    content?: string[]
}

export class DashboardSubView extends Component implements IDashboardSubView {
    private slider: DashboardSlider;
    private opts: IDashboardSubViewOpts;

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        opts: IDashboardSubViewOpts
    ) {
        super("dashboard-subview", null, instantiationService);
        this.opts = opts;
        this.slider = new DashboardSlider(
            instantiationService,
            this.createSliderItems(opts.content || [])
        );
    }

    public render(parentElement: HTMLElement): HTMLElement {
        const subViewContainer = document.createElement("div");
        subViewContainer.classList.add("dashboard-subview");
        subViewContainer.setAttribute("data-id", this.opts.id);

        // Create section header
        const header = document.createElement("div");
        header.classList.add("section-header");

        const title = this.__createSubViewTitle(this.opts.title || "Default Title");
        header.appendChild(title);
        subViewContainer.appendChild(header);

        // Add slider content
        const sliderElement = this.slider.createView();
        subViewContainer.appendChild(sliderElement);

        parentElement.appendChild(subViewContainer);
        return subViewContainer;
    }

    protected override _createContent(): void {
        // Content is already handled in the render method
    }

    protected override _registerListeners(): void {
        // Register event listeners if needed
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
