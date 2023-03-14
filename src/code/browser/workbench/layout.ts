import { addDisposableListener, DomUtility, EventType, Orientation } from "src/base/browser/basic/dom";
import { IComponentService } from "src/code/browser/service/component/componentService";
import { IThemeService } from "src/code/browser/service/theme/themeService";
import { SideBar, ISideBarService, SideButtonType } from "src/code/browser/workbench/parts/sideBar/sideBar";
import { ISideViewService, SideView } from "src/code/browser/workbench/parts/sideView/sideView";
import { Component } from "src/code/browser/service/component/component";
import { IWorkspaceService } from "src/code/browser/workbench/parts/workspace/workspace";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { ISplitView, ISplitViewOpts, SplitView } from "src/base/browser/secondary/splitView/splitView";
import { Priority } from "src/base/common/event";
import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { ExplorerView } from "src/code/browser/workbench/contrib/explorer/explorer";
import { ISplitViewItemOpts } from "src/base/browser/secondary/splitView/splitViewItem";
import { Icons } from "src/base/browser/icon/icons";

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
        @ISideBarService protected readonly sideBarService: ISideBarService,
        @ISideViewService protected readonly sideViewService: ISideViewService,
        @IWorkspaceService protected readonly workspaceService: IWorkspaceService,
        @IConfigService protected readonly configService: IConfigService,
    ) {
        super('workbench', parent, themeService, componentService);

        this.__registerSideViews();
    }

    // [protected methods]

    public override layout(): void {
        if (this.isDisposed() || !this.parent) {
            return;
        }
        DomUtility.Modifiers.setFastPosition(this.element, 0, 0, 0, 0, 'relative');
        super.layout(undefined, undefined);
    }

    // [protected helper methods]

    protected __createLayout(): void {

        // register side buttons
        this.__registerSideBarButtons();

        // combine the workbench layout at the last
        this.__combineWorkbench();
    }

    protected __registerLayoutListeners(): void {
        
        // window resizing
        this.__register(addDisposableListener(window, EventType.resize, () => {
            this.layout();
            this._splitView?.layout(this.dimension!.width, this.dimension!.height);
        }));

        /**
         * Listens to each SideBar button click events and notifies the 
         * sideView to swtich the view.
         */
        this.sideBarService.onDidClick(e => {
            if (e.isPrimary) {
                this.sideViewService.switchView(e.ID);
            }
        });
    }

    // [private helper functions]

    private __registerSideViews(): void {
        this.sideViewService.registerView(SideButtonType.EXPLORER, ExplorerView);
    }

    private __registerSideBarButtons(): void {
        
        /**
         * primary button configurations
         */
        [
            { 
                id: SideButtonType.EXPLORER, 
                icon: Icons.Folder,
            },
            { 
                id: SideButtonType.OUTLINE, 
                icon: Icons.List,
            },
            // { id: SideButtonType.SEARCH, icon: Icons.Search },
            // { id: SideButtonType.GIT, icon: Icons.CodeBranch },
        ]
        .forEach(({ id, icon }) => {
            this.sideBarService.registerPrimaryButton({
                id: id,
                icon: icon,
                isPrimary: true,
            });
        });


        /**
         * secondary button configurations
         */
        [
            { 
                id: SideButtonType.HELPER, 
                icon: Icons.CommentQuestion,
            },
            { 
                id: SideButtonType.SETTINGS, 
                icon: Icons.Settings,
                onDidClick: () => {
                    console.log('setting button clicked');
                },
            },
        ]
        .forEach(({ id, icon, onDidClick }) => {
            this.sideBarService.registerSecondaryButton({
                id: id,
                icon: icon,
                isPrimary: true,
                onDidClick: onDidClick,
            });
        });
    }

    private __combineWorkbench(): void {
        
        const splitViewOpt = {
            orientation: Orientation.Horizontal,
            viewOpts: <ISplitViewItemOpts[]>[],
        } satisfies ISplitViewOpts;

        const configurations = [
            [this.sideBarService , SideBar.WIDTH , SideBar.WIDTH, SideBar.WIDTH , Priority.Low],
            [this.sideViewService, 100, SideView.WIDTH * 2, SideView.WIDTH, Priority.Normal],
            [this.workspaceService , 0, Number.POSITIVE_INFINITY, 0, Priority.High],
        ] as const;
        
        for (const [component, minSize, maxSize, initSize, priority] of configurations) {
            component.create(this);
            component.registerListeners();
            splitViewOpt.viewOpts.push({
                element: component.element.element, 
                minimumSize: minSize,
                maximumSize: maxSize,
                initSize: initSize,
                priority: priority,
            });
        };

        // construct the split-view
        this._splitView = new SplitView(this.element.element, splitViewOpt);

        // set the sash next to sideBar is visible and disabled.
        const sash = this._splitView.getSashAt(0)!;
        sash.enable = false;
        sash.visible = true;
        sash.size = 1;
    }
}