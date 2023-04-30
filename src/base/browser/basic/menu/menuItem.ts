import { DomEventHandler, DomEventLike, DomUtility } from "src/base/browser/basic/dom";
import { FastElement } from "src/base/browser/basic/fastElement";
import { Action, ActionListItem, IAction, IActionListItem, IActionOptions } from "src/base/common/action";
import { IDisposable } from "src/base/common/dispose";
import { Shortcut } from "src/base/common/keyboard";
import { noop } from "src/base/common/performance";
import { IS_MAC } from "src/base/common/platform";
import { UnbufferedScheduler } from "src/base/common/util/async";

export type MenuAction = SingleMenuAction | SubmenuAction | MenuSeperatorAction;

export const enum MenuItemType {
    General,
    Seperator,
    Submenu,
}

export interface IMenuAction extends IAction {

    /**
     * The type of the action.
     */
    readonly type: MenuItemType;

    /**
     * A class name to customize the style of the corresponding item in the menu.
     */
    readonly extraClassName?: string;

    /**
     * If the action is checked.
     */
    checked?: boolean;

    /**
     * The shortcut of the action.
     */
    shortcut?: Shortcut;
}

export interface IMenuActionOptions extends IActionOptions {
    
    /**
     * If the menu is checked.
     */
    readonly checked?: boolean;

    /**
     * If the menu action has a shortcut.
     */
    readonly shortcut?: Shortcut;

    /**
     * A optional class name to customize the style of the corresponding item in
     * the menu.
     */
    readonly extraClassName?: string;
}

export interface ISubmenuActionOptions extends Omit<IActionOptions, 'callback'> {
    
    /**
     * A optional class name to customize the style of the corresponding item in
     * the menu.
     */
    readonly extraClassName?: string;
}

class __BaseMenuAction<TType extends MenuItemType> extends Action implements IMenuAction {

    // [fields]

    public readonly type: TType;
    public checked?: boolean;
    public shortcut?: Shortcut;

    public readonly extraClassName?: string;

    // [constructor]

    constructor(type: TType, opts: IMenuActionOptions) {
        super(opts);
        this.type = type;
        this.checked = opts.checked;
        this.shortcut = opts.shortcut;
        this.extraClassName = opts.extraClassName;
    }
}

export class SingleMenuAction extends __BaseMenuAction<MenuItemType.General> {

    constructor(opts: IMenuActionOptions) {
        super(MenuItemType.General, opts);
    }
}

export class SubmenuAction extends __BaseMenuAction<MenuItemType.Submenu> {

    // [fields]

    public readonly actions: IMenuAction[];
    private _onRun?: () => void;

    // [constructor]

    constructor(actions: IMenuAction[], opts: ISubmenuActionOptions) {
        super(
            MenuItemType.Submenu, 
            { ...opts, callback: () => this._onRun?.(), },
        );
        this.actions = actions;
    }

    // [public methods]

    set onRun(fn: () => void) {
        this._onRun = fn;
    }
}

export class MenuSeperatorAction extends __BaseMenuAction<MenuItemType.Seperator> {
    
    // [fields]

    public static readonly instance = new MenuSeperatorAction();
    
    // [constructor]

    private constructor() {
        super(MenuItemType.Seperator, {
            callback: noop,
            enabled: false,
            id: 'seperator',
        });
    }
}

/**
 * Interface for {@link AbstractMenuItem} and its inheritance.
 */
export interface IMenuItem extends IActionListItem, IDisposable {
    
    /**
     * The corresponding element of the item.
     */
    readonly element: FastElement<HTMLElement>;

    /**
     * The callback function when the item is about to run. Should be set by the
     * externals.
     */
    actionRunner?: (action: IMenuAction) => void;

    /**
     * @description Renders the item into the parent.
     * @param parent The parent HTMLElement.
     * 
     * @note For addtional rendering purpose, please override `__render()` 
     * instead.
     */
    render(parent: HTMLElement): void;
    
    /**
     * @description Focus the current item in the DOM tree.
     */
    focus(): void;

    /**
     * @description Unfocus (blur) the current item in the DOM tree.
     */
    blur(): void;
}

/**
 * @class The {@link AbstractMenuItem} pre-defines a series of event listeners 
 * on the HTMLElement.
 */
export abstract class AbstractMenuItem extends ActionListItem implements IMenuItem {

    // [fields]

    declare public readonly action: IMenuAction;
    public readonly element: FastElement<HTMLElement>;
    private _actionRunner?: (action: IMenuAction) => void;

    // [constructor]

    constructor(action: IMenuAction) {
        super(action);
        this.element = this.__register(new FastElement(document.createElement('div')));
        /**
         * Rendering and event registrations should be done in `__render` and
         * `__registerListeners` respectively.
         */
    }

    // [setter]

    get actionRunner(): ((action: IMenuAction) => void) | undefined {
        return this._actionRunner;
    }

    set actionRunner(runner: ((action: IMenuAction) => void) | undefined) {
        this._actionRunner = runner;
    }

    // [public methods]

    public render(parent: HTMLElement): void {
        this.__render();
        this.__registerListeners();
        parent.appendChild(this.element.element);
    }

    public onClick(event: DomEventLike): void {
        DomEventHandler.stop(event, true);
        this._actionRunner?.(this.action);
    }

    public focus(): void {
        this.element.setTabIndex(0);
        this.element.setFocus();
        this.element.addClassList('focused');
    }

    public blur(): void {
        this.element.setTabIndex(1);
        this.element.setBlur();
        this.element.removeClassList('focused');
    }

