import * as assert from 'assert';
import { ISpliceable } from 'src/base/common/range';
import { FlexIndexTreeModel, IndexTreeModel } from 'src/base/browser/secondary/tree/indexTreeModel';
import { ITreeFilterProvider, ITreeFilterResult } from 'src/base/browser/secondary/tree/treeFilter';
import { IFlexNode, ITreeNode } from 'src/base/browser/secondary/tree/tree';
import { dfs } from 'test/utils/helpers';

suite('indexTreeModel-test', () => {

    function toList<T>(arr: T[]): ISpliceable<T> {
        return {
            splice(start: number, deleteCount: number, elements: T[]): void {
                arr.splice(start, deleteCount, ...elements);
            }
        };
    }

    function toArray<T, TFilter>(arr: ITreeNode<T, TFilter>[]): T[] {
        return arr.map(node => node.data);
    }

    test('constructor', () => {
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));
        assert.deepStrictEqual(list.length, 0);
    });

    test('insert', () => {
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

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
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

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

    test('onDidSplice', () => {
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

        let cnt = 0;
        let inserted: ITreeNode<number, void>[] = [];
        model.onDidSplice((e) => {
            e.inserted.forEach(() => cnt++);
            inserted = e.inserted;
        });

        model.splice([0], 0, [
            {data: 1},
            {data: 3},
            {data: 2},
        ]);
        assert.strictEqual(cnt, 3);
        let insertedValues: number[] = [];
        inserted.forEach(child => dfs(child, 'children', node => insertedValues.push(node.data)));
        assert.deepStrictEqual([1, 3, 2], insertedValues);

        model.splice([0], 3, []);
        assert.strictEqual(cnt, 3);
        insertedValues = [];
        inserted.forEach(child => dfs(child, 'children', node => insertedValues.push(node.data)));
        assert.deepStrictEqual([], insertedValues);
    });

    test('getNodeLocation', () => {
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

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
        assert.deepStrictEqual(model.getNodeLocation(list[0]!), [0]);
        assert.deepStrictEqual(model.getNodeLocation(list[1]!), [0, 0]);
        assert.deepStrictEqual(model.getNodeLocation(list[2]!), [0, 1]);
        assert.deepStrictEqual(model.getNodeLocation(list[3]!), [1]);
        assert.deepStrictEqual(model.getNodeLocation(list[4]!), [1, 0]);
        assert.deepStrictEqual(model.getNodeLocation(list[5]!), [1, 1]);
    });

    test('nest-insert-collapsed', () => {
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

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
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

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
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

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
            {   data: 7 }
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
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

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
            {   data: 7 }
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
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

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
            {   data: 7 }
        ]);
        assert.deepStrictEqual(list.length, 7);

        model.setCollapsed([0], true);
        assert.deepStrictEqual(list.length, 5);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsed, true);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[1]!.data, 4);
		assert.deepStrictEqual(list[1]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.depth, 1);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 3);

        assert.deepStrictEqual(list[2]!.data, 6);
		assert.deepStrictEqual(list[2]!.collapsed, false);
		assert.deepStrictEqual(list[2]!.depth, 2);
        assert.deepStrictEqual(list[2]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[3]!.data, 5);
		assert.deepStrictEqual(list[3]!.collapsed, false);
		assert.deepStrictEqual(list[3]!.depth, 2);
        assert.deepStrictEqual(list[3]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[4]!.data, 7);
		assert.deepStrictEqual(list[4]!.collapsed, false);
		assert.deepStrictEqual(list[4]!.depth, 1);
        assert.deepStrictEqual(list[4]!.visibleNodeCount, 1);
    });

    test('set-nested-collapsed', () => {
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

        model.splice([0], 0, [
            {
                data: 1, 
                children: [
                    {data: 3},
                    {data: 2, children: [
                        { data: 4 },
                        { data: 6 },
                        { data: 5 },
                    ]},
                ]
            }, 
            {   data: 7 }
        ]);
        assert.deepStrictEqual(list.length, 7);

        model.setCollapsed([0], true);
        assert.deepStrictEqual(list.length, 2);
        
        assert.deepStrictEqual(list[0]!.data, 1);
        assert.deepStrictEqual(list[0]!.collapsed, true);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[1]!.data, 7);
        assert.deepStrictEqual(list[1]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.depth, 1);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 1);

        model.setCollapsed([0], false);
        assert.deepStrictEqual(list.length, 7);

        assert.deepStrictEqual(list[0]!.data, 1);
        assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 6);

        assert.deepStrictEqual(list[1]!.data, 3);
        assert.deepStrictEqual(list[1]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.depth, 2);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[2]!.data, 2);
        assert.deepStrictEqual(list[2]!.collapsed, false);
		assert.deepStrictEqual(list[2]!.depth, 2);
        assert.deepStrictEqual(list[2]!.visibleNodeCount, 4);
    });

    test('set-collapsed-recursive', () => {
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

        model.splice([0], 0, [
            {
                data: 1, 
                children: [
                    {data: 3},
                    {data: 2, children: [
                        { data: 4 },
                        { data: 6 },
                        { data: 5 },
                    ]},
                ]
            }, 
            {   data: 7 }
        ]);
        assert.deepStrictEqual(list.length, 7);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 6);

        model.setCollapsed([0], true, true);
        assert.deepStrictEqual(list.length, 2);

        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsed, true);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[1]!.data, 7);
		assert.deepStrictEqual(list[1]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.depth, 1);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 1);

        model.setCollapsed([0], false, true);
        assert.deepStrictEqual(list.length, 7);

        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 6);
        
        assert.deepStrictEqual(list[1]!.data, 3);
		assert.deepStrictEqual(list[1]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.depth, 2);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[2]!.data, 2);
		assert.deepStrictEqual(list[2]!.collapsed, false);
		assert.deepStrictEqual(list[2]!.depth, 2);
        assert.deepStrictEqual(list[2]!.visibleNodeCount, 4);

        assert.deepStrictEqual(list[3]!.data, 4);
		assert.deepStrictEqual(list[3]!.collapsed, false);
		assert.deepStrictEqual(list[3]!.depth, 3);
        assert.deepStrictEqual(list[3]!.visibleNodeCount, 1);
        
        assert.deepStrictEqual(list[4]!.data, 6);
		assert.deepStrictEqual(list[4]!.collapsed, false);
		assert.deepStrictEqual(list[4]!.depth, 3);
        assert.deepStrictEqual(list[4]!.visibleNodeCount, 1);
        
        assert.deepStrictEqual(list[5]!.data, 5);
		assert.deepStrictEqual(list[5]!.collapsed, false);
		assert.deepStrictEqual(list[5]!.depth, 3);
        assert.deepStrictEqual(list[5]!.visibleNodeCount, 1);
    });

    test('onDidChangeCollapseState', () => {
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

        model.splice([0], 0, [
            {
                data: 1, 
                children: [
                    {data: 3},
                    {data: 2, children: [
                        { data: 4 },
                        { data: 6 },
                        { data: 5 },
                    ]},
                ]
            }, 
            {   data: 7 }
        ]);
        assert.deepStrictEqual(list.length, 7);

        let collapseCnt = 0;
        model.onDidChangeCollapseState((e) => {
            collapseCnt++;
        });

        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 6);

        model.setCollapsed([0], true, true);
        assert.strictEqual(collapseCnt, 2);

        model.setCollapsed([0, 1], false, true);
        assert.strictEqual(collapseCnt, 3);

        model.setCollapsed([0], undefined, true);
        assert.strictEqual(collapseCnt, 4);
    });

    test('set-collapsible', () => {
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

        model.splice([0], 0, [
            { data: 1, children: [
                { data: 2 }
            ]}
        ]);
        assert.deepStrictEqual(list.length, 2);
        
        model.setCollapsible([0], false);
        assert.deepStrictEqual(list.length, 2);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, false);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, false);
		assert.deepStrictEqual(list[1]!.collapsed, false);

        assert.deepStrictEqual(model.setCollapsed([0], true), false);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, false);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, false);
		assert.deepStrictEqual(list[1]!.collapsed, false);

        assert.deepStrictEqual(model.setCollapsed([0], false), false);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, false);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, false);
		assert.deepStrictEqual(list[1]!.collapsed, false);

        model.setCollapsible([0], true);
        assert.deepStrictEqual(list.length, 2);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, false);
		assert.deepStrictEqual(list[1]!.collapsed, false);

        assert.deepStrictEqual(model.setCollapsed([0], true), true);
        assert.deepStrictEqual(list.length, 1);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, true);

        assert.deepStrictEqual(model.setCollapsed([0], false), true);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, false);
		assert.deepStrictEqual(list[1]!.collapsed, false);
    });

    test('set-nested-collapsible', () => {
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

        model.splice([0], 0, [
            { data: 1, children: [
                { data: 2, children: [
                    { data: 3 }
                ] }
            ]}
        ]);
        assert.deepStrictEqual(list.length, 3);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, true);
		assert.deepStrictEqual(list[2]!.collapsed, false);
        assert.deepStrictEqual(list[2]!.data, 3);
		assert.deepStrictEqual(list[2]!.collapsible, false);
		assert.deepStrictEqual(list[2]!.collapsed, false);
        
        model.setCollapsible([0, 0, 0], true);
        assert.deepStrictEqual(list[2]!.data, 3);
		assert.deepStrictEqual(list[2]!.collapsible, true);
		assert.deepStrictEqual(list[2]!.collapsed, false);

        model.setCollapsible([0, 0, 0], false);
        assert.deepStrictEqual(list.length, 3);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, true);
		assert.deepStrictEqual(list[2]!.collapsed, false);
        assert.deepStrictEqual(list[2]!.data, 3);
		assert.deepStrictEqual(list[2]!.collapsible, false);
		assert.deepStrictEqual(list[2]!.collapsed, false);
        
    });

    test('auto-update-collapsible', () => {
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

        model.splice([0], 0, [
            { data: 1, children: [
                { data: 2 }
            ]}
        ]);

        assert.strictEqual(list[0]!.collapsible, true);
        assert.strictEqual(list[1]!.collapsible, false);

        model.splice([0, 0], 1, []);
        assert.strictEqual(list.length, 1);
        assert.strictEqual(list[0]!.data, 1);
        assert.strictEqual(list[0]!.collapsible, false);

        model.splice([0, 0], 0, [{ data: 2 }]);
        assert.strictEqual(list[0]!.collapsible, true);
        assert.strictEqual(list[1]!.collapsible, false);
    });

    test('expand', () => {
        const list: ITreeNode<number>[] = [];
        const model = new IndexTreeModel<number, void>(-1, toList(list));

        model.splice([0], 0, [
            { data: 1, children: [
                { data: 2, children: [
                    { data: 3 }
                ] }
            ] }
        ]);
        assert.deepStrictEqual(list.length, 3);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, true);
		assert.deepStrictEqual(list[1]!.collapsed, false);
        assert.deepStrictEqual(list[2]!.data, 3);
		assert.deepStrictEqual(list[2]!.collapsible, false);
		assert.deepStrictEqual(list[2]!.collapsed, false);

        model.setCollapsed([0], true, true);
        assert.deepStrictEqual(list.length, 1);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, true);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 1);

        model.setExpandTo([0, 0, 0]);
        assert.deepStrictEqual(list.length, 3);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, true);
		assert.deepStrictEqual(list[1]!.collapsed, false);
        assert.deepStrictEqual(list[2]!.data, 3);
		assert.deepStrictEqual(list[2]!.collapsible, false);
		assert.deepStrictEqual(list[2]!.collapsed, false);
    });

    suite('filter', () => {
        
        test('basic', () => {
            const list: ITreeNode<number, boolean>[] = [];
            let shouldFilter = false;
            const filter = new class implements ITreeFilterProvider<number, boolean> {
                public filter(element: number): ITreeFilterResult<boolean> {
                    const filtered = (!shouldFilter || element % 2 === 0);
                    return {
                        visibility: true,
                        filterMetadata: filtered === false ? undefined : true,
                    };
                }
            };

            const model = new IndexTreeModel<number, boolean>(-1, toList(list), { 
                filter: filter,
                collapsedByDefault: false,
            });

            model.splice([0], 0, [
                {
                    data: 0, children: [
                        { data: 1 },
                        { data: 2 },
                        { data: 3 },
                        { data: 4 },
                        { data: 5 },
                        { data: 6 },
                        { data: 7 },
                    ]
                },
            ]);

            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);

            model.filter();
            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);

            shouldFilter = true;
            model.filter();
            assert.deepStrictEqual(toArray(list), [0, 2, 4, 6]);

            shouldFilter = false;
            model.filter();
            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);
        });

        test('visibleOnly', () => {

            const list: ITreeNode<number, boolean>[] = [];
            let shouldFilter = false;
            const filter = new class implements ITreeFilterProvider<number, boolean> {
                public filter(element: number): ITreeFilterResult<boolean> {
                    return {
                        visibility: true,
                        filterMetadata: !shouldFilter,
                    };
                }
            };

            const model = new IndexTreeModel<number, boolean>(-1, toList(list), { 
                filter: filter,
                collapsedByDefault: false,
            });

            model.splice([0], 0, [
                {
                    data: 0, children: [
                        { data: 1, collapsed: true, children: [
                            { data: 4 },
                        ] },
                        { data: 2, collapsed: true, children: [
                            { data: 5 },
                        ] },
                        { data: 3, collapsed: true, children: [
                            { data: 6 },
                        ] },
                    ],
                },
            ]);

            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3]);
            shouldFilter = false;

            model.filter(true);
            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3]);

            model.filter(false);
            assert.deepStrictEqual(toArray(list), [0, 1, 4, 2, 5, 3, 6]);
        });
    });
});

