import { DomUtility, Orientation } from "src/base/browser/basic/dom";
import { IComponentService } from "src/workbench/services/component/componentService";
import { Component, IAssembleComponentOpts } from "src/workbench/services/component/component";
import { IWorkspaceService } from "src/workbench/parts/workspace/workspace";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
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
import { panic } from "src/base/common/utilities/panic";
import { INavigationBarService, NavigationButtonType } from "src/workbench/parts/navigationPanel/navigationBar/navigationBar";
import { IActionBarService } from "src/workbench/parts/navigationPanel/navigationBar/actionBar";
import { INavigationViewService} from "src/workbench/parts/navigationPanel/navigationView/navigationView";
import { INavigationPanelService, NavigationPanel } from "src/workbench/parts/navigationPanel/navigationPanel";
import { IFunctionBarService } from "src/workbench/parts/navigationPanel/functionBar/functionBar";
import { IDimension } from "src/base/common/utilities/size";

/**
 * @description A base class for Workbench to create and manage the behavior of
 * each sub-component.
 */
export abstract class WorkbenchLayout extends Component {

    // [fields]

    // [constructor]

    constructor(
        protected readonly instantiationService: IInstantiationService,
        @ILogService logService: ILogService,
        @ILayoutService protected readonly layoutService: ILayoutService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @INavigationBarService protected readonly navigationBarService: INavigationBarService,
        @IActionBarService protected readonly actionBarService: IActionBarService,
        @IFunctionBarService protected readonly functionBarService: IFunctionBarService,
        @INavigationViewService protected readonly navigationViewService: INavigationViewService,
        @INavigationPanelService protected readonly navigationPanelService: INavigationPanelService,
        @IWorkspaceService protected readonly workspaceService: IWorkspaceService,
        @IConfigurationService protected readonly configurationService: IConfigurationService,
        @IContextMenuService protected readonly contextMenuService: IContextMenuService,
    ) {
        super('workbench', layoutService.parentContainer, themeService, componentService, logService);
        this.__registerNavigationViews();
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

        // register tool buttons
        const navigationBarBuilder = new NavigationBarBuilder(this.navigationBarService, this.actionBarService, this.functionBarService, this.contextMenuService);
        navigationBarBuilder.registerButtons();

        // assembly the workbench layout
        this.__assemblyWorkbenchComponents();
    }

    protected __registerLayoutListeners(): void {

        /**
         * Listens to each NavigationBar button click events and notifies the 
         * navigationView to switch the view.
         */
        this.__register(this.navigationBarService.onDidClick(e => {
            if (e.isPrimary) {
                this.navigationViewService.switchView(e.ID);
            }
        }));
    }

    // [private helper functions]

    private __registerNavigationViews(): void {
        this.navigationViewService.registerView(NavigationButtonType.EXPLORER, ExplorerView);
        // TODO: other navigation-views are also registered here.
    }

    private __assemblyWorkbenchComponents(): void {
        const workbenchConfigurations: IAssembleComponentOpts[] = [
            { 
                component: this.navigationPanelService,
                minimumSize: NavigationPanel.WIDTH,
                initSize: NavigationPanel.WIDTH,
                maximumSize: NavigationPanel.WIDTH * 2,
                priority: Priority.Normal,
            },
            { 
                component: this.workspaceService,
                minimumSize: 0,
                initSize: NavigationPanel.WIDTH,
                maximumSize: null,
                priority: Priority.High,
            },
        ];
    
        this.assembleComponents(Orientation.Horizontal, workbenchConfigurations);
    } 
}

class NavigationBarBuilder {

    constructor(
        private readonly navigationBarService: INavigationBarService,
        private readonly actionBarService: IActionBarService,
        private readonly functionBarService: IFunctionBarService,
        private readonly contextMenuService: IContextMenuService,
    ) {
    }

    public registerButtons(): void {

        /**
         * primary button configurations
         */
        [
            {
                id: NavigationButtonType.EXPLORER,
                icon: Icons.Folder,
            },
            // {
            //     id: NavigationButtonType.OUTLINE,
            //     icon: Icons.List,
            // },
            // { id: NavigationButtonType.SEARCH, icon: Icons.Search },
            // { id: NavigationButtonType.GIT, icon: Icons.CodeBranch },
        ]
            .forEach(({ id, icon}) => {
                this.actionBarService.registerPrimaryButton({
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
                id: NavigationButtonType.HELPER,
                icon: Icons.CommentQuestion,
            },
            {
                id: NavigationButtonType.SETTINGS,
                icon: Icons.Settings,
                onDidClick: () => {
                    this.contextMenuService.showContextMenu({
                        getAnchor: this.__getButtonElement(NavigationButtonType.SETTINGS).bind(this),
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
            .forEach(({ id, icon, onDidClick}) => {
                this.functionBarService.registerSecondaryButton({
                    id: id,
                    icon: icon,
                    isPrimary: false,
                    onDidClick: onDidClick,
                });
            });
    }

    private __getButtonElement(buttonType: NavigationButtonType): () => HTMLElement {
        let element: HTMLElement | undefined;
        return () => {
            if (!element) {
                const button = this.actionBarService.getButton(buttonType);
                if (!button) {
                    panic(`Cannot find tool bar button with id: ${buttonType}`);
                }
                element = button.element;
            }
            return element;
        };
    }
}