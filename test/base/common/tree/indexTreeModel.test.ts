import * as assert from 'assert';
import { ISpliceable } from 'src/base/common/range';
import { IIndexTreeNode, IndexTreeModel } from 'src/base/common/tree/indexTreeModel';

function toList<T>(arr: T[]): ISpliceable<T> {
	return {
		splice(start: number, deleteCount: number, elements: T[]): void {
			arr.splice(start, deleteCount, ...elements);
		}
	};
}

suite('indexTreeModel-test', () => {

    test('constructor', () => {
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(toList(list));
        assert.strictEqual(list.length, 0);
    });

    test('insert', () => {
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(toList(list));

        model.splice([0], 0, [
            {data: 1},
            {data: 3},
            {data: 2},
        ]);

        assert.strictEqual(list.length, 3);
        
        assert.strictEqual(list[0]!.depth, 1);
        assert.strictEqual(list[0]!.data, 1);
        assert.strictEqual(list[0]!.collapsed, false);
        assert.strictEqual(list[0]!.visibleNodeCount, 1);

        assert.strictEqual(list[1]!.depth, 1);
        assert.strictEqual(list[1]!.data, 3);
        assert.strictEqual(list[1]!.collapsed, false);
        assert.strictEqual(list[1]!.visibleNodeCount, 1);
        
        assert.strictEqual(list[2]!.depth, 1);
        assert.strictEqual(list[2]!.data, 2);
        assert.strictEqual(list[2]!.collapsed, false);
        assert.strictEqual(list[2]!.visibleNodeCount, 1);
    });

    test('nest-insert', () => {
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(toList(list));

        model.splice([0], 0, [
            {
                data: 1, 
                children: [
                    {data: 3},
                    {data: 2},
                ]
            }, {
                data: 4,
                children: [
                    {data: 6},
                    {data: 5}
                ]
            }
        ]);

        assert.strictEqual(list.length, 6);

        assert.strictEqual(list[0]!.data, 1);
        assert.strictEqual(list[0]!.depth, 1);
        assert.strictEqual(list[0]!.collapsed, false);
        assert.strictEqual(list[0]!.visibleNodeCount, 3);

        assert.strictEqual(list[1]!.data, 3);
        assert.strictEqual(list[1]!.depth, 2);
        assert.strictEqual(list[1]!.collapsed, false);
        assert.strictEqual(list[1]!.visibleNodeCount, 1);

        assert.strictEqual(list[2]!.data, 2);
        assert.strictEqual(list[2]!.depth, 2);
        assert.strictEqual(list[2]!.collapsed, false);
        assert.strictEqual(list[2]!.visibleNodeCount, 1);

        assert.strictEqual(list[3]!.data, 4);
        assert.strictEqual(list[3]!.depth, 1);
        assert.strictEqual(list[3]!.collapsed, false);
        assert.strictEqual(list[3]!.visibleNodeCount, 3);

        assert.strictEqual(list[4]!.data, 6);
        assert.strictEqual(list[4]!.depth, 2);
        assert.strictEqual(list[4]!.collapsed, false);
        assert.strictEqual(list[4]!.visibleNodeCount, 1);

        assert.strictEqual(list[5]!.data, 5);
        assert.strictEqual(list[5]!.depth, 2);
        assert.strictEqual(list[5]!.collapsed, false);
        assert.strictEqual(list[5]!.visibleNodeCount, 1);
    });

    test('nest-insert-collapsed', () => {
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(toList(list));

        model.splice([0], 0, [
            {
                data: 1, 
                collapsed: true,
                children: [
                    {data: 3},
                    {data: 2},
                ]
            }, {
                data: 4,
                children: [
                    {data: 6},
                    {data: 5}
                ]
            }
        ]);

        assert.strictEqual(list.length, 4);

        assert.strictEqual(list[0]!.data, 1);
        assert.strictEqual(list[0]!.depth, 1);
        assert.strictEqual(list[0]!.collapsed, true);
        assert.strictEqual(list[0]!.visibleNodeCount, 1);

        assert.strictEqual(list[1]!.data, 4);
        assert.strictEqual(list[1]!.depth, 1);
        assert.strictEqual(list[1]!.collapsed, false);
        assert.strictEqual(list[1]!.visibleNodeCount, 3);

        assert.strictEqual(list[2]!.data, 6);
        assert.strictEqual(list[2]!.depth, 2);
        assert.strictEqual(list[2]!.collapsed, false);
        assert.strictEqual(list[2]!.visibleNodeCount, 1);

        assert.strictEqual(list[3]!.data, 5);
        assert.strictEqual(list[3]!.depth, 2);
        assert.strictEqual(list[3]!.collapsed, false);
        assert.strictEqual(list[3]!.visibleNodeCount, 1);
    });

    test('delete', () => {

    });

    test('nest-delete', () => {

    });

});