import * as assert from 'assert';
import { Menu, MenuWithSubmenu } from 'src/base/browser/basic/menu/menu';
import { CheckMenuAction, MenuSeperatorAction, SimpleMenuAction, SubmenuAction } from 'src/base/browser/basic/menu/menuItem';
import { KeyCode, Shortcut } from 'src/base/common/keyboard';

suite.only('menu-test', () => {

    test('menu', () => {

        /**
         * - action1
         * - seperator
         * - action2
         * - seperator
         * - action3
         */
        const menu = new Menu(document.body, {
            contextProvider: () => 1,
            actionItemProviders: [],
        });

        menu.build([
            new SimpleMenuAction({
                id: 'action1',
                enabled: true,
                extraClassName: 'action1',
                callback: (ctx: any) => {
                    cnt += ctx;
                },
                shortcut: new Shortcut(true, false, false, false, KeyCode.KeyA),
            }),
            MenuSeperatorAction.instance,
            new SimpleMenuAction({
                id: 'action2',
                extraClassName: 'action2',
                enabled: true,
                callback: (ctx: any) => {
                    cnt += ctx + 1;
                },
                shortcut: new Shortcut(true, true, false, false, KeyCode.KeyA),
            }),
            MenuSeperatorAction.instance,
            new SimpleMenuAction({
                id: 'action3',
                extraClassName: 'action3',
                enabled: false,
                callback: (ctx: any) => {
                    cnt += ctx + 2;
                },
                shortcut: new Shortcut(true, true, true, false, KeyCode.KeyA),
            }),
        ]);

        assert.strictEqual(menu.size(), 5);
        assert.ok(menu.has('action1'));
        assert.ok(menu.has('seperator'));
        assert.ok(menu.has('action2'));
        assert.ok(menu.has('action3'));
        assert.ok(!menu.has('action4'));

        let cnt = 0;
        menu.run('action1');
        assert.strictEqual(cnt, 1);
        menu.run('action2');
        assert.strictEqual(cnt, 3);
    });

    test('submenu', () => {
        test('menu', () => {

            const menu = new MenuWithSubmenu(
                new Menu(document.body, {
                    contextProvider: () => 1,
                    actionItemProviders: [],
                })
            );
    
            let cnt = 0;

            menu.build([
                new SimpleMenuAction({
                    callback: () => cnt++,
                    enabled: true,
                    id: 'simple action 1',
                    tip: 'simple action 1 tip',
                    extraClassName: 'action1',
                    shortcut: new Shortcut(true, false, false, false, KeyCode.KeyA),
                }),
                MenuSeperatorAction.instance,
                new SimpleMenuAction({
                    callback: () => cnt++,
                    enabled: false,
                    id: 'simple action 2',
                    tip: 'simple action 2 tip',
                    extraClassName: 'action2',
                    shortcut: new Shortcut(true, false, false, true, KeyCode.KeyD),
                }),
                new SimpleMenuAction({
                    callback: () => console.log('action 3 executed'),
                    enabled: true,
                    id: 'simple action 3',
                    tip: 'simple action 3 tip',
                    extraClassName: 'action3',
                }),
                MenuSeperatorAction.instance,
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
                        MenuSeperatorAction.instance,
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
                        MenuSeperatorAction.instance,
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
            ]);
    
            assert.strictEqual(menu.size(), 3);
            assert.ok(menu.has('simple action 1'));
            assert.ok(menu.has('seperator'));
            assert.ok(menu.has('submenu 5'));
            assert.ok(menu.has('simple action 2'));
            assert.ok(menu.has('simple action 3'));
            assert.ok(menu.has('simple action 4'));
            assert.ok(!menu.has('simple action 6'));

            menu.run('simple action 1');
            assert.strictEqual(cnt, 1);
            menu.run('simple action 2');
            assert.strictEqual(cnt, 1);
        });
    });

    test('disable menu item', () => {
        const menu = new MenuWithSubmenu(
            new Menu(document.body, {
                contextProvider: () => 1,
                actionItemProviders: [],
            })
        );

        let pressed = false;
        menu.build([
            new SimpleMenuAction({
                callback: () => {
                    pressed = true;
                },
                enabled: false,
                id: 'action 1',
            })
        ]);

        menu.run('action 1');
        assert.strictEqual(pressed, false);
    });

    test('check menu item', () => {
        const menu = new MenuWithSubmenu(
            new Menu(document.body, {
                contextProvider: () => 1,
                actionItemProviders: [],
            })
        );

        let checked = false;

        menu.build([
            new CheckMenuAction({
                checked: false,
                enabled: true,
                id: 'check action 1',
                onChecked: (ifChecked) => {
                    checked = ifChecked;
                },
            })
        ]);

        menu.run('check action 1');
        assert.strictEqual(checked, true);

        menu.run('check action 1');
        assert.strictEqual(checked, false);

        menu.run('check action 1');
        assert.strictEqual(checked, true);
    });

});