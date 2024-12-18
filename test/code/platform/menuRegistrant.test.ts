import * as assert from 'assert';
import { MenuTypes, IMenuItemRegistration } from 'src/platform/menu/common/menu';
import { MenuRegistrant } from 'src/platform/menu/browser/menuRegistrant';
import { ContextService, IContextService } from 'src/platform/context/common/contextService';
import { CreateContextKeyExpr } from 'src/platform/context/common/contextKeyExpr';


suite('MenuRegistrant', () => {

    let menuRegistrant: MenuRegistrant;
    let contextService: IContextService;

    setup(() => {
        contextService = new ContextService();
        menuRegistrant = new MenuRegistrant(contextService);
        contextService.createContextKey('key1', 'value1');
    });

    test('registerMenuItem should register a menu item and fire change event', () => {
        const menuItem: IMenuItemRegistration = {
            group: 'testGroup',
            title: 'Test Item',
            command: { commandID: 'test.command' }
        };

        let eventFired = false;
        menuRegistrant.onDidMenuChange(menuType => {
            if (menuType === MenuTypes.TitleBarFile) {
                eventFired = true;
            }
        });

        const disposable = menuRegistrant.registerMenuItem(MenuTypes.TitleBarFile, menuItem);
        const items = menuRegistrant.getMenuitems(MenuTypes.TitleBarFile);

        assert.strictEqual(items.length, 1);
        assert.strictEqual(items[0], menuItem);
        assert.strictEqual(eventFired, true);

        disposable.dispose();
    });

    test('getMenuitems should return filtered items based on context conditions', () => {
        const menuItem: IMenuItemRegistration = {
            group: 'testGroup',
            title: 'Test Item',
            command: { commandID: 'test.command' },
            when: CreateContextKeyExpr.Equal('key1', 'value1'),
        };

        menuRegistrant.registerMenuItem(MenuTypes.TitleBarFile, menuItem);

        const items = menuRegistrant.getMenuitems(MenuTypes.TitleBarFile);
        assert.strictEqual(items.length, 1);
        assert.strictEqual(items[0], menuItem);
    });

    test('getMenuitems should filter out items with unsatisfied context conditions', () => {
        const menuItem: IMenuItemRegistration = {
            group: 'testGroup',
            title: 'Test Item',
            command: { commandID: 'test.command' },
            when: CreateContextKeyExpr.Equal('key1', 'value2'),
        };

        menuRegistrant.registerMenuItem(MenuTypes.TitleBarFile, menuItem);

        const items = menuRegistrant.getMenuitems(MenuTypes.TitleBarFile);
        assert.strictEqual(items.length, 0);
    });

    test('clearMenuItems should remove all items for the specified menu', () => {
        const menuItem: IMenuItemRegistration = {
            group: 'testGroup',
            title: 'Test Item',
            command: { commandID: 'test.command' }
        };

        menuRegistrant.registerMenuItem(MenuTypes.TitleBarFile, menuItem);
        assert.strictEqual(menuRegistrant.getMenuitems(MenuTypes.TitleBarFile).length, 1);

        menuRegistrant.clearMenuItems(MenuTypes.TitleBarFile);
        assert.strictEqual(menuRegistrant.getMenuitems(MenuTypes.TitleBarFile).length, 0);
    });

    test('getMenuItemsResolved should resolve context expressions and submenus', () => {
        const submenuItem: IMenuItemRegistration = {
            group: 'subGroup',
            title: 'Sub Item',
            command: { commandID: 'sub.command' }
        };
        const menuItem: IMenuItemRegistration = {
            group: 'testGroup',
            title: 'Test Item',
            command: { commandID: 'test.command' },
            submenu: MenuTypes.TitleBarEdit
        };

        menuRegistrant.registerMenuItem(MenuTypes.TitleBarEdit, submenuItem);
        menuRegistrant.registerMenuItem(MenuTypes.TitleBarFile, menuItem);

        const resolvedItems = menuRegistrant.getMenuItemsResolved(MenuTypes.TitleBarFile);
        assert.strictEqual(resolvedItems.length, 1);
        assert.strictEqual(resolvedItems[0]!.submenu?.length, 1);
        assert.strictEqual(resolvedItems[0]!.submenu![0]!.title, 'Sub Item');
    });

    test('getAllMenus should return all registered menu items', () => {
        const menuItem1: IMenuItemRegistration = {
            group: 'group1',
            title: 'Item 1',
            command: { commandID: 'command1' }
        };

        const menuItem2: IMenuItemRegistration = {
            group: 'group2',
            title: 'Item 2',
            command: { commandID: 'command2' }
        };

        menuRegistrant.registerMenuItem(MenuTypes.TitleBarFile, menuItem1);
        menuRegistrant.registerMenuItem(MenuTypes.TitleBarEdit, menuItem2);

        const allMenus = menuRegistrant.getAllMenus();
        assert.strictEqual(allMenus.length, 2);
        assert.strictEqual(allMenus[0]![1].length, 1);
        assert.strictEqual(allMenus[0]![1][0], menuItem1);
        assert.strictEqual(allMenus[1]![1].length, 1);
        assert.strictEqual(allMenus[1]![1][0], menuItem2);
    });
});