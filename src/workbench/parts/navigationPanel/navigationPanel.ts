// import 'src/workbench/parts/workspace/media/workspace.scss';
import { IComponentService } from "src/workbench/services/component/componentService";
import { Component, IComponent } from "src/workbench/services/component/component";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { IThemeService } from "src/workbench/services/theme/themeService";
import { ISplitView, ISplitViewOpts, SplitView } from "src/base/browser/secondary/splitView/splitView";
import { Priority } from "src/base/common/event";
import { DomUtility, Orientation } from "src/base/browser/basic/dom";
import { assert } from "src/base/common/utilities/panic";

import { INavigationViewService, NavView } from "src/workbench/parts/navigationPanel/navigationView/navigationView";
import { IToolBarService, ToolBar } from "src/workbench/parts/navigationPanel/navigationBar/toolBar";

export const INavigationPanelService = createService<INavigationPanelService>('navigation-panel-service');

export interface INavigationPanelService extends IComponent, IService {

}

export class NavigationPanel extends Component implements INavigationPanelService {

    declare _serviceMarker: undefined;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @INavigationViewService protected readonly navigationViewService: INavigationViewService,
        @IToolBarService protected readonly toolBarService: IToolBarService,

        @IThemeService themeService: IThemeService,
    ) {
        super('navigation-panel', null, themeService, componentService);
    }

    // [protected override methods]

    protected override _createContent(): void {
        this.__assemblyParts();
    }

    protected override _registerListeners(): void {
        // Register any listeners needed for the navigation panel
    }

    // [private helper methods]

    private __assemblyParts(): void {
        const splitViewOpt: Required<ISplitViewOpts> = {
            orientation: Orientation.Vertical,
            viewOpts: [],
        };

        const PartsConfiguration = [
            [this.toolBarService, ToolBar.WIDTH, ToolBar.WIDTH, ToolBar.WIDTH, Priority.Low],
            [this.navigationViewService, NavView.WIDTH * 2, NavView.WIDTH, NavView.WIDTH, Priority.Normal],
        ] as const;

        for (const [component, minSize, maxSize, initSize, priority] of PartsConfiguration) {
            component.create(this);
            component.registerListeners();
            
            splitViewOpt.viewOpts.push({
                element: component.element.element,
                minimumSize: minSize,
                maximumSize: maxSize,
                initSize: initSize,
                priority: priority,
            });
        }

        // construct the split-view
        const splitView = new SplitView(this.element.element, splitViewOpt);

        // set the sash next to sideBar is visible and disabled.
        const sash = assert(splitView.getSashAt(0));
        sash.enable = false;
        sash.visible = true;
        sash.size = 1;
    }
}
