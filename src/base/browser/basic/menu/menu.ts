import "src/base/browser/basic/menu/menu.scss";
import { FocusTracker } from "src/base/browser/basic/focusTracker";
import { AbstractMenuItem, IMenuAction, IMenuItem, MenuAction, MenuItemType, MenuSeperatorItem, SingleMenuItem, SubmenuItem } from "src/base/browser/basic/menu/menuItem";
import { ActionList, IAction, IActionList, IActionListItem, IActionListOptions, IActionRunEvent } from "src/base/common/action";
import { addDisposableListener, DomUtility, EventType } from "src/base/browser/basic/dom";
import { Emitter, Register } from "src/base/common/event";
import { createStandardKeyboardEvent, IStandardKeyboardEvent, KeyCode } from "src/base/common/keyboard";
import { isNullable } from "src/base/common/util/type";

export interface IMenuActionRunEvent extends IActionRunEvent {
    readonly action: IMenuAction;
}

/**
 * An inteface only for {@link BaseMenu}.
 */
export interface IMenu extends IActionList<IMenuItem> {

    readonly element: HTMLElement;

    /**
     * Fires when any menu actions before gets actually run.
     */
    readonly onBeforeRun: Register<IMenuActionRunEvent>;
    
    /**
     * Fires when any menu actions run completed.
     */
    readonly onDidRun: Register<IMenuActionRunEvent>;
    
    /**
     * Fires when the menu is blured.
     */
    readonly onDidBlur: Register<void>;

    /**
     * Fires when the menu is closed.
     */
    readonly onDidClose: Register<void>;
    
    /**
     * @description Focus the item at the given index.
     * @param index The index of the item to be focused. If not provided, focus
     *              the first one. If index equals -1, only focus the entire 
     *              menu.
     * 
     * @note The index will be recalculated to avoid the unenabled items.
     */
    onFocus(index?: number): void;
}

/**
 * Interface for {@link BaseMenu} construction.
 */
export interface IMenuOptions extends IActionListOptions<IMenuItem> {
    
    /**
     * Initial actions for the menu construction.
     */
    readonly actions: IMenuAction[];

    /**
     * A list of possible trigger keys to determine which keys can execute the 
     * current focused item.
     * @default [KeyCode.Enter, KeyCode.Space]
     */
    readonly triggerKeys?: KeyCode[];
}

/**
 * @class A {@link BaseMenu} is build on top of {@link ActionList}, provides a 
 * UI-related component that represents a 'menu list'. Each {@link IMenuAction} 
 * will be bind to a UI-related item named {@link IMenuItem}.
 * 
 * @note The {@link BaseMenu} do not handle the concrete construction of each
 * {@link IMenuItem}. Instead, the inheritance should handle it.
 */
export abstract class BaseMenu extends ActionList<IMenuItem> implements IMenu {

    // [fields]

    private readonly _element: HTMLElement;
    declare protected readonly _items: IMenuItem[];
    
    private readonly _focusTracker: FocusTracker;
    private _currFocusedIndex: number; // index

    /** an array of key pressings to trigger the current focused item. */
    private readonly _triggerKeys: KeyCode[];

    // [events]

    private readonly _onDidBlur = this.__register(new Emitter<void>());
    public readonly onDidBlur = this._onDidBlur.registerListener;

    private readonly _onDidClose = this.__register(new Emitter<void>());
    public readonly onDidClose = this._onDidClose.registerListener;

    declare public readonly onBeforeRun: Register<IMenuActionRunEvent>;
    declare public readonly onDidRun: Register<IMenuActionRunEvent>;

    // [constructor]

    constructor(container: HTMLElement, opts: IMenuOptions) {
        super(opts);

        this._element = document.createElement('div');
        this._element.className = 'menu';
        
        this._currFocusedIndex = -1;
        this._triggerKeys = opts.triggerKeys ?? [KeyCode.Enter, KeyCode.Space];
        this._focusTracker = this.__register(new FocusTracker(this._element, true));
        
        this.__registerListeners();

        // construct menu for the first time
        this.insert(opts.actions ?? []); // FIX

        // actual render
        container.appendChild(this._element);
    }
    
    // [public methods]

