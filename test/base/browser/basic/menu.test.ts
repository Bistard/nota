import * as assert from 'assert';
import { Menu, MenuWithSubmenu } from 'src/base/browser/basic/menu/menu';
import { MenuSeperatorAction, SingleMenuAction, SubmenuAction } from 'src/base/browser/basic/menu/menuItem';
import { KeyCode, Shortcut } from 'src/base/common/keyboard';

suite('menu-test', () => {

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
            new SingleMenuAction({
                id: 'action1',
                enabled: true,
                extraClassName: 'action1',
                callback: (ctx: any) => {
                    cnt += ctx;
                },
                checked: true,
                shortcut: new Shortcut(true, false, false, false, KeyCode.KeyA),
            }),
            MenuSeperatorAction.instance,
            new SingleMenuAction({
                id: 'action2',
                extraClassName: 'action2',
                enabled: true,
                callback: (ctx: any) => {
                    cnt += ctx + 1;
                },
                checked: false,
                shortcut: new Shortcut(true, true, false, false, KeyCode.KeyA),
            }),
            MenuSeperatorAction.instance,
            new SingleMenuAction({
                id: 'action3',
                extraClassName: 'action3',
                enabled: false,
                callback: (ctx: any) => {
                    cnt += ctx + 2;
                },
                checked: false,
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

        // TODO: submenu
    });

    test('submeun', () => {
        test('menu', () => {

            /**
             * - action1
             * - seperator
             * - submenu1
             *      - action2
             *      - seperator
             *      - action3
             */
            const menu = new MenuWithSubmenu(
                new Menu(document.body, {
                    contextProvider: () => 1,
                    actionItemProviders: [],
                })
            );
    
            menu.build([
                new SingleMenuAction({
                    id: 'action1',
                    enabled: true,
                    extraClassName: 'action1',
                    callback: (ctx: any) => {
                        cnt += ctx;
                    },
                    checked: true,
                    shortcut: new Shortcut(true, false, false, false, KeyCode.KeyA),
                }),
                MenuSeperatorAction.instance,
                new SubmenuAction(
                    [
                        new SingleMenuAction({
                            id: 'action2',
                            extraClassName: 'action2',
                            enabled: true,
                            callback: (ctx: any) => {
                                cnt += ctx + 1;
                            },
                            checked: false,
                            shortcut: new Shortcut(true, true, false, false, KeyCode.KeyA),
                        }),
                        MenuSeperatorAction.instance,
                        new SingleMenuAction({
                            id: 'action3',
                            extraClassName: 'action3',
                            enabled: false,
                            callback: (ctx: any) => {
                                cnt += ctx + 2;
                            },
                            checked: false,
                            shortcut: new Shortcut(true, true, true, false, KeyCode.KeyA),
                        }),
                    ],
                    {
                        id: 'submenu1',
                        enabled: true,
                        extraClassName: 'submenu1',
                    }
                ),
            ]);
    
            assert.strictEqual(menu.size(), 3);
            assert.ok(menu.has('action1'));
            assert.ok(menu.has('seperator'));
            assert.ok(menu.has('submenu1'));
            assert.ok(!menu.has('action2'));
            assert.ok(!menu.has('action3'));
            assert.ok(!menu.has('action4'));
    
            let cnt = 0;
            menu.run('action1');
            assert.strictEqual(cnt, 1);
            menu.run('action2');
            assert.strictEqual(cnt, 1);
    
            // TODO: submenu
        });
    });

});