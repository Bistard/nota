import * as assert from 'assert';
import { ISpliceable } from 'src/base/common/range';
import { MultiTreeModel } from 'src/base/common/tree/multiTreeModel';
import { ITreeNode } from 'src/base/common/tree/tree';

function toList<T>(arr: T[]): ISpliceable<T> {
	return {
		splice(start: number, deleteCount: number, elements: T[]): void {
			arr.splice(start, deleteCount, ...elements);
		}
	};
}

function toArray<T>(list: ITreeNode<T>[]): T[] {
	return list.map(i => i.data);
}

suite('multiTreeModel-test', () => {

    test('constructor', () => {
        const list: ITreeNode<number>[] = [];
        const model = new MultiTreeModel<number>(toList(list));
        assert.deepStrictEqual(list.length, 0);
        assert.deepStrictEqual(model.size(), 0);
    });

    test('splice', () => {
        const list: ITreeNode<number>[] = [];
        const model = new MultiTreeModel<number>(toList(list));

        model.splice(null, 0, [
            {data: 1},
            {data: 2},
            {data: 3},
        ]);

        assert.deepStrictEqual(list.length, 3);
        assert.deepStrictEqual(model.size(), 3);
        assert.deepStrictEqual(toArray(list), [1, 2, 3]);

        model.splice(null, Number.MAX_VALUE, [
            {data: 3},
            {data: 2},
            {data: 1},
        ]);

        assert.deepStrictEqual(list.length, 3);
        assert.deepStrictEqual(model.size(), 3);
        assert.deepStrictEqual(toArray(list), [3, 2, 1]);

        model.splice(null, Number.MAX_VALUE, []);
		assert.deepStrictEqual(toArray(list), []);
		assert.strictEqual(model.size(), 0);
    });

    test('splice nested', () => {
        const list: ITreeNode<number>[] = [];
        const model = new MultiTreeModel<number>(toList(list));

        model.splice(null, Number.MAX_VALUE, [
			{
				data: 0, children: [
					{ data: 10 },
					{ data: 11 },
					{ data: 12 },
				]
			},
			{ data: 1 },
			{ data: 2 }
		]);
        assert.deepStrictEqual(toArray(list), [0, 10, 11, 12, 1, 2]);
		assert.strictEqual(model.size(), 6);

		model.splice(12, Number.MAX_VALUE, [
			{ data: 120 },
			{ data: 121 }
		]);

		assert.deepStrictEqual(toArray(list), [0, 10, 11, 12, 120, 121, 1, 2]);
		assert.strictEqual(model.size(), 8);

		model.splice(0, Number.MAX_VALUE, []);
		assert.deepStrictEqual(toArray(list), [0, 1, 2]);
		assert.strictEqual(model.size(), 3);

		model.splice(null, Number.MAX_VALUE);
		assert.deepStrictEqual(toArray(list), []);
		assert.strictEqual(model.size(), 0);
    });

    test('splice on collapsed node', () => {
        const list: ITreeNode<number>[] = [];
		const model = new MultiTreeModel<number>(toList(list));

		model.splice(null, Number.MAX_VALUE, [
			{ data: 0, collapsed: true }
		]);

		assert.deepStrictEqual(toArray(list), [0]);

		model.splice(0, Number.MAX_VALUE, [
			{ data: 1 },
			{ data: 2 }
		]);

		assert.deepStrictEqual(toArray(list), [0]);

		model.setCollapsed(0, false);
		assert.deepStrictEqual(toArray(list), [0, 1, 2]);
    });

    test('expandTo', () => {
        const list: ITreeNode<number>[] = [];
		const model = new MultiTreeModel<number>(toList(list), { collapsedByDefault: true });

		model.splice(null, Number.MAX_VALUE, [
			{
				data: 0, children: [
					{ data: 10, children: [{ 
                        data: 100, 
                        children: [{ 
                            data: 1000 
                        }] 
                    }] 
                },
					{ data: 11 },
					{ data: 12 },
				]
			},
			{ data: 1 },
			{ data: 2 }
		]);

		assert.deepStrictEqual(toArray(list), [0, 1, 2]);
		model.setExpandTo(1000);
		assert.deepStrictEqual(toArray(list), [0, 10, 100, 1000, 11, 12, 1, 2]);
    });

});