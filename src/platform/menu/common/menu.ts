import { ReplaceType } from "src/base/common/utilities/type";
import { ContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { createService, IService } from "src/platform/instantiation/common/decorator";

export const IMenuService = createService<IMenuService>('menu-service');

export interface IMenuService extends IService {
    // noop
}

/**
 * Represents different types of menus used in the application.
 */
export const enum MenuTypes {
    CommandPalette = 'CommandPalette',

    TitleBarApplication = 'TitleBarApplication',
    TitleBarFile = 'TitleBarFile',
    TitleBarEdit = 'TitleBarEdit',
    TitleBarView = 'TitleBarView',
    TitleBarSelection = 'TitleBarSelection',
    TitleBarInsert = 'TitleBarInsert',
    TitleBarFormat = 'TitleBarFormat',
    TitleBarHelp = 'TitleBarHelp',

    FileOpenRecent = 'FileOpenRecent',
    FileExportAs = 'FileExportAs',
    InsertHeading = 'InsertHeading',
    InsertList = 'InsertList',
    InsertImage = 'InsertImage',
    InsertImageZoom = 'InsertImageZoom',
    InsertImageSwitchSyntax = 'InsertImageSwitchSyntax',
    FormatImage = 'FormatImage',
    ViewChangeTheme = 'ViewChangeTheme',

    FileTreeContext = 'FileTreeContext'
}

/**
 * Represents the structure for a menu item registration. This interface
 * defines all the properties needed to register a menu item.
 *
 * This is used when to register a menu item into a {@link MenuTypes}.
 */
export interface IMenuItemRegistration {

    /**
     * This item will be displayed in the items with the same group id.
     * Different groups meant to be separated by separator.
     */
    readonly group: string;

    /**
     * Defines the display name of this item.
     */
    readonly title: string;

    /**
     * Defines the behaviour when the item is interacted.
     */
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
        readonly checked?: ContextKeyExpr;

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
     * Precondition controls whether to render the item. If does not satisfy,
     * the item will not get rendered at all.
     */
    readonly when?: ContextKeyExpr;

    /**
     * Optional submenu for nested menu items.
     */
    readonly submenu?: MenuTypes;
}

/**
 * Similar to {@link IMenuItemRegistration}.
 * This is an enhanced version of `IMenuItemRegistration` where:
 *  1. context-based expressions (e.g., `when`, `toggled`) are resolved
 *     into boolean values.
 *  2. Submenus are also recursively resolved into a recursive array of items.
 */
export type IMenuItemRegistrationResolved = Omit<ReplaceType<IMenuItemRegistration, ContextKeyExpr, boolean>, 'submenu'> & {
    readonly submenu?: IMenuItemRegistrationResolved[];
};