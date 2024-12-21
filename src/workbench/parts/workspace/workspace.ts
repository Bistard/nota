import 'src/workbench/parts/workspace/workspace.scss';
import { Component, IAssembleComponentOpts, IComponent } from "src/workbench/services/component/component";
import { IWindowsTitleBarService, WindowsTitleBar } from "src/workbench/parts/workspace/titleBar/titleBar";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { OPERATING_SYSTEM, Platform } from 'src/base/common/platform';
import { Orientation } from 'src/base/browser/basic/dom';
import { Priority } from 'src/base/common/event';
import { DashboardView } from 'src/workbench/services/dashboard/dashboardView';

export const IWorkspaceService = createService<IWorkspaceService>('workspace-service');

/**
 * An interface only for {@link WorkspaceComponent}.
 */
export interface IWorkspaceService extends IComponent, IService {

}

export class WorkspaceComponent extends Component implements IWorkspaceService {

    declare _serviceMarker: undefined;

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        @IEditorService private readonly editorService: IEditorService,
    ) {
        super('workspace', null, instantiationService);
    }

    // [protected override methods]

    protected override _createContent(): void {
        this.__assembleParts();
    }

    protected override _registerListeners(): void { /** noop */ }
    
    // [private helper methods]

    private __assembleParts(): void {
        const layout: IAssembleComponentOpts[] = [];

        if (OPERATING_SYSTEM === Platform.Windows) {
            const windowsTitleBar = this.instantiationService.createInstance(WindowsTitleBar);
            this.instantiationService.register(IWindowsTitleBarService, windowsTitleBar);
            layout.push({
                component: windowsTitleBar,
                fixed: true,
                fixedSize: WindowsTitleBar.TITLE_BAR_HEIGHT,
            });
        }

        // layout.push({
        //     component: this.editorService,
        //     initSize: null,
        //     maximumSize: null,
        //     minimumSize: null,
        // });
        const dashboardView = this.instantiationService.createInstance(DashboardView, {
            id: 'workspace-dashboard',
            priority: Priority.Low,
            content: ["Pinned Notes", "Recent Items", "What's New"],
        });

        layout.push({
            component: dashboardView,
            initSize: null,
            maximumSize: null,
            minimumSize: null,
        });

        this.assembleComponents(Orientation.Vertical, layout);
    }
}