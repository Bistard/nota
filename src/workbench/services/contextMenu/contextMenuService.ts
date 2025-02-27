import { ContextMenuView, IAnchor, IContextMenu, IContextMenuDelegate, IContextMenuDelegateBase } from "src/base/browser/basic/contextMenu/contextMenu";
import { DomUtility, EventType } from "src/base/browser/basic/dom";
import { DomEmitter, Register } from "src/base/common/event";
import { IMenu, IMenuActionRunEvent, Menu, MenuWithSubmenu } from "src/base/browser/basic/menu/menu";
import { CheckMenuAction, MenuAction, MenuItemType, MenuSeparatorAction, SimpleMenuAction, SubmenuAction } from "src/base/browser/basic/menu/menuItem";
import { Disposable, DisposableBucket, IDisposable } from "src/base/common/dispose";
import { ILayoutService } from "src/workbench/services/layout/layoutService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { isCancellationError } from "src/base/common/error";
import { isDefined } from "src/base/common/utilities/type";
import { MenuTypes } from "src/platform/menu/common/menu";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { ICommandService } from "src/platform/command/common/commandService";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { IContextService } from "src/platform/context/common/contextService";
import { INotificationService } from "src/workbench/services/notification/notification";
import { memoize } from "src/base/common/memoization";

// region - [interface]

export const IContextMenuService = createService<IContextMenuService>('context-menu-service');

/**
 * @test Enable this setting to prevent any external actions from closing the
 * context menu.
 */
const DEBUG_MODE: boolean = false;

/**
 * A delegate to provide external data dn functionalities to help to show a
 * context menu.
 */
interface IShowContextMenuDelegateBase extends IContextMenuDelegateBase {

    /**
     * @description Returns the running context for all the actions.
     */
    getContext(): unknown;

    /**
     * @description Allow the client to customize the style of the context menu.
     * If the function is not defined, the context menu will only have a class
     * named 'context-menu'.
     */
    getExtraContextMenuClassName?(): string;

    /**
     * @description If provided, fires when the context menu is about to be 
     * closed, the client may return a `true` to prevent the destroy.
     */
    onBeforeDestroy?(cause: 'blur' | 'esc'): boolean;

    /**
     * @description If provided, fires when the context menu decides to be 
     * closed, the client may have a chance to do some prework.
     */
    onDestroy?(): void;
}

export interface IShowContextMenuDelegate extends IShowContextMenuDelegateBase {

    /**
     * @description Defines the content of the context menu.
     */
    readonly menu: MenuTypes;
}

export interface IShowContextMenuCustomDelegate extends IShowContextMenuDelegateBase {

    /**
     * @description Defines the content of the context menu. A list of customizable
     * actions for each context menu item.
     */
    getActions(): MenuAction[];
}

/**
 * An interface only for {@link ContextMenuService}.
 */
export interface IContextMenuService extends IService {

    /**
     * @description Shows up a context menu. the content will be filled with
     * existing menu.
     * @param delegate The delegate to provide external functionalities.
     * @param container The container that contains the context menu. If not
     *                  provided, it will be positioned under the current active
     *                  element.
     */
    showContextMenu(delegate: IShowContextMenuDelegate, container?: HTMLElement): void;

    /**
     * @description Shows up a context menu. The content is customizable.
     * @param delegate The delegate to provide external functionalities.
     * @param container The container that contains the context menu. If not
     *                  provided, it will be positioned under the current active
     *                  element.
     */
    showContextMenuCustom(delegate: IShowContextMenuCustomDelegate, container?: HTMLElement): void;