suite('flexIndexTreeModel-test', () => {
    function toList<T>(arr: T[]): ISpliceable<T> {
        return {
            splice(start: number, deleteCount: number, elements: T[]): void {
                arr.splice(start, deleteCount, ...elements);
            }
        };
    }

    function toArray<T, TFilter>(arr: IFlexNode<T, TFilter>[]): T[] {
        return arr.map(node => node.data);
    }

    function createFlexNode<T, TFilter>(data: T, parent: IFlexNode<T, TFilter>, collapsed: boolean = false): IFlexNode<T, TFilter> {
        return {
            data: data,
            parent: parent,
            depth: parent.depth + 1,
            visible: true,
            collapsible: false,
            collapsed: collapsed,
            children: [],
            visibleNodeCount: 1,
        };
    }

    function setNewChildren<T, TFilter>(node: IFlexNode<T, TFilter>, children: IFlexNode<T, TFilter>[]): void {
        node.oldChildren = node.children;
        node.children = children;
        node.stale = true;
    }

    test('constructor', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));
        assert.deepStrictEqual(list.length, 0);
    });

    test('insert', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;
        
        setNewChildren(root, [
            createFlexNode(1, root), 
            createFlexNode(3, root), 
            createFlexNode(2, root),
        ]);
        model.refresh();

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
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;
        
        const node1 = createFlexNode(1, root);
        node1.children = [
            createFlexNode(3, node1),
            createFlexNode(2, node1),
        ];

        const node4 = createFlexNode(4, root);
        node4.children = [
            createFlexNode(6, node4),
            createFlexNode(5, node4),
        ];

        root.children = [
            node1,
            node4,
        ];
        setNewChildren(root, [
            node1,
            node4,
        ]);
        model.refresh();

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

    test('onDidSplice', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        let cnt = 0;
        let inserted: ITreeNode<number, void>[] = [];
        model.onDidSplice((e) => {
            e.inserted.forEach(() => cnt++);
            inserted = e.inserted;
        });

        const root: IFlexNode<number> = model.rootNode;
        
        setNewChildren(root, [
            createFlexNode(1, root),
            createFlexNode(3, root),
            createFlexNode(2, root),
        ]);
        model.refresh();
        assert.strictEqual(cnt, 3);
        
        let insertedValues: number[] = [];
        inserted.forEach(child => dfs(child, 'children', node => insertedValues.push(node.data)));
        assert.deepStrictEqual([1, 3, 2], insertedValues);

        setNewChildren(root, []);
        model.refresh();
        assert.strictEqual(cnt, 3);

        insertedValues = [];
        inserted.forEach(child => dfs(child, 'children', node => insertedValues.push(node.data)));
        assert.deepStrictEqual([], insertedValues);
    });

    test('getNodeLocation', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;
        
        const node1 = createFlexNode(1, root);
        node1.children = [
            createFlexNode(3, node1),
            createFlexNode(2, node1),
        ];

        const node4 = createFlexNode(4, root);
        node4.children = [
            createFlexNode(6, node4),
            createFlexNode(5, node4),
        ];

        root.children = [
            node1,
            node4,
        ];
        setNewChildren(root, [
            node1,
            node4,
        ]);
        model.refresh();

        assert.deepStrictEqual(list.length, 6);
        assert.deepStrictEqual(model.getNodeLocation(list[0]!), [0]);
        assert.deepStrictEqual(model.getNodeLocation(list[1]!), [0, 0]);
        assert.deepStrictEqual(model.getNodeLocation(list[2]!), [0, 1]);
        assert.deepStrictEqual(model.getNodeLocation(list[3]!), [1]);
        assert.deepStrictEqual(model.getNodeLocation(list[4]!), [1, 0]);
        assert.deepStrictEqual(model.getNodeLocation(list[5]!), [1, 1]);
    });

    test('nest-insert-collapsed', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;
        
        const node1 = createFlexNode(1, root);
        setNewChildren(node1, [
            createFlexNode(3, node1),
            createFlexNode(2, node1)],
        );
        node1.collapsed = true;

        const node4 = createFlexNode(4, root);
        node4.children = [
            createFlexNode(6, node4),
            createFlexNode(5, node4),
        ];

        root.children = [
            node1,
            node4,
        ];
        setNewChildren(root, [
            node1,
            node4,
        ]);
        model.refresh();

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
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;
        
        const node1 = createFlexNode(1, root);
        const node2 = createFlexNode(2, root);
        const node3 = createFlexNode(3, root);
        setNewChildren(root, [
            node1, 
            node2, 
            node3,
        ]);
        model.refresh();
        assert.deepStrictEqual(list.length, 3);
        
        setNewChildren(root, [node1, node3]);
        model.refresh();
        assert.deepStrictEqual(list.length, 2);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[0]!.depth, 1);

		assert.deepStrictEqual(list[1]!.data, 3);
		assert.deepStrictEqual(list[1]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.depth, 1);

        setNewChildren(root, []);
        model.refresh();
        assert.deepStrictEqual(list.length, 0);
    });

    test('nest-delete', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;
                
        const node1 = createFlexNode(1, root);
        const node3 = createFlexNode(3, node1);
        const node2 = createFlexNode(2, node1);
        setNewChildren(node1, [
            node3,
            node2,
        ]);

        const node4 = createFlexNode(4, root);
        setNewChildren(node4, [
            createFlexNode(6, node4),
            createFlexNode(5, node4),
        ]);

        const node7 = createFlexNode(7, root);

        setNewChildren(root, [
            node1,
            node4,
            node7,
        ]);
        model.refresh();
        assert.deepStrictEqual(list.length, 7);

        setNewChildren(root, [node1]);
        model.refresh();
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

        setNewChildren(node1, [node3]);
        model.refresh(node1);

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
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;
                
        const node1 = createFlexNode(1, root);
        node1.collapsed = true;

        const node3 = createFlexNode(3, node1);
        const node2 = createFlexNode(2, node1);
        setNewChildren(node1, [
            node3,
            node2,
        ]);

        const node4 = createFlexNode(4, root);
        node4.collapsed = true;
        setNewChildren(node4, [
            createFlexNode(6, node4),
            createFlexNode(5, node4),
        ]);

        const node7 = createFlexNode(7, root);

        setNewChildren(root, [
            node1,
            node4,
            node7,
        ]);
        model.refresh();
        assert.deepStrictEqual(list.length, 3);

        setNewChildren(node1, [node3]);
        model.refresh(node1);
        assert.deepStrictEqual(list.length, 3);
    });

    test('set-collapsed', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;
                
        const node1 = createFlexNode(1, root);
        const node3 = createFlexNode(3, node1);
        const node2 = createFlexNode(2, node1);
        setNewChildren(node1, [
            node3,
            node2,
        ]);

        const node4 = createFlexNode(4, root);
        setNewChildren(node4, [
            createFlexNode(6, node4),
            createFlexNode(5, node4),
        ]);

        const node7 = createFlexNode(7, root);

        setNewChildren(root, [
            node1,
            node4,
            node7,
        ]);

        model.refresh();
        assert.deepStrictEqual(list.length, 7);

        model.setCollapsed([0], true);
        assert.deepStrictEqual(list.length, 5);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsed, true);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[1]!.data, 4);
		assert.deepStrictEqual(list[1]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.depth, 1);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 3);

        assert.deepStrictEqual(list[2]!.data, 6);
		assert.deepStrictEqual(list[2]!.collapsed, false);
		assert.deepStrictEqual(list[2]!.depth, 2);
        assert.deepStrictEqual(list[2]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[3]!.data, 5);
		assert.deepStrictEqual(list[3]!.collapsed, false);
		assert.deepStrictEqual(list[3]!.depth, 2);
        assert.deepStrictEqual(list[3]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[4]!.data, 7);
		assert.deepStrictEqual(list[4]!.collapsed, false);
		assert.deepStrictEqual(list[4]!.depth, 1);
        assert.deepStrictEqual(list[4]!.visibleNodeCount, 1);
    });

    test('set-nested-collapsed', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;

        const node1 = createFlexNode(1, root);

        const node3 = createFlexNode(3, node1);
        const node2 = createFlexNode(2, node1);
        setNewChildren(node1, [node3, node2]);

        const node4 = createFlexNode(4, node2);
        const node6 = createFlexNode(6, node2);
        const node5 = createFlexNode(5, node2);
        setNewChildren(node2, [node4, node6, node5]);

        const node7 = createFlexNode(7, root);
        setNewChildren(root, [node1, node7]);

        model.refresh();
        assert.deepStrictEqual(list.length, 7);

        model.setCollapsed([0], true);
        assert.deepStrictEqual(list.length, 2);
        
        assert.deepStrictEqual(list[0]!.data, 1);
        assert.deepStrictEqual(list[0]!.collapsed, true);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[1]!.data, 7);
        assert.deepStrictEqual(list[1]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.depth, 1);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 1);

        model.setCollapsed([0], false);
        assert.deepStrictEqual(list.length, 7);

        assert.deepStrictEqual(list[0]!.data, 1);
        assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 6);

        assert.deepStrictEqual(list[1]!.data, 3);
        assert.deepStrictEqual(list[1]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.depth, 2);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[2]!.data, 2);
        assert.deepStrictEqual(list[2]!.collapsed, false);
		assert.deepStrictEqual(list[2]!.depth, 2);
        assert.deepStrictEqual(list[2]!.visibleNodeCount, 4);
    });

    test('set-collapsed-recursive', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;

        const node1 = createFlexNode(1, root);

        const node3 = createFlexNode(3, node1);
        const node2 = createFlexNode(2, node1);
        setNewChildren(node1, [node3, node2]);

        const node4 = createFlexNode(4, node2);
        const node6 = createFlexNode(6, node2);
        const node5 = createFlexNode(5, node2);
        setNewChildren(node2, [node4, node6, node5]);

        const node7 = createFlexNode(7, root);
        setNewChildren(root, [node1, node7]);

        model.refresh();
        assert.deepStrictEqual(list.length, 7);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 6);

        model.setCollapsed([0], true, true);
        assert.deepStrictEqual(list.length, 2);

        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsed, true);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[1]!.data, 7);
		assert.deepStrictEqual(list[1]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.depth, 1);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 1);

        model.setCollapsed([0], false, true);
        assert.deepStrictEqual(list.length, 7);

        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 6);
        
        assert.deepStrictEqual(list[1]!.data, 3);
		assert.deepStrictEqual(list[1]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.depth, 2);
        assert.deepStrictEqual(list[1]!.visibleNodeCount, 1);

        assert.deepStrictEqual(list[2]!.data, 2);
		assert.deepStrictEqual(list[2]!.collapsed, false);
		assert.deepStrictEqual(list[2]!.depth, 2);
        assert.deepStrictEqual(list[2]!.visibleNodeCount, 4);

        assert.deepStrictEqual(list[3]!.data, 4);
		assert.deepStrictEqual(list[3]!.collapsed, false);
		assert.deepStrictEqual(list[3]!.depth, 3);
        assert.deepStrictEqual(list[3]!.visibleNodeCount, 1);
        
        assert.deepStrictEqual(list[4]!.data, 6);
		assert.deepStrictEqual(list[4]!.collapsed, false);
		assert.deepStrictEqual(list[4]!.depth, 3);
        assert.deepStrictEqual(list[4]!.visibleNodeCount, 1);
        
        assert.deepStrictEqual(list[5]!.data, 5);
		assert.deepStrictEqual(list[5]!.collapsed, false);
		assert.deepStrictEqual(list[5]!.depth, 3);
        assert.deepStrictEqual(list[5]!.visibleNodeCount, 1);
    });

    test('onDidChangeCollapseState', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;

        const node1 = createFlexNode(1, root);

        const node3 = createFlexNode(3, node1);
        const node2 = createFlexNode(2, node1);
        setNewChildren(node1, [node3, node2]);

        const node4 = createFlexNode(4, node2);
        const node6 = createFlexNode(6, node2);
        const node5 = createFlexNode(5, node2);
        setNewChildren(node2, [node4, node6, node5]);

        const node7 = createFlexNode(7, root);
        setNewChildren(root, [node1, node7]);

        model.refresh();
        assert.deepStrictEqual(list.length, 7);

        let collapseCnt = 0;
        model.onDidChangeCollapseState((e) => {
            collapseCnt++;
        });

        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[0]!.depth, 1);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 6);

        model.setCollapsed([0], true, true);
        assert.strictEqual(collapseCnt, 2);

        model.setCollapsed([0, 1], false, true);
        assert.strictEqual(collapseCnt, 3);

        model.setCollapsed([0], undefined, true);
        assert.strictEqual(collapseCnt, 4);
    });

    test('set-collapsible', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;
        const node1 = createFlexNode(1, root);
        const node2 = createFlexNode(2, node1);
        setNewChildren(node1, [node2]);
        setNewChildren(root, [node1]);

        model.refresh();
        assert.deepStrictEqual(list.length, 2);
        
        model.setCollapsible([0], false);
        assert.deepStrictEqual(list.length, 2);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, false);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, false);
		assert.deepStrictEqual(list[1]!.collapsed, false);

        assert.deepStrictEqual(model.setCollapsed([0], true), false);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, false);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, false);
		assert.deepStrictEqual(list[1]!.collapsed, false);

        assert.deepStrictEqual(model.setCollapsed([0], false), false);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, false);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, false);
		assert.deepStrictEqual(list[1]!.collapsed, false);

        model.setCollapsible([0], true);
        assert.deepStrictEqual(list.length, 2);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, false);
		assert.deepStrictEqual(list[1]!.collapsed, false);

        assert.deepStrictEqual(model.setCollapsed([0], true), true);
        assert.deepStrictEqual(list.length, 1);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, true);

        assert.deepStrictEqual(model.setCollapsed([0], false), true);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, false);
		assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, false);
		assert.deepStrictEqual(list[1]!.collapsed, false);
    });

    test('set-nested-collapsible', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;
        const node1 = createFlexNode(1, root);
        const node2 = createFlexNode(2, node1);
        const node3 = createFlexNode(3, node2);
        setNewChildren(node2, [node3]);
        setNewChildren(node1, [node2]);
        setNewChildren(root, [node1]);

        model.refresh();
        assert.deepStrictEqual(list.length, 3);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, true);
		assert.deepStrictEqual(list[2]!.collapsed, false);
        assert.deepStrictEqual(list[2]!.data, 3);
		assert.deepStrictEqual(list[2]!.collapsible, false);
		assert.deepStrictEqual(list[2]!.collapsed, false);
        
        model.setCollapsible([0, 0, 0], true);
        assert.deepStrictEqual(list[2]!.data, 3);
		assert.deepStrictEqual(list[2]!.collapsible, true);
		assert.deepStrictEqual(list[2]!.collapsed, false);

        model.setCollapsible([0, 0, 0], false);
        assert.deepStrictEqual(list.length, 3);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, true);
		assert.deepStrictEqual(list[2]!.collapsed, false);
        assert.deepStrictEqual(list[2]!.data, 3);
		assert.deepStrictEqual(list[2]!.collapsible, false);
		assert.deepStrictEqual(list[2]!.collapsed, false);
        
    });

    test('auto-update-collapsible', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;
        const node1 = createFlexNode(1, root);
        const node2 = createFlexNode(2, node1);
        setNewChildren(node1, [node2]);
        setNewChildren(root, [node1]);

        model.refresh();

        assert.strictEqual(list.length, 2);
        assert.strictEqual(list[0]!.collapsible, true);
        assert.strictEqual(list[1]!.collapsible, false);

        setNewChildren(node1, []);
        model.refresh(node1);
        assert.strictEqual(list.length, 1);
        assert.strictEqual(list[0]!.data, 1);
        assert.strictEqual(list[0]!.collapsible, false);

        setNewChildren(node1, [node2]);
        model.refresh(node1);
        assert.strictEqual(list[0]!.collapsible, true);
        assert.strictEqual(list[1]!.collapsible, false);
    });

    test('expand', () => {
        const list: IFlexNode<number>[] = [];
        const model = new FlexIndexTreeModel<number, void>(-1, toList(list));

        const root: IFlexNode<number> = model.rootNode;
        const node1 = createFlexNode(1, root);
        const node2 = createFlexNode(2, node1);
        const node3 = createFlexNode(3, node2);
        setNewChildren(node2, [node3]);
        setNewChildren(node1, [node2]);
        setNewChildren(root, [node1]);

        model.refresh();

        assert.deepStrictEqual(list.length, 3);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, true);
		assert.deepStrictEqual(list[1]!.collapsed, false);
        assert.deepStrictEqual(list[2]!.data, 3);
		assert.deepStrictEqual(list[2]!.collapsible, false);
		assert.deepStrictEqual(list[2]!.collapsed, false);

        model.setCollapsed([0], true, true);
        assert.deepStrictEqual(list.length, 1);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, true);
        assert.deepStrictEqual(list[0]!.visibleNodeCount, 1);

        model.setExpandTo([0, 0, 0]);
        assert.deepStrictEqual(list.length, 3);
        assert.deepStrictEqual(list[0]!.data, 1);
		assert.deepStrictEqual(list[0]!.collapsible, true);
		assert.deepStrictEqual(list[0]!.collapsed, false);
        assert.deepStrictEqual(list[1]!.data, 2);
		assert.deepStrictEqual(list[1]!.collapsible, true);
		assert.deepStrictEqual(list[1]!.collapsed, false);
        assert.deepStrictEqual(list[2]!.data, 3);
		assert.deepStrictEqual(list[2]!.collapsible, false);
		assert.deepStrictEqual(list[2]!.collapsed, false);
    });

    suite('filter', () => {
        
        test('basic', () => {
            const list: IFlexNode<number, boolean>[] = [];
            let shouldFilter = false;
            const filter = new class implements ITreeFilterProvider<number, boolean> {
                public filter(element: number): ITreeFilterResult<boolean> {
                    const filtered = (!shouldFilter || element % 2 === 0);
                    return {
                        visibility: true,
                        filterMetadata: filtered === false ? undefined : true,
                    };
                }
            };

            const model = new FlexIndexTreeModel<number, boolean>(-1, toList(list), { 
                filter: filter,
                collapsedByDefault: false,
            });

            const root: IFlexNode<number, boolean> = model.rootNode;
            const node0 = createFlexNode(0, root);
            const node1 = createFlexNode(1, node0);
            const node2 = createFlexNode(2, node0);
            const node3 = createFlexNode(3, node0);
            const node4 = createFlexNode(4, node0);
            const node5 = createFlexNode(5, node0);
            const node6 = createFlexNode(6, node0);
            const node7 = createFlexNode(7, node0);
            
            setNewChildren(node0, [node1, node2, node3, node4, node5, node6, node7]);
            setNewChildren(root, [node0]);
            model.refresh();

            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);

            model.filter();
            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);

            shouldFilter = true;
            model.filter();
            assert.deepStrictEqual(toArray(list), [0, 2, 4, 6]);

            shouldFilter = false;
            model.filter();
            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);
        });

        test('visibleOnly', () => {

            const list: IFlexNode<number, boolean>[] = [];
            let shouldFilter = false;
            const filter = new class implements ITreeFilterProvider<number, boolean> {
                public filter(element: number): ITreeFilterResult<boolean> {
                    return {
                        visibility: true,
                        filterMetadata: !shouldFilter,
                    };
                }
            };

            const model = new FlexIndexTreeModel<number, boolean>(-1, toList(list), { 
                filter: filter,
                collapsedByDefault: false,
            });

            const root: IFlexNode<number, boolean> = model.rootNode;
            const node0 = createFlexNode(0, root);
            const node1 = createFlexNode(1, node0, true);
            const node2 = createFlexNode(2, node0, true);
            const node3 = createFlexNode(3, node0, true);
            setNewChildren(node0, [node1, node2, node3]);

            const node4 = createFlexNode(4, node1);
            setNewChildren(node1, [node4]);
            const node5 = createFlexNode(5, node2);
            setNewChildren(node2, [node5]);
            const node6 = createFlexNode(6, node3);
            setNewChildren(node3, [node6]);

            setNewChildren(root, [node0]);
            model.refresh();

            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3]);
            shouldFilter = false;

            model.filter(true);
            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3]);

            model.filter(false);
            assert.deepStrictEqual(toArray(list), [0, 1, 4, 2, 5, 3, 6]);
        });
    });
});
