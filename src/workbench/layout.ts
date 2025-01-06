import { CollapseState, DirectionX, DomUtility, EventType, Orientation, addDisposableListener } from "src/base/browser/basic/dom";
import { Component, IAssembleComponentOpts } from "src/workbench/services/component/component";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { ExplorerView } from "src/workbench/contrib/explorer/explorer";
import { IContextMenuService } from "src/workbench/services/contextMenu/contextMenuService";
import { ILayoutService } from "src/workbench/services/layout/layoutService";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { INavigationBarService } from "src/workbench/parts/navigationPanel/navigationBar/navigationBar";
import { INavigationViewService} from "src/workbench/parts/navigationPanel/navigationView/navigationView";
import { INavigationPanelService, NavigationPanel} from "src/workbench/parts/navigationPanel/navigationPanel";
import { IFunctionBarService } from "src/workbench/parts/navigationPanel/functionBar/functionBar";
import { IDimension } from "src/base/common/utilities/size";
import { assert } from "src/base/common/utilities/panic";
import { Disposable } from "src/base/common/dispose";
import { ToggleCollapseButton } from "src/base/browser/secondary/toggleCollapseButton/toggleCollapseButton";
import { Priority } from "src/base/common/event";
import { ISplitView } from "src/base/browser/secondary/splitView/splitView";
import { IActionBarService } from "src/workbench/parts/navigationPanel/navigationBar/toolBar/actionBar";
import { FastElement } from "src/base/browser/basic/fastElement";
import { IWorkspaceService } from "src/workbench/parts/workspace/workspaceService";

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
        instantiationService: IInstantiationService,
        @ILayoutService protected readonly layoutService: ILayoutService,
        @INavigationBarService protected readonly navigationBarService: INavigationBarService,
        @IActionBarService protected readonly actionBarService: IActionBarService,
        @IFunctionBarService protected readonly functionBarService: IFunctionBarService,
        @INavigationViewService protected readonly navigationViewService: INavigationViewService,
        @INavigationPanelService protected readonly navigationPanelService: INavigationPanelService,
        @IWorkspaceService protected readonly workspaceService: IWorkspaceService,
        @IConfigurationService protected readonly configurationService: IConfigurationService,
        @IContextMenuService protected readonly contextMenuService: IContextMenuService,
    ) {
        super('workbench', layoutService.parentContainer, instantiationService);
        this._collapseController = new CollapseAnimationController(
            CollapseState.Expand, 
            this.element,
            () => assert(this._splitView),
            () => assert(this.dimension),
        );
    }

    // [public methods]

    get collapseState(): CollapseState {
        return this._collapseController.state;
    }

    get isCollapseAnimating(): boolean {
        return this._collapseController.isAnimating;
    }

    public override layout(): IDimension {
        /**
         * This line of code make sure the workbench will fit the whole window 
         * during window resizing.
         */
        DomUtility.Modifiers.setFastPosition(this.element, 0, 0, 0, 0, 'relative');

        /**
         * hack: When the `left` is collapsed, we return -1 value to prevent the 
         * {@link SplitView} to re-layout. Otherwise the width of the `right` will 
         * be re corrected to the original width.
         */
        const collapsed = this._collapseController.state === CollapseState.Collapse;
        const mockDimension = collapsed ? { height: -1, width: -1 } : undefined;

        const dimension = super.layout(undefined, undefined, undefined, mockDimension);
        return mockDimension ?? dimension;
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
        
        this._collapseController.render(this.workspaceService.element.raw);
    }

    protected __registerLayoutListeners(): void {

        /**
         * Listens to each ActionBar button click events and notifies the 
         * navigationView to switch the view.
         */
        this.__register(this.actionBarService.onDidClick(e => {
            this.navigationViewService.switchView(e.currButtonID);
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

    private readonly _getLayoutSplitView: () => ISplitView;
    private readonly _getCurrentDimension: () => IDimension;
    
    private readonly _container: FastElement<HTMLElement>;
    private readonly _button: ToggleCollapseButton;
    
    private _animating: boolean;

    // [event]

    get onDidCollapseStateChange() { return this._button.onDidCollapseStateChange; }

    // [constructor]

    constructor(
        initState: CollapseState,
        element: FastElement<HTMLElement>,
        retrieveSplitView: () => ISplitView,
        getCurrentDimension: () => IDimension,
    ) {
        super();
        this._getLayoutSplitView = retrieveSplitView;
        this._getCurrentDimension = getCurrentDimension;
        this._animating = false;
        this._container = element;
        this._container.toggleClassName('collapsed', initState === CollapseState.Collapse);

        this._button = new ToggleCollapseButton({
            initState: initState,
            positionX: {
                position: DirectionX.Left,
                offset: 12,
            },
            direction: DirectionX.Left,
        });
    }

    // [getter]

    get state(): CollapseState {
        return this._button.state;
    }

    get isAnimating(): boolean {
        return this._animating;
    }

    // [public methods]

    public render(container: HTMLElement): void {
        this._button.render(container);
    }

    public registerListeners(): void {

        // manage collapse/expand animation
        this.__register(this.onDidCollapseStateChange(state => {
            const splitView = this._getLayoutSplitView();
            const left  = assert(splitView.getViewBy('navigation-panel')).getContainer();
            const right = assert(splitView.getViewBy('workspace')).getContainer();
            
            this._container.toggleClassName('collapsed', state === CollapseState.Collapse);
            const transitionTime = '0.3s';

            if (state === CollapseState.Collapse) {
                // opacity changes
                left.style.transition = `opacity ${transitionTime} ease`;
                left.style.opacity = `0`;

                // position changes
                right.style.transition = `left ${transitionTime} ease, width ${transitionTime} ease`;
                right.style.left = '0px';
                right.style.width = `100%`;
            } else {
                left.style.opacity = `1`;
                right.style.left = `${left.offsetWidth}px`;
                right.style.width = `calc(100% - ${left.offsetWidth}px)`;
            }
            
            // maintain the animation period
            this._animating = true;
            const listen = addDisposableListener(right, EventType.transitionend, e => {
                if (e.target === right && e.propertyName === 'width') {
                    
                    // remove the animation after it finishes
                    if (state === CollapseState.Expand) {
                        left.style.transition = '';
                        right.style.transition = '';
                    }

                    listen.dispose();
                    this._animating = false;
                }
            });
        }));

        /**
         * When the window has been resized during the `left` is collapsed, the 
         * {@link SplitView}'s internal dimension will be out-of-date, we need
         * to update it when the `left` is expanded again.
         */
        this.__register(this.onDidCollapseStateChange(state => {
            if (state === CollapseState.Expand) {
                const splitView = this._getLayoutSplitView();
                const dimension = this._getCurrentDimension();
                splitView.layout(dimension.width, dimension.height);
            }
        }));
    }
}