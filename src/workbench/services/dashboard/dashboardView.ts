import "src/workbench/services/dashboard/media/dashboard.scss";
import { Priority } from "src/base/common/event";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { Component } from "src/workbench/services/component/component";
import { DashboardSubView } from "src/workbench/services/dashboard/dashboardSubView";

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

    /**
     * An array of content items (e.g., strings or identifiers) to be displayed within the view.
     * Each item represents a sinågle content block to be rendered in the dashboard subview.
     * @optional
     */
    content?: string[];

    /**
     * The title for a dashboard view (especially used in subviews)
     */
    title?: string;
}

export class DashboardView extends Component {

    // [fields]

    private subViews: DashboardSubView[] = [];

    // [constructor]

    constructor(
        opts: IDashboardViewOpts,
        @IInstantiationService instantiationService: IInstantiationService
    ) {
        super('dashboard-view', null, instantiationService);
    }

    // [public methods]

    public createView(): HTMLElement {
        const container = document.createElement("div");
        container.classList.add("dashboard-view");

        // Create SubViews for each section
        const sections: IDashboardViewOpts[] = [
            {
                id: "welcome-section",
                priority: Priority.High,
                title: "Hello,"
            },
            {
                id: "pinned-notes",
                priority: Priority.High,
                title: "Pinned",
                content: this.generatePlaceholderItems("Pinned"),
            },
            {
                id: "recent-items",
                priority: Priority.Normal,
                title: "Recent",
                content: this.generatePlaceholderItems("Recent"),
            },
            {
                id: "new-features",
                priority: Priority.Low,
                title: "New Features",
                content: this.generatePlaceholderItems("New Features"),
            },
        ];

        sections.forEach((sectionOpts) => {
            if (sectionOpts.id === "welcome-section") {
                // TODO: prepare some welcome sentences
                const welcomeSection = this.createWelcomeSection(sectionOpts.title || "Hello, user!");
                container.appendChild(welcomeSection);
            } else {
                // Create other subviews
                const subView = new DashboardSubView(
                    this.instantiationService,
                    sectionOpts
                );
                container.appendChild(subView.render()); // Append the rendered subview to the container
                this.subViews.push(subView); // Store for future use
            }
        });

        return container;
    }

    protected override _createContent(): void {
        const viewElement = this.createView();
        this.element.appendChild(viewElement);
    }

    protected override _registerListeners(): void {

    }

    // [private methods]
    private createWelcomeSection(title: string): HTMLElement {
        const welcomeSection = document.createElement("div");
        welcomeSection.classList.add("welcome-section");
        welcomeSection.innerHTML = `
            <h1>${title}</h1>
            <button class="new-note-btn">+ New Note</button>
        `;
        return welcomeSection;
    }

    private generatePlaceholderItems(sectionId: string): string[] {
        const items: string[] = [];
        for (let i = 1; i <= 10; i++) {
            items.push(`${sectionId} Item ${i}`);
        }
        return items;
    }
}
