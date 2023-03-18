import "src/base/browser/basic/menu/menu.scss";
import { AbstractMenuItem, IMenuAction, MenuAction, MenuItemType, MenuSeperatorItem, SingleMenuItem, SubmenuItem } from "src/base/browser/basic/menu/menuItem";
import { ActionList, IActionList } from "src/base/common/action";

/**
 * An inteface only for {@link Menu}.
 */
export interface IMenu extends IActionList<AbstractMenuItem> {

}

/**
 * Interface for {@link Menu} construction.
 */
export interface IMenuOptions {
    
    /**
     * Initial actions for the menu construction.
     */
    readonly actions: IMenuAction[];

    /**
     * The current context (about the target) of the menu.
     */
    readonly context: unknown;
}

/**
 * @class A {@link Menu} is build on top of {@link ActionList}, provides a 
 * UI-related component that represents a 'menu list'. Each item in the list is
 * has a functionality {@link IMenuAction}.
 * 
 * A {@link Menu} provides various types of item and can be found at {@link MenuItemType}.
 */
export class Menu extends ActionList<AbstractMenuItem> implements IMenu {

    // [fields]

    private readonly _element: HTMLElement;
    declare protected readonly _items: AbstractMenuItem[];
    private readonly _context: unknown;

    private _submenu?: IMenu;

    // [constructor]

    constructor(container: HTMLElement, opts: IMenuOptions) {
        super({
            contextProvider: () => this._context,
        });

        this._context = opts.context;
        this._element = document.createElement('div');
        this._element.className = 'menu';
        this._submenu = undefined;

        /**
         * Renders the item after every insertion.
         */
        this.onDidInsert(items => {
            const fragment = <HTMLElement><unknown>document.createDocumentFragment();
            for (const item of items) {
                item.render(fragment);
            }
            this._element.appendChild(fragment);
        });

        // construct menu for the first time
        this.insert(opts.actions ?? []);

        // actual render
        container.appendChild(this._element);
    }

    // [public methods]

    public override dispose(): void {
        super.dispose();
    }

    // [protected override methods]

    protected override createItemImpl(action: MenuAction): AbstractMenuItem {
        
        if (action.type === MenuItemType.Seperator) {
            return new MenuSeperatorItem(action, this._contextProvider);
        }

        else if (action.type === MenuItemType.Submenu) {
            const submenuItem = new SubmenuItem(action, this._contextProvider);
            this.__register(submenuItem.oncloseCurrSubmenu(() => this.__closeCurrSubmenu()));
            this.__register(submenuItem.onOpenNewSubmenu(() => this.__openNewSubmenu()));
            return submenuItem;
        }

        else {
            return new SingleMenuItem(action, this._contextProvider);
        }
    }

    // [private helper methods - submenu]

    private __closeCurrSubmenu(): void {
        if (!this._submenu) {
            return;
        }

        this._submenu.dispose();
        this._submenu = undefined;
    }

    private __openNewSubmenu(): void {
        // TODO
    }
}

