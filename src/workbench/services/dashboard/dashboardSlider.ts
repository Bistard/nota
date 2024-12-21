import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { Component } from "src/workbench/services/component/component";

export class DashboardSlider extends Component {

    private items: HTMLElement[];

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        items: HTMLElement[],
    ) {
        super('dashboard-slider', null, instantiationService);
        this.items = items;
    }

    public createView(): HTMLElement {
        const sliderContainer = document.createElement('div');
        sliderContainer.classList.add('slider');

        this.items.forEach(item => {
            const itemContainer = document.createElement('div');
            itemContainer.classList.add('slider-item');
            itemContainer.appendChild(item);
            sliderContainer.appendChild(itemContainer);
        });

        // Add smooth scrolling
        sliderContainer.style.scrollBehavior = 'smooth';

        return sliderContainer;
    }

    protected override _createContent(): void {
        const viewElement = this.createView();
        this.element.appendChild(viewElement);
    }

    protected override _registerListeners(): void {
        // Additional listeners (if needed)
    }
}