    /**
     * Indicates if any context menu is currently presented, also provides a 
     * list of functions to manipulate with it.
     * 
     * @note The following functions will do nothing and return `undefined` if 
     * no context menu is presented.
     */
    readonly contextMenu: {
        readonly onActionRun: Register<IMenuActionRunEvent>;
        readonly onDidActionRun: Register<IMenuActionRunEvent>;

        /**
         * @description Destroy the current context menu.
         */
        destroy(): void;

        /**
         * @description Programmatically focus the previous item. If currently no 
         * focused item, focus the first item.
         */
        focusPrev(): void;

        /**
         * @description Programmatically focus the next item. If currently no 
         * focused item, focus the first item.
         */
        focusNext(): void;

        /**
         * @description Programmatically focus the item at the given index. If 
         * index is invalid, focus nothing but only the entire menu.
         */
        focusAt(index: number): void;

        /**
         * @description Programmatically run the current focused item.
         */
        runFocus(): void;

        /**
         * @description If the menu has any focused item.
         */
        hasFocus(): boolean;

        /**
         * @description The index of the current focused item, -1 means none.
         */
        getFocus(): number;

        /**
         * @description Get the action by index or id.
         */
        getAction(indexOrID: number | string): MenuAction | undefined;

        /**
         * @description If the current focused item is a submenu, open it. 
         * Return `true` if submenu is opened.
         */
        tryOpenSubmenu(index?: number): boolean;
    };
}

// region - [service]

/**
 * @class A context menu service provides functionality to pop up a context menu
 * by providing a {@link IShowContextMenuDelegate} to define how the context
 * menu should be constructed and rendered.
 */
export class ContextMenuService extends Disposable implements IContextMenuService {

    declare _serviceMarker: undefined;

    // [fields]

    // singleton
    private readonly _contextMenu: IContextMenu;
    private _internalDelegate?: __ContextMenuDelegate;

    // The current container of the context menu.
    private readonly _currContainer?: HTMLElement;
    private readonly _defaultContainer: HTMLElement;

    // [constructor]

    constructor(
        @ILayoutService private readonly layoutService: ILayoutService,
        @INotificationService private readonly notificationService: INotificationService,
        @ICommandService private readonly commandService: ICommandService,
        @IContextService private readonly contextService: IContextService,
        @IRegistrantService private readonly registrantService: IRegistrantService
    ) {
        super();
        this._defaultContainer = this.layoutService.parentContainer;
        this._currContainer = this._defaultContainer;
        this._contextMenu = this.__register(new ContextMenuView(this._currContainer));
        
        // cleanup everything a context menu is destroyed.
        this._internalDelegate = undefined;
        this.__register(this._contextMenu.onDestroy(() => {
            this._internalDelegate = undefined;
        }));
    }

    // [getter]

    @memoize
    get contextMenu() {
        const ensureExist = (cb: (...args: any[]) => any) => {
            return (...args: any[]) => {
                if (this._contextMenu.visible()) {
                    return cb(...args);
                }
                return undefined;
            };
        };
        return {
            destroy: ensureExist(() => this._contextMenu.destroy()),
            focusPrev: ensureExist(() => this._internalDelegate?.focusPrev()),
            focusNext: ensureExist(() => this._internalDelegate?.focusNext()),
            focusAt: ensureExist((index: number) => this._internalDelegate?.focusAt(index)),
            runFocus: ensureExist(() => this._internalDelegate?.runFocus()),
            hasFocus: ensureExist(() => this._internalDelegate?.hasFocus()),
            getFocus: ensureExist(() => this._internalDelegate?.getFocus()),
            getAction: ensureExist((arg: number | string) => this._internalDelegate?.getAction(arg)),
            tryOpenSubmenu: ensureExist((index?: number) => this._internalDelegate?.tryOpenSubmenu(index)),
            onActionRun: ensureExist(() => this._internalDelegate?.onBeforeActionRun),
            onDidActionRun: ensureExist(() => this._internalDelegate?.onDidActionRun),
        };
    }

    // [public methods]

    public showContextMenu(delegate: IShowContextMenuDelegate, container?: HTMLElement): void {
        this.showContextMenuCustom({
            ...delegate,
            getActions: () => this.__getActionsByMenuType(delegate.menu),
        }, container);
    }

