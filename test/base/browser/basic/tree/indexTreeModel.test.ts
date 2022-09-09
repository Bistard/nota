import * as assert from 'assert';
import { ISpliceable } from 'src/base/common/range';
import { IIndexTreeNode, IndexTreeModel } from 'src/base/browser/secondary/tree/indexTreeModel';
import { ITreeFilterProvider, ITreeFilterResult } from 'src/base/browser/secondary/tree/treeFilter';
import { ITreeNode } from 'src/base/browser/secondary/tree/tree';

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
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));
        assert.deepStrictEqual(list.length, 0);
    });

    test('insert', () => {
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

        let cnt = 0;
        model.onDidSplice((e) => {
            e.deleted.forEach(() => cnt++);
            e.inserted.forEach(() => cnt++);
        });

        model.splice([0], 0, [
            {data: 1},
            {data: 3},
            {data: 2},
        ]);
        assert.strictEqual(cnt, 3);

        model.splice([0], 3, []);
        assert.strictEqual(cnt, 6);
    });

    test('getNodeLocation', () => {
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

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
        const list: IIndexTreeNode<number>[] = [];
        const model = new IndexTreeModel<number>(-1, toList(list));

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
            const list: IIndexTreeNode<number, boolean>[] = [];
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

            const list: IIndexTreeNode<number, boolean>[] = [];
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