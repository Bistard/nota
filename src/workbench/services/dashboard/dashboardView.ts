import "src/workbench/services/dashboard/media/dashboard.scss";
import { Priority } from "src/base/common/event";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { Component } from "src/workbench/services/component/component";
import { Type1SubView } from "src/workbench/services/dashboard/type1SubView";
import { Type2SubView } from "src/workbench/services/dashboard/type2SubView";
import { IDashboardSubView } from "src/workbench/services/dashboard/dashboardSubView";

export interface IDashboardViewOpts {
    /**
     * The unique identifier of the dashboard view.
     */
    id: string;

    /**
     * When adding/removing view, the view with higher priority will show at top
     * first.
     * @default Priority.Low
     */
    priority?: Priority;

    subViews?: IDashboardSubView[];
}

export class DashboardView extends Component {
    private subViews: IDashboardSubView[] = [];

    constructor(
        private opts: IDashboardViewOpts,
        @IInstantiationService instantiationService: IInstantiationService
    ) {
        super("dashboard-view", null, instantiationService);
    }

    public createView(): HTMLElement {
        const container = document.createElement("div");
        container.classList.add("dashboard-view");

        // Create SubViews for each section
        this.subViews = this.createSubViews();

        this.subViews.forEach((subView) => {
            container.appendChild(subView.render(container)); // Render and append subviews
        });

        return container;
    }

    protected override _createContent(): void {
        const viewElement = this.createView();
        this.element.appendChild(viewElement);
    }

    protected override _registerListeners(): void {
        // No listeners required in this class
    }

    private createSubViews(): IDashboardSubView[] {
        const subViews: IDashboardSubView[] = [];

        // Add the welcome section (Type1)
        subViews.push(new Type1SubView({
            id: 'type1',
            title: 'Welcome to the Dashboard'
        }));

        // Add other sections (Type2)
        subViews.push(new Type2SubView({
            id: 'type2',
            title: 'Pinned Notes',
            content: ["Pinned Note 1", "Pinned Note 2"]
        }));

        subViews.push(new Type2SubView({
            id: 'type3',
            title: 'Recent Items',
            content: ["Recent Item 1", "Recent Item 2"]
        }));

        subViews.push(new Type2SubView({
            id: 'type4',
            title: "What's New",
            content: ["New Feature 1", "New Feature 2"]
        }));

        return subViews;
    }
}
