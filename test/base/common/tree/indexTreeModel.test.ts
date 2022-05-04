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
        assert.deepStrictEqual(list.length, 0);
    });

    test('insert', () => {
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(toList(list));

        model.splice([0], 0, [
            {data: 1},
            {data: 3},
            {data: 2},
        ]);

        assert.deepStrictEqual(list.length, 3);
        
        assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.data, 1);
        assert.deepStrictEqual(list[0]!.collapsed, false);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[1]!.depth, 1);
        assert.deepStrictEqual(list[1]!.data, 3);
        assert.deepStrictEqual(list[1]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 1);
        
        assert.deepStrictEqual(list[2]!.depth, 1);
        assert.deepStrictEqual(list[2]!.data, 2);
        assert.deepStrictEqual(list[2]!.collapsed, false);
        assert.deepStrictEqual(list[2]!.visibleNodeCount, 1);
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

        assert.deepStrictEqual(list.length, 6);

        assert.deepStrictEqual(list[0]!.data, 1);
        assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.collapsed, false);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 3);

        assert.deepStrictEqual(list[1]!.data, 3);
        assert.deepStrictEqual(list[1]!.depth, 2);
        assert.deepStrictEqual(list[1]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[2]!.data, 2);
        assert.deepStrictEqual(list[2]!.depth, 2);
        assert.deepStrictEqual(list[2]!.collapsed, false);
        assert.deepStrictEqual(list[2]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[3]!.data, 4);
        assert.deepStrictEqual(list[3]!.depth, 1);
        assert.deepStrictEqual(list[3]!.collapsed, false);
        assert.deepStrictEqual(list[3]!.visibleNodeCount, 3);

        assert.deepStrictEqual(list[4]!.data, 6);
        assert.deepStrictEqual(list[4]!.depth, 2);
        assert.deepStrictEqual(list[4]!.collapsed, false);
        assert.deepStrictEqual(list[4]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[5]!.data, 5);
        assert.deepStrictEqual(list[5]!.depth, 2);
        assert.deepStrictEqual(list[5]!.collapsed, false);
        assert.deepStrictEqual(list[5]!.visibleNodeCount, 1);
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

        assert.deepStrictEqual(list.length, 4);

        assert.deepStrictEqual(list[0]!.data, 1);
        assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.collapsed, true);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[1]!.data, 4);
        assert.deepStrictEqual(list[1]!.depth, 1);
        assert.deepStrictEqual(list[1]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 3);

        assert.deepStrictEqual(list[2]!.data, 6);
        assert.deepStrictEqual(list[2]!.depth, 2);
        assert.deepStrictEqual(list[2]!.collapsed, false);
        assert.deepStrictEqual(list[2]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[3]!.data, 5);
        assert.deepStrictEqual(list[3]!.depth, 2);
        assert.deepStrictEqual(list[3]!.collapsed, false);
        assert.deepStrictEqual(list[3]!.visibleNodeCount, 1);
    });

    test('delete', () => {
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(toList(list));

        model.splice([0], 0, [
            {data: 1},
            {data: 2},
            {data: 3},
        ]);
        assert.deepStrictEqual(list.length, 3);
        
        model.splice([1], 1, []);
        assert.deepStrictEqual(list.length, 2);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[0]!.depth, 1);

		assert.deepStrictEqual(list[1]!.data, 3);
		assert.deepStrictEqual(list[1]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.depth, 1);

        model.splice([0], 2, []);
        assert.deepStrictEqual(list.length, 0);
    });

    test('nest-delete', () => {
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
            },
            { data: 7 }
        ]);
        assert.deepStrictEqual(list.length, 7);

        model.splice([1], 2, []);
        assert.deepStrictEqual(list.length, 3);
        assert.deepStrictEqual(list[0]!.data, 1);
        assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visible, true);
        assert.deepStrictEqual(list[0]!.collapsed, false);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 3);

        assert.deepStrictEqual(list[1]!.data, 3);
        assert.deepStrictEqual(list[1]!.depth, 2);
        assert.deepStrictEqual(list[1]!.visible, true);
        assert.deepStrictEqual(list[1]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[2]!.data, 2);
        assert.deepStrictEqual(list[2]!.depth, 2);
        assert.deepStrictEqual(list[2]!.visible, true);
        assert.deepStrictEqual(list[2]!.collapsed, false);
        assert.deepStrictEqual(list[2]!.visibleNodeCount, 1);

        model.splice([0, 1], 1, []);

        assert.deepStrictEqual(list.length, 2);

        assert.deepStrictEqual(list[0]!.data, 1);
        assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visible, true);
        assert.deepStrictEqual(list[0]!.collapsed, false);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 2);

        assert.deepStrictEqual(list[1]!.data, 3);
        assert.deepStrictEqual(list[1]!.depth, 2);
        assert.deepStrictEqual(list[1]!.visible, true);
        assert.deepStrictEqual(list[1]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 1);
    });

    test('invisible delete', () => {
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
                collapsed: true,
                children: [
                    {data: 6},
                    {data: 5}
                ]
            },
            { data: 7 }
        ]);
        assert.deepStrictEqual(list.length, 3);

        model.splice([0, 1], 1, []);
        assert.deepStrictEqual(list.length, 3);

        model.splice([0, 0], 1, []);
        assert.deepStrictEqual(list.length, 3);

        model.splice([1, 0], 10, []);
        assert.deepStrictEqual(list.length, 3);
    });

    test('set-collapsed', () => {
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
            },
            { data: 7 }
        ]);
        assert.deepStrictEqual(list.length, 7);

    });

});