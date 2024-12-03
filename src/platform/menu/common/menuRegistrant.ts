import { IDisposable } from "src/base/common/dispose";
import { ILogService } from "src/base/common/logger";
import { ContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { IContextService } from "src/platform/context/common/contextService";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";

export const enum MenuTypes {
    CommandPalette = 'CommandPalette',
    FileTreeContext = 'FileTreeContext',
}

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
}

export class MenuRegistrant implements IMenuRegistrant {
    
    // [fields]
    public readonly type = RegistrantType.Menu;
    private readonly menus: Map<MenuTypes, IMenuItemRegistration[]> = new Map();

    // [constructor]
    constructor(
        @ILogService private readonly logService: ILogService,
        @IContextService private readonly contextService: IContextService
    ) {}

    // [public methods]
    public initRegistrations(provider: IServiceProvider): void {
        /**
         * Since the {@link MenuRegistrant} is constructed in both main
         * and renderer process. Do not register here unless it is shared in 
         * both processes.
         */
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
}