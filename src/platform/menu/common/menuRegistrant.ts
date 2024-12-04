import { IDisposable } from "src/base/common/dispose";
import { ReplaceType } from "src/base/common/utilities/type";
import { ContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { IContextService } from "src/platform/context/common/contextService";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { menuTitleApplicationRegister, menuTitleEditRegister, menuTitleFileRegister, menuTitleViewRegister } from "src/platform/menu/common/menu.register";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";
import { rendererMenuFileTreeContextRegister } from "src/workbench/services/fileTree/menu.register";

export const enum MenuTypes {
    CommandPalette      = 'CommandPalette',
    FileTreeContext     = 'FileTreeContext',
    TitleBarApplication = 'TitleBarApplication',
    TitleBarFile        = 'TitleBarFile',
    TitleBarEdit        = 'TitleBarEdit',
    TitleBarView        = 'TitleBarView'
}

export type IMenuItemRegistrationResolved = ReplaceType<IMenuItemRegistration, ContextKeyExpr, boolean>;

export interface IMenuItemRegistration {
    readonly group: string;
    /**
     * Defines the display name of this item.
     */
    readonly title: string;
    readonly command: {
        /**
         * The command ID to be executed when click the menu.
         */
        readonly commandID: string;

        /**
         * Precondition controls enablement (for example for a menu item, show
         * it in grey or for a command, do not allow to invoke it)
         */
        readonly when?: ContextKeyExpr;

        /**
         * Define the item as a toggle item. Define the context key expression 
         * that reflects its toggle-state.
         */
        readonly toggled?: ContextKeyExpr;

        /**
         * Keybinding for the command.
         */
        readonly keybinding?: string;

        /**
         * If it is for macos system.
         */
        readonly mac?: string;
    };

    /**
     * Defines the rendering order of this item. If not provided, default is 0.
     */
    readonly priority?: number;

    /**
     * Precondition controls whether to render the item. If does not satisfy,
     * the item will not get rendered at all.
     */
    readonly when?: ContextKeyExpr;

    /**
     * Optional submenu for nested menu items.
     */
    readonly submenu?: IMenuItemRegistration[];
}

export interface IMenuRegistrant extends IRegistrant<RegistrantType.Menu> {
    /**
     * @description Register a menu item into the given menu.
     * @return Return a disposable that will un-register the item.
     */
    registerMenuItem(menu: MenuTypes, item: IMenuItemRegistration): IDisposable;

    /**
     * @description Returns an array of items of the given menu.
     */
    getMenuitems(menu: MenuTypes): IMenuItemRegistration[];

    /**
     * @description Returns an array of resolved items of the given menu.
     */
    returnMenuItemsResolved(menu: MenuTypes): IMenuItemRegistrationResolved[];
}

export class MenuRegistrant implements IMenuRegistrant {

    // [fields]

    public readonly type = RegistrantType.Menu;
    private readonly menus: Map<MenuTypes, IMenuItemRegistration[]> = new Map();

    // [constructor]

    constructor(
        @IContextService private readonly contextService: IContextService
    ) {}

    // [public methods]

    public initRegistrations(provider: IServiceProvider): void {
        /**
         * Since the {@link MenuRegistrant} is constructed in both main
         * and renderer process. Do not register here unless it is shared in
         * both processes.
         */
        [
            // title
            menuTitleApplicationRegister,
            menuTitleFileRegister,
            menuTitleEditRegister,
            menuTitleViewRegister,

            // file tree
            rendererMenuFileTreeContextRegister,

            // more ...
        ].forEach(register => register(provider));
    }

    public registerMenuItem(menu: MenuTypes, item: IMenuItemRegistration): IDisposable {
        let items = this.menus.get(menu);
        if (!items) {
            items = [];
            this.menus.set(menu, items);
        }
        items.push(item);

        return {
            dispose: () => {
                const index = items!.indexOf(item);
                if (index >= 0) {
                    items!.splice(index, 1);
                }
            }
        };
    }

    public getMenuitems(menu: MenuTypes): IMenuItemRegistration[] {
        const result = this.menus.get(menu) || [];
        const filtered = result.filter(item => {
            return this.contextService.contextMatchExpr(item.when ?? null);
        });
        return filtered;
    }

    public returnMenuItemsResolved(menu: MenuTypes): IMenuItemRegistrationResolved[] {
        const items = this.menus.get(menu) || [];
        const resolvedItems: IMenuItemRegistrationResolved[] = items.map(item => {
            // resolve 'when' and 'toggled' conditions to booleans
            const whenResolved = this.contextService.contextMatchExpr(item.when ?? null);
            const toggledResolved = item.command.toggled
                ? this.contextService.contextMatchExpr(item.command.toggled)
                : undefined;

            // resolve submenu items recursively
            const resolvedSubmenu = item.submenu ? item.submenu
                .map(subItem => this.resolveSubmenuItem(subItem))
                : undefined;

            return {
                ...item,
                command: {
                    ...item.command,
                    when: whenResolved,
                    toggled: toggledResolved
                },
                when: whenResolved,
                submenu: resolvedSubmenu
            };
        });

        return resolvedItems;
    }

    // [private methods]

    private resolveSubmenuItem(subItem: IMenuItemRegistration): IMenuItemRegistrationResolved {
        const whenResolved = this.contextService.contextMatchExpr(subItem.when ?? null);
        const toggledResolved = subItem.command.toggled
            ? this.contextService.contextMatchExpr(subItem.command.toggled)
            : undefined;

        const resolvedSubmenu = subItem.submenu ? subItem.submenu
            .map(nestedSubItem => this.resolveSubmenuItem(nestedSubItem)) : undefined;

        return {
            ...subItem,
            command: {
                ...subItem.command,
                when: this.contextService.contextMatchExpr(subItem.command.when ?? null),
                toggled: toggledResolved
            },
            when: whenResolved,
            submenu: resolvedSubmenu
        };
    }
}