    get element(): HTMLElement {
        return this._element;
    }

    public onFocus(index?: number): void {
        
        if (isNullable(index)) {
            index = 0;
        }

        if (index === -1) {
            this._element.focus();
            return;
        }

        if (index === this._currFocusedIndex) {
            return;
        }

        if (index < 0 || index >= this._items.length) {
            return;
        }

        let actualIndex = 0;
        while (index !== 0) {
            index--;
            actualIndex++;
        }

        this.__focusItemAt(actualIndex);
    }

    public override dispose(): void {
        super.dispose();
    }

    // [private helper methods]

    private __registerListeners(): void {
        
        /**
         * Renders the item after every insertion operation.
         */
        this.onDidInsert(items => {
            const fragment = <HTMLElement><unknown>document.createDocumentFragment();
            for (const item of items) {
                // bind the item runnning environment to the action list
                item.actionRunner = this.run.bind(this);
                
                // render the item
                item.render(fragment);
            }
            this._element.appendChild(fragment);
            
            // re-focus
            if (this._currFocusedIndex !== -1) {
                this.onFocus(this._currFocusedIndex);
            }
        });

        /**
         * Blur event
         */
        this._focusTracker.onDidBlur(() => {
            const activeNode = DomUtility.Elements.getActiveElement();
            
            /**
             * There can be situations where the blur event is fired for the 
             * current node, but the new active element is a child element 
             * within the current node.
             */
            if (!(activeNode === this._element || !DomUtility.Elements.isAncestor(this._element, activeNode))) {
                return;
            }

            this._currFocusedIndex = -1;
            this._onDidBlur.fire();
        });

        /**
         * Keydown event
         */
        this.__register(addDisposableListener(this._element, EventType.keydown, (e) => {
            const event = createStandardKeyboardEvent(e);
            let eventHandled = true;

            switch (event.key) {
                case KeyCode.Escape: {
                    this._onDidClose.fire();
                    break;
                }
                case KeyCode.Home: {
                    this.onFocus(0);
                    break;
                }
                case KeyCode.End: {
                    this.onFocus(this._items.length - 1);
                    break;
                }
                case KeyCode.UpArrow: {
                    this.__focusPrevious();
                    break;
                }
                case KeyCode.DownArrow: {
                    this.__focusNext();
                    break;
                }
                default:
                    eventHandled = false;
                    break;
            }

            if (eventHandled) {
                event.preventDefault();
                event.stopPropagation();
            }
        }));

        /**
         * Keyup event
         */
        this.__register(addDisposableListener(this._element, EventType.keyup, (e) => {
            const event = createStandardKeyboardEvent(e);
            
            // try to run the current focused item
            if (this.__isTriggerKeys(event) && this.__hasAnyFocused()) {
                this.run(this._currFocusedIndex);
                event.preventDefault();
                event.stopPropagation();
            }
        }));
    }

    private __focusPrevious(): void {
        this.__focusByOffset(-1);
    }

    private __focusNext(): void {
        this.__focusByOffset(1);
    }

    private __focusByOffset(offset: -1 | 1): void {
        if (this._items.length === 0) {
            return;
        }
        
        if (!this.__hasAnyFocused()) {
            this.__focusItemAt(0);
            return;
        }

        if (this._currFocusedIndex === 0 && this._items.length === 1) {
            return;
        }

        let actualIndex = this._currFocusedIndex;
        let actualItem: IMenuItem;
        do {
            actualIndex = ((actualIndex + offset) + this._items.length) % this._items.length;
            actualItem = this._items[actualIndex]!;
        } 
        while (!actualItem.action.enabled);

        this.__focusItemAt(actualIndex);
    }

    private __focusItemAt(newIndex: number): void {
        const item = this._items[newIndex];
        if (!item) {
            this._element.focus({ preventScroll: true });
            return;
        }

        this._currFocusedIndex = newIndex;
        item.focus();
    }

    private __hasAnyFocused(): boolean {
        return this._currFocusedIndex !== -1;
    }

    private __isTriggerKeys(event: IStandardKeyboardEvent): boolean {
        return this._triggerKeys.findIndex(key => key === event.key) !== -1;
    }
}
