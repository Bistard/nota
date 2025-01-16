import { suite, test } from 'mocha';
import * as assert from 'assert';
import { MRU } from 'src/base/common/utilities/mru';

suite('MRU', () => {
    suite('length', () => {
        test('should return correct length for an empty MRU', () => {
            const mru = new MRU<number>();
            assert.strictEqual(mru.length, 0);
        });

        test('should return correct length for non-empty MRU', () => {
            const mru = new MRU<number>((a, b) => a === b, [1, 2, 3]);
            assert.strictEqual(mru.length, 3);
        });
    });

    suite('getItems', () => {
        test('should return all items in MRU order', () => {
            const mru = new MRU<number>((a, b) => a === b, [1, 2, 3]);
            assert.deepStrictEqual(mru.getItems(), [1, 2, 3]);
        });

        test('should return a new array instance', () => {
            const mru = new MRU<number>((a, b) => a === b, [1, 2, 3]);
            const items = mru.getItems();
            items.push(4);
            assert.deepStrictEqual(mru.getItems(), [1, 2, 3]);
        });
    });

    suite('use', () => {
        test('should add a new item to the MRU list if not present', () => {
            const mru = new MRU<number>((a, b) => a === b);
            mru.use(1);
            assert.deepStrictEqual(mru.getItems(), [1]);
        });

        test('should move an existing item to the most recently used position', () => {
            const mru = new MRU<number>((a, b) => a === b, [1, 2, 3]);
            mru.use(2);
            assert.deepStrictEqual(mru.getItems(), [2, 1, 3]);
        });

        test('should respect custom compare function when adding or moving items', () => {
            const mru = new MRU<{ id: number, name: string }>(
                (a, b) => a.id === b.id,
                [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
            );
            mru.use({ id: 1, name: 'Alice' });
            assert.deepStrictEqual(mru.getItems(), [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);

            mru.use({ id: 3, name: 'Charlie' });
            assert.deepStrictEqual(mru.getItems(), [{ id: 3, name: 'Charlie' }, { id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
        });
    });

    suite('remove', () => {
        test('should remove an item if it exists in the MRU list', () => {
            const mru = new MRU<number>((a, b) => a === b, [1, 2, 3]);
            const result = mru.remove(2);
            assert.strictEqual(result, true);
            assert.deepStrictEqual(mru.getItems(), [1, 3]);
        });

        test('should return false if the item does not exist in the MRU list', () => {
            const mru = new MRU<number>((a, b) => a === b, [1, 2, 3]);
            const result = mru.remove(4);
            assert.strictEqual(result, false);
            assert.deepStrictEqual(mru.getItems(), [1, 2, 3]);
        });

        test('should respect custom compare function when removing items', () => {
            const mru = new MRU<{ id: number, name: string }>(
                (a, b) => a.id === b.id,
                [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
            );
            const result = mru.remove({ id: 2, name: 'Bob' });
            assert.strictEqual(result, true);
            assert.deepStrictEqual(mru.getItems(), [{ id: 1, name: 'Alice' }]);
        });

        test('should not remove any items if the custom compare function does not match', () => {
            const mru = new MRU<{ id: number, name: string }>(
                (a, b) => a.id === b.id,
                [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
            );
            const result = mru.remove({ id: 3, name: 'Charlie' });
            assert.strictEqual(result, false);
            assert.deepStrictEqual(mru.getItems(), [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
        });
    });
});