    public override dispose(): void {
        super.dispose();
        this.element.dispose();
    }
    
    // [private helper methods]

    /**
     * @description Override for additional rendering purpose.
     */
    protected __render(): void {
        this.element.addClassList('base-item');
        if (this.action.extraClassName) {
            this.element.addClassList(this.action.extraClassName);
        }
        this.element.toggleClassName('disabled', !this.action.enabled);
    }

    /**
     * @description Override for additional listeners.
     */
    protected __registerListeners(): void {

        // prevent default context menu event on each menu item
        this.__register(this.element.onContextmenu(e => {
            DomEventHandler.stop(e, true);
        }));

        // add 'active' properly
        this.element.onMousedown(e => {
            DomEventHandler.stop(e, true);
            if (this.action.enabled && DomEventHandler.isLeftClick(e)) {
                this.element.addClassList('active');
            }
        });

        // handle click event
        this.element.onClick(e => {
            DomEventHandler.stop(e, true);
            this.onClick(e);
        });

        // prevent double click
        this.element.onDoubleclick(e => {
            DomEventHandler.stop(e, true);
        });

        // remove 'active' properly
        [this.element.onMouseup, this.element.onMouseout].forEach(onEvent => {
			onEvent.call(this.element, (e) => {
                DomEventHandler.stop(e, true);
                this.element.removeClassList('active');
            });
		});

        /**
         * macOS: allow to trigger the button when holding Ctrl+key and 
         * pressing the main mouse button. This is for scenarios where e.g. 
         * some interaction forces the Ctrl+key to be pressed and hold but 
         * the user still wants to interact with the actions (for example 
         * quick access in quick navigation mode).
         */
        if (IS_MAC) {
			this.element.onContextmenu(e => {
				if (DomEventHandler.isLeftClick(e) && e.ctrlKey === true) {
					this.onClick(e);
				}
			});
		}
    }
}

/**
 * @class The {@link MenuSeperatorItem} overrides the pre-defined event 
 * listeners since the seperator suppose to have no interactions from the user.
 */
export class MenuSeperatorItem extends AbstractMenuItem {
    
    constructor(action: IMenuAction) {
        super(action);
    }

    protected override __render(): void {
        super.__render();
        this.element.addClassList('seperator');
    }

    protected override __registerListeners(): void {
        // noop
    }
}

/**
 * @class {@link SingleMenuItem} provides a general functionality as a menu item
 * that can response to user click.
 */
export class SingleMenuItem extends AbstractMenuItem {
    
    constructor(action: IMenuAction) {
        super(action);
    }

    protected override __render(): void {
        super.__render();
        this.element.addClassList('menu-item');
    }

    protected override __registerListeners(): void {
        super.__registerListeners();
    }
}

export interface ISubmenuDelegate {
    closeCurrSubmenu(): void;
    openNewSubmenu(anchor: HTMLElement, actions: IMenuAction[]): void;
}

/**
 * @class A {@link SubmenuItem} provides no action functionality, instead, 
 * displays a list of actions in a submenu.
 */
export class SubmenuItem extends AbstractMenuItem {

    // [constants]

    public static readonly SHOW_DEPLAY = 250;
    public static readonly HIDE_DEPLAY = 750;

    // [field]

    declare public readonly action: SubmenuAction;

    private readonly _showScheduler: UnbufferedScheduler<void>;
    private readonly _hideScheduler: UnbufferedScheduler<void>;
    private readonly _delegate: ISubmenuDelegate;

    // [constructor]

    constructor(action: SubmenuAction, delegate: ISubmenuDelegate) {
        super(action);
        this._delegate = delegate;

        // scheduling initializaiton
        {
            this._showScheduler = new UnbufferedScheduler(SubmenuItem.SHOW_DEPLAY, () => {
                this._delegate.closeCurrSubmenu();
                this._delegate.openNewSubmenu(this.element.element, this.action.actions);
            });
    
            this._hideScheduler = new UnbufferedScheduler(SubmenuItem.HIDE_DEPLAY, () => {
                // no hiding tasks when focusing on the submenu
                const blurNode = DomUtility.Elements.getActiveElement();
                if (DomUtility.Elements.isAncestor(this.element.element, blurNode)) {
                    return;
                }
                this._delegate.closeCurrSubmenu();
            });

            this.__register(this._showScheduler);
            this.__register(this._hideScheduler);
        }
    }

    // [public methods]

    public override run(context?: unknown): void {
        this._showScheduler.schedule(undefined, 0);
    }

    /**
     * @description Instead of running an action, open a submenu instead.
     */
    public override onClick(event: DomEventLike): void {
        DomEventHandler.stop(event, true);
        this._showScheduler.schedule(undefined, 0);
    }

    public override dispose(): void {
        super.dispose();
        this.element.dispose();
    }

    // [protected override methods]

    protected override __render(): void {
        super.__render();
        this.element.addClassList('submenu-item');
    }

    protected override __registerListeners(): void {
        
        // keep the default behaviours too.
        super.__registerListeners();

        // When mouse leaves the current item, cancel the show-up.
        this.element.onMouseenter(e => {
            this._showScheduler.schedule();
        });

        // When mouse leaves the current item, cancel the show-up.
        this.element.onMouseleave(e => {
            this._showScheduler.cancel();
        });

        // When the current item loses focus, schedules a hiding task.
        this.element.onFocusout(e => {
            const blurNode = DomUtility.Elements.getActiveElement();
            if (DomUtility.Elements.isAncestor(this.element.element, blurNode)) {
                this._hideScheduler.schedule();
            }
        });
    }

    // [private helper methods]

}
