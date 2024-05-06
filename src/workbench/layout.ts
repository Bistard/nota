import { CollapseState, DirectionX, DomUtility, EventType, Orientation, addDisposableListener } from "src/base/browser/basic/dom";
import { IComponentService } from "src/workbench/services/component/componentService";
import { Component, IAssembleComponentOpts } from "src/workbench/services/component/component";
import { IWorkspaceService } from "src/workbench/parts/workspace/workspace";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { ExplorerView } from "src/workbench/contrib/explorer/explorer";
import { IContextMenuService } from "src/workbench/services/contextMenu/contextMenuService";
import { ILayoutService } from "src/workbench/services/layout/layoutService";
import { IThemeService } from "src/workbench/services/theme/themeService";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { ILogService } from "src/base/common/logger";
import { INavigationBarService } from "src/workbench/parts/navigationPanel/navigationBar/navigationBar";
import { INavigationViewService} from "src/workbench/parts/navigationPanel/navigationView/navigationView";
import { INavigationPanelService, NavigationPanel} from "src/workbench/parts/navigationPanel/navigationPanel";
import { IFunctionBarService } from "src/workbench/parts/navigationPanel/functionBar/functionBar";
import { IDimension } from "src/base/common/utilities/size";
import { IToolBarService } from "src/workbench/parts/navigationPanel/navigationBar/toolBar/toolBar";
import { assert } from "src/base/common/utilities/panic";
import { Disposable } from "src/base/common/dispose";
import { ToggleCollapseButton } from "src/base/browser/secondary/toggleCollapseButton/toggleCollapseButton";
import { Priority } from "src/base/common/event";
import { ISplitView } from "src/base/browser/secondary/splitView/splitView";

/**
 * @description A base class for Workbench to create and manage the behavior of
 * each sub-component.
 */
export abstract class WorkbenchLayout extends Component {

    // [fields]

    private readonly _collapseController: CollapseAnimationController;

    // [event]

    get onDidCollapseStateChange() { return this._collapseController.onDidCollapseStateChange; }

    // [constructor]

    constructor(
        protected readonly instantiationService: IInstantiationService,
        @ILogService logService: ILogService,
        @ILayoutService protected readonly layoutService: ILayoutService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @INavigationBarService protected readonly navigationBarService: INavigationBarService,
        @IToolBarService protected readonly toolBarService: IToolBarService,
        @IFunctionBarService protected readonly functionBarService: IFunctionBarService,
        @INavigationViewService protected readonly navigationViewService: INavigationViewService,
        @INavigationPanelService protected readonly navigationPanelService: INavigationPanelService,
        @IWorkspaceService protected readonly workspaceService: IWorkspaceService,
        @IConfigurationService protected readonly configurationService: IConfigurationService,
        @IContextMenuService protected readonly contextMenuService: IContextMenuService,
    ) {
        super('workbench', layoutService.parentContainer, themeService, componentService, logService);
        this._collapseController = new CollapseAnimationController(this, () => assert(this._splitView));
    }

    // [protected methods]

    public override layout(): IDimension {
        /**
         * This line of code make sure the workbench will fit the whole window 
         * during window resizing.
         */
        DomUtility.Modifiers.setFastPosition(this.element, 0, 0, 0, 0, 'relative');
        return super.layout(undefined, undefined);
    }

    // [protected helper methods]

    protected __createLayout(): void {
        this.__registerNavigationViews();

        const workbenchConfigurations: IAssembleComponentOpts[] = [
            { 
                component: this.navigationPanelService,
                minimumSize: NavigationPanel.WIDTH - 100,
                initSize: NavigationPanel.WIDTH,
                maximumSize: NavigationPanel.WIDTH * 2,
            },
            { 
                component: this.workspaceService,
                minimumSize: 0,
                initSize: NavigationPanel.WIDTH,
                maximumSize: null,
                priority: Priority.Normal,
            },
        ];
        this.assembleComponents(Orientation.Horizontal, workbenchConfigurations);
        
        this._collapseController.render(this.workspaceService.element.element);
    }

    protected __registerLayoutListeners(): void {

        // re-layout the entire workbench when the entire window is resizing
        this.__register(addDisposableListener(window, EventType.resize, () => {
            this.layout();
        }));

        /**
         * Listens to each NavigationBar button click events and notifies the 
         * navigationView to switch the view.
         */
        this.__register(this.navigationBarService.onDidClick(e => {
            this.navigationViewService.switchView(e.ID);
        }));

        // enable collapse/expand animation
        this._collapseController.registerListeners();
    }

    // [private helper functions]

    private __registerNavigationViews(): void {
        this.navigationViewService.registerView('explorer', ExplorerView);
        // TODO: other navigation-views are also registered here.
    }
}

/**
 * Decide how the layout should be collapsed and expanded with animation.
 */
class CollapseAnimationController extends Disposable {

    // [fields]

    private readonly layout: WorkbenchLayout;
    private readonly _retrieveSplitView: () => ISplitView;

    private readonly _button: ToggleCollapseButton;

    // [event]

    get onDidCollapseStateChange() { return this._button.onDidCollapseStateChange; }

    // [constructor]

    constructor(
        layout: WorkbenchLayout,
        retrieveSplitView: () => ISplitView,
    ) {
        super();
        this.layout = layout;
        this._retrieveSplitView = retrieveSplitView;

        this._button = new ToggleCollapseButton({
            position: DirectionX.Left,
            positionOffset: 4,
            direction: DirectionX.Left,
        });
    }

    // [public methods]

    public render(container: HTMLElement): void {
        this._button.render(container);
    }

    public registerListeners(): void {

        // manage navigation-panel and workspace collapse/expand animation
        this.__register(this.onDidCollapseStateChange(state => {
            const splitView = this._retrieveSplitView();
            const left  = assert(splitView.getViewBy('navigation-panel')).getContainer();
            const right = assert(splitView.getViewBy('workspace')).getContainer();
            const transitionTime = '0.5s';

            const workbenchWidth = this.layout.element.element.offsetWidth;

            if (state === CollapseState.Collapse) {
                right.style.transition = `left ${transitionTime} ease, width ${transitionTime} ease`;
                right.style.left = '0px';
                right.style.width = `${workbenchWidth}px`;
            } else {
                right.style.left = `${left.offsetWidth}px`;
                right.style.width = `calc(100% - ${left.offsetWidth}px)`;

                // remove the transition animation after it finishes
                const listen = addDisposableListener(right, EventType.transitionend, (e) => {
                    if (e.target === right && e.propertyName === 'width') {
                        right.style.transition = '';
                        listen.dispose();
                    }
                });
            }
        }));
    }
}