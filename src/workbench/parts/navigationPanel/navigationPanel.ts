import { IComponentService } from "src/workbench/services/component/componentService";
import { Component, IAssembleComponentOpts, IComponent } from "src/workbench/services/component/component";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IThemeService } from "src/workbench/services/theme/themeService";
import { Orientation } from "src/base/browser/basic/dom";
import { INavigationViewService, NavView} from "src/workbench/parts/navigationPanel/navigationView/navigationView";
import { INavigationBarService, NavigationBar, NavigationButtonType } from "src/workbench/parts/navigationPanel/navigationBar/navigationBar";
import { FunctionBar, IFunctionBarService } from "src/workbench/parts/navigationPanel/functionBar/functionBar";
import { ILogService } from "src/base/common/logger";
import { IActionBarService } from "src/workbench/parts/navigationPanel/navigationBar/toolBar/actionBar";
import { IContextMenuService } from "src/workbench/services/contextMenu/contextMenuService";
import { Icons } from "src/base/browser/icon/icons";
import { CheckMenuAction, MenuSeparatorAction, SimpleMenuAction, SubmenuAction } from "src/base/browser/basic/menu/menuItem";
import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { panic } from "src/base/common/utilities/panic";

export const INavigationPanelService = createService<INavigationPanelService>('navigation-panel-service');

export interface INavigationPanelService extends IComponent, IService {

}

export class NavigationPanel extends Component implements INavigationPanelService {

    // [fields]
    declare _serviceMarker: undefined;
    public static readonly WIDTH = 300;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @INavigationViewService protected readonly navigationViewService: INavigationViewService,
        @INavigationBarService protected readonly navigationBarService: INavigationBarService,
        @IFunctionBarService protected readonly functionBarService: IFunctionBarService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('navigation-panel', null, themeService, componentService, logService);
    }

    // [protected override methods]

    protected override _createContent(): void {
        this.__assemblyParts();
    }

    protected override _registerListeners(): void {
        // Register any listeners needed for the navigation panel
    }

    private __assemblyParts(): void {

        const partConfigurations: IAssembleComponentOpts[] = [
            { 
                component: this.navigationBarService,
                fixed: true,
                fixedSize: NavigationBar.HEIGHT,
            },
            { 
                component: this.navigationViewService,
                minimumSize: NavView.HEIGHT,
                initSize: NavView.HEIGHT,
                maximumSize: null,
            },
            { 
                component: this.functionBarService,
                fixed: true,
                fixedSize: FunctionBar.HEIGHT,
            },
        ];
        this.assembleComponents(Orientation.Vertical, partConfigurations);
    } 
}

export class NavigationBarBuilder {

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
                id: 'folder-open',
                icon: Icons.FolderOpen,
            },
            {
                id: 'add-new',
                icon: Icons.AddNew,
            },
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
                icon: Icons.Help,
            },
            {
                id: NavigationButtonType.SETTINGS,
                icon: Icons.Setting,
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