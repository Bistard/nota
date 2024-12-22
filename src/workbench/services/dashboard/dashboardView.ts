import "src/workbench/services/dashboard/media/dashboard.scss";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { Component } from "src/workbench/services/component/component";
import { Type1SubView } from "src/workbench/services/dashboard/type1SubView";
import { Type2SubView } from "src/workbench/services/dashboard/type2SubView";
import { IDashboardSubView, IDashboardSubViewOpts } from "src/workbench/services/dashboard/dashboardSubView";
import { Priority } from "src/base/common/event";
import { panic } from "src/base/common/utilities/panic";

export interface IDashboardViewOpts {
    subViews?: IDashboardSubViewOpts[];
}

export class DashboardView extends Component {

    constructor(
        private opts: IDashboardViewOpts,
        @IInstantiationService instantiationService: IInstantiationService
    ) {
        super("dashboard-view", null, instantiationService);
    }

    public createView(): HTMLElement {
        const container = document.createElement("div");
        container.classList.add("dashboard-view");

        this.createSubViews()
            .sort((a, b) => (a.priority || Priority.Low) - (b.priority || Priority.Low))
            .forEach((subView) => {
                container.appendChild(subView.render(container));
                this.__register(subView);
            });

        return container;
    }

    protected override _createContent(): void {
        const viewElement = this.createView();
        this.element.appendChild(viewElement);
    }

    protected override _registerListeners(): void {}

    private createSubViews(): IDashboardSubView[] {
        const subViewOptions = this.opts.subViews || [];
        return subViewOptions.map((opts) => {
            switch (opts.id) {
                case 'type1':
                    return new Type1SubView(opts);
                case 'type2':
                    return new Type2SubView(this.instantiationService, opts);
                default:
                    panic(`Unsupported subview type: ${opts.id}`);
            }
        });
    }
}
