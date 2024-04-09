import { addDisposableListener, DomUtility, EventType, Orientation } from "src/base/browser/basic/dom";
import { IComponentService } from "src/workbench/services/component/componentService";
import { SideBar, ISideBarService, SideButtonType } from "src/workbench/parts/sideBar/sideBar";
import { ISideViewService, SideView } from "src/workbench/parts/sideView/sideView";
import { Component } from "src/workbench/services/component/component";
import { IWorkspaceService } from "src/workbench/parts/workspace/workspace";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { ISplitView, ISplitViewOpts, SplitView } from "src/base/browser/secondary/splitView/splitView";
import { Priority } from "src/base/common/event";
import { ExplorerView } from "src/workbench/contrib/explorer/explorer";
import { Icons } from "src/base/browser/icon/icons";
import { IContextMenuService } from "src/workbench/services/contextMenu/contextMenuService";
import { ILayoutService } from "src/workbench/services/layout/layoutService";
import { CheckMenuAction, MenuSeparatorAction, SimpleMenuAction, SubmenuAction } from "src/base/browser/basic/menu/menuItem";
import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { IThemeService } from "src/workbench/services/theme/themeService";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { ILogService } from "src/base/common/logger";
import { assert } from "src/base/common/utilities/panic";

/**
 * @description A base class for Workbench to create and manage the behavior of
 * each sub-component.
 */
export abstract class WorkbenchLayout extends Component {

    // [fields]

    private _splitView: ISplitView | undefined;

    // [constructor]

    constructor(
        protected readonly instantiationService: IInstantiationService,
        @ILogService protected readonly logService: ILogService,
        @ILayoutService protected readonly layoutService: ILayoutService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ISideBarService protected readonly sideBarService: ISideBarService,
        @ISideViewService protected readonly sideViewService: ISideViewService,
        @IWorkspaceService protected readonly workspaceService: IWorkspaceService,
        @IConfigurationService protected readonly configurationService: IConfigurationService,
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
            const dimension = assert(this.dimension);
            this._splitView?.layout(dimension.width, dimension.height);
        }));

        /**
         * Listens to each SideBar button click events and notifies the 
         * sideView to switch the view.
         */
        this.__register(this.sideBarService.onDidClick(e => {
            if (e.isPrimary) {
                this.sideViewService.switchView(e.ID);
            }
        }));
    }

    // [private helper functions]

    private __registerSideViews(): void {
        this.sideViewService.registerView(SideButtonType.EXPLORER, ExplorerView);
        // TODO: other side-views are also registered here.
    }

    private __assemblyWorkbenchParts(): void {

        const splitViewOpt: Required<ISplitViewOpts> = {
            orientation: Orientation.Horizontal,
            viewOpts: [],
        };

        const PartsConfiguration = [
            [this.sideBarService  , SideBar.WIDTH, SideBar.WIDTH           , SideBar.WIDTH , Priority.Low   ],
            [this.sideViewService , 100          , SideView.WIDTH * 2      , SideView.WIDTH, Priority.Normal],
            [this.workspaceService, 0            , Number.POSITIVE_INFINITY, 0             , Priority.High  ],
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
        this._splitView = new SplitView(this.element.element, splitViewOpt);

        // set the sash next to sideBar is visible and disabled.
        const sash = assert(this._splitView.getSashAt(0));
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
                icon: Icons.Outline,
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
                icon: Icons.Help,
            },
            {
                id: SideButtonType.SETTINGS,
                icon: Icons.Setting,
                onDidClick: () => {
                    this.contextMenuService.showContextMenu({
                        getAnchor: this.__getButtonElement(SideButtonType.SETTINGS).bind(this),
                        // TODO: this is only for test purpose
                        getActions: () => {
                            return [
                                new SimpleMenuAction({
                                    callback: () => { },
                                    enabled: true,
                                    id: 'simple action 1',
                                    tip: 'simple action 1 tip',
                                    extraClassName: 'action1',
                                    shortcut: new Shortcut(true, false, false, false, KeyCode.KeyA),
                                }),
                                MenuSeparatorAction.instance,
                                new CheckMenuAction({
                                    onChecked: (checked) => {
                                        console.log('checked:', checked);
                                    },
                                    checked: true,
                                    enabled: true,
                                    id: 'simple action 2',
                                    tip: 'simple action 2 tip',
                                    extraClassName: 'action2',
                                    shortcut: new Shortcut(true, false, false, true, KeyCode.KeyD),
                                }),
                                new SimpleMenuAction({
                                    callback: () => console.log('action 3 executed'),
                                    enabled: false,
                                    id: 'simple action 3',
                                    tip: 'simple action 3 tip',
                                    extraClassName: 'action3',
                                }),
                                MenuSeparatorAction.instance,
                                new SimpleMenuAction({
                                    callback: () => console.log('action 4 executed'),
                                    enabled: true,
                                    id: 'simple action 4',
                                    tip: 'simple action 4 tip',
                                    extraClassName: 'action4',
                                    shortcut: new Shortcut(false, false, false, false, KeyCode.F12),
                                }),
                                new SubmenuAction(
                                    [
                                        new SimpleMenuAction({
                                            callback: () => console.log('action 6 executed'),
                                            enabled: true,
                                            id: 'simple action 6',
                                            tip: 'simple action 6 tip',
                                            extraClassName: 'action6',
                                        }),
                                        MenuSeparatorAction.instance,
                                        new SimpleMenuAction({
                                            callback: () => console.log('action 7 executed'),
                                            enabled: true,
                                            id: 'simple action 7',
                                            tip: 'simple action 7 tip',
                                            extraClassName: 'action7',
                                        }),
                                        new SimpleMenuAction({
                                            callback: () => console.log('action 8 executed'),
                                            enabled: true,
                                            id: 'simple action 8',
                                            tip: 'simple action 8 tip',
                                            extraClassName: 'action8',
                                        }),
                                        MenuSeparatorAction.instance,
                                        new SimpleMenuAction({
                                            callback: () => console.log('action 9 executed'),
                                            enabled: true,
                                            id: 'simple action 9',
                                            tip: 'simple action 9 tip',
                                            extraClassName: 'action9',
                                        }),
                                    ], {
                                    enabled: true,
                                    id: 'submenu 5',
                                    tip: 'submenu 5 tip',
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