    public showContextMenuCustom(delegate: IShowContextMenuCustomDelegate, container?: HTMLElement): void {
        if (delegate.getActions().length === 0) {
            return;
        }

        const focusElement = <HTMLElement | undefined>(
            container ?? DomUtility.Elements.getActiveElement()
        );

        if (!focusElement) {
            this._contextMenu.setContainer(this._defaultContainer);
        } else {
            this._contextMenu.setContainer(focusElement);
        }

        this._internalDelegate = new __ContextMenuDelegate(
            delegate,
            this._contextMenu,
            this.__onBeforeActionRun.bind(this),
            this.__onDidActionRun.bind(this),
        );

        // show context menu
        this._contextMenu.show(this._internalDelegate);
    }

    // [private methods]

    private __onBeforeActionRun(event: IMenuActionRunEvent): void {
        if (event.action.type !== MenuItemType.Submenu) {
            this._contextMenu.destroy();
        }
    }

    private __onDidActionRun(event: IMenuActionRunEvent): void {
        if (event.error && !isCancellationError(event.error)) {
            this.notificationService.error(event.error, { actions: [{ label: 'Close', run: 'noop' }] });
        }
    }

    private __getActionsByMenuType(menuType: MenuTypes): MenuAction[] {
        const registrant = this.registrantService.getRegistrant(RegistrantType.Menu);
        const menuItems = registrant.getMenuitems(menuType);

        const actions: MenuAction[] = menuItems.map((item) => {
            const providedArgs = (item.command.args ?? []);
            
            // check box
            if (item.command.checked !== undefined) {
                return new CheckMenuAction({
                    id: item.title,
                    enabled: this.contextService.contextMatchExpr(item.command.when ?? null),
                    checked: this.contextService.contextMatchExpr(item.command.checked),
                    key: item.command.keybinding,
                    mac: item.command.mac,
                    extraClassName: 'toggle-item',
                    onChecked: (checked) => {
                        this.commandService.executeCommand(item.command.commandID, ...providedArgs, { checked });
                    },
                });
            }

            // submenu
            if (item.submenu !== undefined) {
                const submenuActions = this.__getActionsByMenuType(item.submenu);
                return new SubmenuAction(submenuActions, {
                    id: item.title,
                    enabled: this.contextService.contextMatchExpr(item.when ?? null),
                    extraClassName: 'submenu-item',
                });
            }

            // default
            return new SimpleMenuAction({
                enabled: this.contextService.contextMatchExpr(item.command.when ?? null),
                id: item.title,
                key: item.command.keybinding,
                mac: item.command.mac,
                callback: (ctx: unknown) => {
                    this.commandService.executeCommand(item.command.commandID, ...providedArgs, ctx);
                },
            });
        });

        // group up actions
        const groupedActions = new Map<string, MenuAction[]>();
        for (const action of actions) {
            const group = menuItems.find((item) => item.title === action.id)?.group || '';
            let groupActions = groupedActions.get(group);
            if (!groupActions) {
                groupActions = [];
                groupedActions.set(group, groupActions);
            }
            groupActions.push(action);
        }

        const finalActions: MenuAction[] = [];

        // Add separators between groups
        let i = 0;
        for (const [groupName, groups] of groupedActions) {
            finalActions.push(...groups);
            if (i < groupedActions.size - 1) {
                finalActions.push(MenuSeparatorAction.instance);
            }
            i++;
        }

        return finalActions;
    }
}

// region - [private]

class __ContextMenuDelegate implements IContextMenuDelegate {

    // [event]

    get onBeforeActionRun() { return this._menu?.onBeforeRun; }
    get onDidActionRun() { return this._menu?.onDidRun; }

    // [fields]

    private _menu?: MenuWithSubmenu;
    private readonly _delegate: IShowContextMenuCustomDelegate;
    private readonly _contextMenu: IContextMenu;
    private readonly _onBeforeActionRun: (event: IMenuActionRunEvent) => void;
    private readonly _onDidActionRun: (event: IMenuActionRunEvent) => void;

