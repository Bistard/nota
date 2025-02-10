import * as assert from 'assert';
import { Action, ActionList, ActionListItem, IAction, IActionListItem } from 'src/base/common/action';

suite('action-test', () => {
    class TestItem extends ActionListItem<IAction> implements IActionListItem<IAction> {}

    class ConcreteActionList extends ActionList<IAction, TestItem> {

    }

    test('action', () => {
        let cnt = 0;
        
        const action = new Action({
            id: 'action',
            enabled: true,
            callback: (val: number = 1) => cnt += val,
        });

        action.run();
        assert.strictEqual(cnt, 1);

        action.run(3);
        assert.strictEqual(cnt, 4);

        action.enabled = false;
        action.run();
        assert.strictEqual(cnt, 4);
    });

    test('action-list', () => {
        const list = new ConcreteActionList({
            contextProvider: () => 2,
            actionItemProviders: [
                (action) => {
                    return new TestItem(action);
                }
            ]
        });

        assert.strictEqual(list.empty(), true);
        assert.strictEqual(list.size(), 0);

        let cnt = 1;

        list.insert([
            new Action({ 
                id: 'addition', 
                enabled: true,
                callback: (val: number) => cnt += val,
            }),
            new Action({ 
                id: 'subtraction', 
                enabled: true,
                callback: (val: number) => cnt -= val,
            }),
            new Action({ 
                id: 'multiply', 
                enabled: true,
                callback: (val: number) => cnt *= val,
            })
        ]);

        assert.strictEqual(list.empty(), false);
        assert.strictEqual(list.size(), 3);
        assert.strictEqual(list.has('addition'), true);
        assert.strictEqual(list.has('subtraction'), true);
        assert.strictEqual(list.has('multiply'), true);
        assert.strictEqual(list.has('does not exist'), false);
        
        list.run('addition');
        assert.strictEqual(cnt, 3);
        
        list.run('subtraction');
        assert.strictEqual(cnt, 1);
        
        list.run('multiply');
        assert.strictEqual(cnt, 2);

        let addition = list.get('addition');
        addition?.run(8);
        assert.strictEqual(cnt, 10);

        list.delete('addition');
        assert.strictEqual(list.size(), 2);
        
        list.run('addition');
        assert.strictEqual(cnt, 10);

        addition = list.get('addition');
        addition?.run();
        assert.strictEqual(cnt, 10);

        list.run('multiply');
        assert.strictEqual(cnt, 20);

        list.dispose();
        assert.strictEqual(list.size(), 0);
        assert.strictEqual(list.empty(), true);
    });
});