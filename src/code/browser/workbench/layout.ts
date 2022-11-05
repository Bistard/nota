import { ISashEvent, Sash } from "src/base/browser/basic/sash/sash";
import { addDisposableListener, DomUtility, EventType, Orientation, requestAnimate } from "src/base/browser/basic/dom";
import { IComponentService } from "src/code/browser/service/component/componentService";
import { IThemeService } from "src/code/browser/service/theme/themeService";
import { ActionBarComponent, IActionBarService } from "src/code/browser/workbench/actionBar/actionBar";
import { ActionViewComponent, IActionViewService } from "src/code/browser/workbench/actionView/actionView";
import { Component, ComponentType, IComponent } from "src/code/browser/service/component/component";
import { IWorkspaceService } from "src/code/browser/workbench/workspace/workspace";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { ISplitView, ISplitViewOpts, SplitView } from "src/base/browser/secondary/splitView/splitView";
import { Priority } from "src/base/common/event";

/**
 * @description A base class for Workbench to create and manage the behaviour of
 * each sub-component.
 */
export abstract class WorkbenchLayout extends Component {

    // [fields]

    private _splitView: ISplitView | undefined;

    // [constructor]
    
    constructor(
        parent: HTMLElement,
        protected readonly instantiationService: IInstantiationService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @IActionBarService private readonly actionBarService: IActionBarService,
        @IActionViewService private readonly actionViewService: IActionViewService,
        @IWorkspaceService private readonly workspaceService: IWorkspaceService,
    ) {
        super(ComponentType.Workbench, parent, themeService, componentService);
    }

    // [protected methods]

    public override layout(): void {
        if (this.isDisposed() || !this.parent) {
            return;
        }
        DomUtility.setFastPosition(this.element, 0, 0, 0, 0, 'relative');
        super.layout(undefined, undefined);
    }

    // [protected helper methods]

    protected __createLayout(): void {
        
        const splitViewContainer = document.createElement('div');
        splitViewContainer.className = 'split-view';
        const splitViewOpt: ISplitViewOpts = {
            orientation: Orientation.Horizontal,
            viewOpts: [],
        };

        // Constructs each component of the workbench.
        const configurations: [IComponent, number, number, number, Priority][] = [
            [this.actionBarService , ActionBarComponent.WIDTH , ActionBarComponent.WIDTH     , ActionBarComponent.WIDTH , Priority.Low   ],
            [this.actionViewService, 100                      , ActionViewComponent.WIDTH * 2, ActionViewComponent.WIDTH, Priority.Normal],
            [this.workspaceService , 0                        , Number.POSITIVE_INFINITY     , 0                        , Priority.High  ],
        ]
        for (const [component, minSize, maxSize, initSize, priority] of configurations) {
            component.create(this, splitViewContainer);
            component.registerListeners();
            splitViewOpt.viewOpts!.push({
                element: component.element.element, 
                minimumSize: minSize,
                maximumSize: maxSize,
                initSize: initSize,
                priority: priority,
            });
        };

        // construct the split-view
        this._splitView = new SplitView(this.element.element, splitViewOpt);
    }

    protected __registerLayoutListeners(): void {
        
        // window resizing
        this.__register(addDisposableListener(window, EventType.resize, () => {
            this.layout();
            this._splitView?.layout(this.dimension!.width, this.dimension!.height);
        }));

        /**
         * Listens to each ActionBar button click events and notifies the 
         * actionView to swtich the view.
         */
        this.actionBarService.onDidClick(e => {
            this.actionViewService.setActionView(e.type);
        });
    }

    // [private helper functions]

}