    // [constructor]

    constructor(
        delegate: IShowContextMenuCustomDelegate,
        contextMenu: IContextMenu,
        onBeforeActionRun: (event: IMenuActionRunEvent) => void,
        onDidActionRun: (event: IMenuActionRunEvent) => void,
    ) {
        this._menu = undefined;
        this._delegate = delegate;
        this._contextMenu = contextMenu;
        this._onBeforeActionRun = onBeforeActionRun;
        this._onDidActionRun = onDidActionRun;
    }

    // [public methods]

    public getAnchor(): HTMLElement | IAnchor {
        return this._delegate.getAnchor();
    }

    public render(container: HTMLElement): IDisposable {
        const lifecycle = new DisposableBucket();
        const delegate = this._delegate;
        const contextMenu = this._contextMenu;

        const menuClassName = delegate.getExtraContextMenuClassName?.() ?? null;
        if (isDefined(menuClassName)) {
            container.classList.add(menuClassName);
        }

        // menu construction
        this._menu = lifecycle.register(
            new MenuWithSubmenu(
                new Menu(container, {
                    contextProvider: () => delegate.getContext(),
                }),
            )
        );
        const menu = this._menu;

        // build menu
        menu.build(delegate.getActions());

        /**
         * If on debug mode, we do not wish to destroy the context menu
         * automatically.
         */
        if (DEBUG_MODE) {
            return lifecycle;
        }

        // context menu: before destroy event
        lifecycle.register(
            contextMenu.onDestroy(() => {
                delegate.onDestroy?.();
                this._menu = undefined;
    
                // make sure the extra class is removed for later container to be reused.
                const className = this._delegate.getExtraContextMenuClassName?.();
                if (className) {
                    contextMenu.element.classList.remove(className);
                }
            })
        );

        // context menu: destroy event
        [
            menu.onDidBlur,
            menu.onDidClose,
            lifecycle.register(new DomEmitter(window, EventType.blur)).registerListener,
        ]
        .forEach(event => {
            const listener = event((e: void | FocusEvent) => {
                const isBlur = e ? 'blur' : 'esc';
                const prevent = delegate.onBeforeDestroy?.(isBlur);
                if (prevent) {
                    return;
                }
                contextMenu.destroy();
            });
            lifecycle.register(listener);
        });

        // running action events
        lifecycle.register(menu.onBeforeRun(this._onBeforeActionRun, this));
        lifecycle.register(menu.onDidRun(this._onDidActionRun, this));

        return lifecycle;
    }

    public runFocus(): void {
        this._menu?.run(this._menu.getCurrFocusIndex());
    }

    public hasFocus(): boolean {
        return this._menu?.anyFocused() ?? false;
    }

    public getFocus(): number {
        return this._menu?.getCurrFocusIndex() ?? -1;
    }

    public onFocus(): void {
        // only focus the entire menu
        this._menu?.focus(-1);
    }

    public focusPrev(): void {
        this._menu?.focusPrev();
    }
    
    public focusNext(): void {
        this._menu?.focusNext();
    }

    public focusAt(index: number): void {
        this._menu?.focus(index);
    }

    public getAction(arg: number | string): MenuAction | undefined {
        return this._menu?.get(arg);
    }

    public tryOpenSubmenu(index?: number): boolean {
        if (!this._menu) {
            return false;
        }
        index ??= this._menu.getCurrFocusIndex();
        if (index === -1) {
            return false;
        }

        const currItem = this._menu.getItem(index);
        if (!currItem) {
            return false;
        }

        const currAction = currItem.action;
        if (currAction.type !== MenuItemType.Submenu || !currAction.enabled) {
            return false;
        }
        
        this._menu.openNewSubmenu(currItem.element.raw, currAction.actions);
        return true;
    }
}
