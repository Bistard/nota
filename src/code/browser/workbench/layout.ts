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
import { IContextMenuService } from "src/code/browser/service/contextMenu/contextMenuService";
import { ILayoutService } from "src/code/browser/service/layout/layoutService";
import { MenuSeperatorAction, SingleMenuAction, SubmenuAction } from "src/base/browser/basic/menu/menuItem";

/**
 * @description A base class for Workbench to create and manage the behaviour of
 * each sub-component.
 */
export abstract class WorkbenchLayout extends Component {

    // [fields]

    private _splitView: ISplitView | undefined;

    // [constructor]
    
    constructor(
        @ILayoutService protected readonly layoutService: ILayoutService,
        protected readonly instantiationService: IInstantiationService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ISideBarService protected readonly sideBarService: ISideBarService,
        @ISideViewService protected readonly sideViewService: ISideViewService,
        @IWorkspaceService protected readonly workspaceService: IWorkspaceService,
        @IConfigService protected readonly configService: IConfigService,
        @IContextMenuService protected readonly contextMenuService: IContextMenuService,
    ) {
        super('workbench', layoutService.parentContainer, themeService, componentService);

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
        const sideBarBuilder = new SideBarBuilder(this.sideBarService, this.contextMenuService);
        sideBarBuilder.registerButtons();

        // assembly the workbench layout
        this.__assemblyWorkbenchParts();
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

    private __assemblyWorkbenchParts(): void {
        
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

class SideBarBuilder {

    constructor(
        private readonly sideBarService: ISideBarService,
        private readonly contextMenuService: IContextMenuService,
    ) {
    }

    public registerButtons(): void {
        
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
            // TODO
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
                    this.contextMenuService.showContextMenu({
                        getAnchor: this.__getButtonElement(SideButtonType.SETTINGS).bind(this),
                        getActions: () => {
                            return [
                                // TEST
                                new SingleMenuAction({
                                    callback: () => console.log('action 1 executed'),
                                    enabled: true,
                                    id: 'testing action 1',
                                    tip: 'testing action 1 tip',
                                    extraClassName: 'action1',
                                }),
                                MenuSeperatorAction.instance,
                                new SingleMenuAction({
                                    callback: () => console.log('action 2 executed'),
                                    enabled: true,
                                    id: 'testing action 2',
                                    tip: 'testing action 2 tip',
                                    extraClassName: 'action2',
                                }),
                                new SingleMenuAction({
                                    callback: () => console.log('action 3 executed'),
                                    enabled: true,
                                    id: 'testing action 3',
                                    tip: 'testing action 3 tip',
                                    extraClassName: 'action3',
                                }),
                                MenuSeperatorAction.instance,
                                new SingleMenuAction({
                                    callback: () => console.log('action 4 executed'),
                                    enabled: true,
                                    id: 'testing action 4',
                                    tip: 'testing action 4 tip',
                                    extraClassName: 'action4',
                                }),
                                new SubmenuAction(
                                    [
                                        new SingleMenuAction({
                                            callback: () => console.log('action 6 executed'),
                                            enabled: true,
                                            id: 'testing action 6',
                                            tip: 'testing action 6 tip',
                                            extraClassName: 'action6',
                                        }),
                                        MenuSeperatorAction.instance,
                                        new SingleMenuAction({
                                            callback: () => console.log('action 7 executed'),
                                            enabled: true,
                                            id: 'testing action 7',
                                            tip: 'testing action 7 tip',
                                            extraClassName: 'action7',
                                        }),
                                        new SingleMenuAction({
                                            callback: () => console.log('action 8 executed'),
                                            enabled: true,
                                            id: 'testing action 8',
                                            tip: 'testing action 8 tip',
                                            extraClassName: 'action8',
                                        }),
                                        MenuSeperatorAction.instance,
                                        new SingleMenuAction({
                                            callback: () => console.log('action 9 executed'),
                                            enabled: true,
                                            id: 'testing action 9',
                                            tip: 'testing action 9 tip',
                                            extraClassName: 'action9',
                                        }),
                                    ], {
                                    enabled: true,
                                    id: 'testing action 5',
                                    tip: 'testing action 5 tip',
                                    extraClassName: 'action5',
                                }),
                            ];
                        },
                        getContext: () => {
                            return undefined;
                        },
                        horizontalPosition: undefined,
                        primaryAlignment: undefined,
                        verticalPosition: undefined,
                    });
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

    private __getButtonElement(buttonType: SideButtonType): () => HTMLElement {
        let element: HTMLElement | undefined;
        return () => {
            if (!element) {
                const button = this.sideBarService.getButton(buttonType);
                if (!button) {
                    throw new Error(`Cannot find side bar button with id: ${buttonType}`);
                }
                element = button.element;
            }
            return element;
        };
    }
}