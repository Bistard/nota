import * as assert from 'assert';
import { RendererType } from 'src/base/browser/secondary/listView/listRenderer';
import { AsyncTree } from 'src/base/browser/secondary/tree/asyncTree';
import { generateTreeLike } from 'test/utils/helpers';

suite('AsyncTree-test', () => {

    test('constructor / size / getNode / hasNode', async () => {
        const TREE1 = new Map<number, number[]>();
        TREE1.set(0, [1, 2, 3]);
        TREE1.set(1, [4, 5]);
        TREE1.set(2, [6]);
        TREE1.set(3, []);
        TREE1.set(4, []);
        TREE1.set(5, []);
        TREE1.set(6, []);
        
        const container = document.createElement('div');
        const tree = new AsyncTree<number, void>(
            container, 
            0,
            {
                forcePrimitiveType: true,
                renderers: [],
                itemProvider: {
                    getSize: (data) => 10,
                    getType: (data) => RendererType.Unknown
                },
                collapsedByDefault: false,
                childrenProvider: {
                    getChildren: (data) => TREE1.get(data)!,
                    hasChildren: (data) => !!TREE1.get(data)!.length,
                    collapseByDefault: () => false
                },
            }
        );

        await tree.refresh();

        assert.strictEqual(tree.size(), 6);
        
        assert.strictEqual(tree.hasNode(1), true);
        assert.strictEqual(tree.hasNode(10), false);

        try {
            tree.getNode(10);
            assert.strictEqual(false, true);
        } catch (err) {
            assert.strictEqual(true, true);
        }

        const node1 = tree.getNode(1);
        assert.strictEqual(node1.data, 1);
        assert.strictEqual(node1.depth, 1);
        assert.strictEqual(node1.collapsible, true);
        assert.strictEqual(node1.collapsed, false);
        assert.strictEqual(node1.parent?.data, 0);
        assert.strictEqual(node1.visible, true);
        assert.strictEqual(node1.children.length, 2);
        
        const node2 = tree.getNode(2);
        assert.strictEqual(node2.data, 2);
        assert.strictEqual(node2.depth, 1);
        assert.strictEqual(node2.collapsible, true);
        assert.strictEqual(node2.collapsed, false);
        assert.strictEqual(node2.parent?.data, 0);
        assert.strictEqual(node2.visible, true);
        assert.strictEqual(node2.children.length, 1);

        const node3 = tree.getNode(3);
        assert.strictEqual(node3.data, 3);
        assert.strictEqual(node3.depth, 1);
        assert.strictEqual(node3.collapsible, false);
        assert.strictEqual(node3.collapsed, false);
        assert.strictEqual(node3.parent?.data, 0);
        assert.strictEqual(node3.visible, true);
        assert.strictEqual(node3.children.length, 0);

        const node4 = tree.getNode(4);
        assert.strictEqual(node4.data, 4);
        assert.strictEqual(node4.depth, 2);
        assert.strictEqual(node4.collapsible, false);
        assert.strictEqual(node4.collapsed, false);
        assert.strictEqual(node4.parent!.data, 1);
        assert.strictEqual(node4.visible, true);
        assert.strictEqual(node4.children.length, 0);
    });

    test('refresh', async () => {
        const TREE1 = new Map<number, number[]>();
        TREE1.set(0, [1, 2, 3]);
        TREE1.set(1, [4, 5]);
        TREE1.set(2, [6]);
        TREE1.set(3, []);
        TREE1.set(4, []);
        TREE1.set(5, []);
        TREE1.set(6, []);
        
        const tree = new AsyncTree<number, void>(
            document.createElement('div'), 
            0,
            {
                forcePrimitiveType: true,
                renderers: [],
                itemProvider: {
                    getSize: (data) => 10,
                    getType: (data) => RendererType.Unknown
                },
                collapsedByDefault: false,
                childrenProvider: {
                    getChildren: (data) => TREE1.get(data)!,
                    hasChildren: (data) => !!TREE1.get(data)!.length,
                    collapseByDefault: () => false
                },
            }
        );

        await tree.refresh();
        assert.strictEqual(tree.size(), 6);

        TREE1.set(3, [7, 8]);
        TREE1.set(7, []);
        TREE1.set(8, [9, 10, 11, 12]);
        TREE1.set(9, []);
        TREE1.set(10, []);
        TREE1.set(11, []);
        TREE1.set(12, []);

        await tree.refresh(3);
        assert.strictEqual(tree.size(), 12);

        let node3 = tree.getNode(3);
        assert.strictEqual(node3.data, 3);
        assert.strictEqual(node3.depth, 1);
        assert.strictEqual(node3.collapsible, true);
        assert.strictEqual(node3.collapsed, false);
        assert.strictEqual(node3.parent?.data, 0);
        assert.strictEqual(node3.visible, true);
        assert.strictEqual(node3.children.length, 2);
        
        let node8 = tree.getNode(8);
        assert.strictEqual(node8.data, 8);
        assert.strictEqual(node8.depth, 2);
        assert.strictEqual(node8.collapsible, true);
        assert.strictEqual(node8.collapsed, false);
        assert.strictEqual(node8.parent!.data, 3);
        assert.strictEqual(node8.visible, true);
        assert.strictEqual(node8.children.length, 4);

        let node9 = tree.getNode(9);
        assert.strictEqual(node9.data, 9);
        assert.strictEqual(node9.depth, 3);
        assert.strictEqual(node9.collapsible, false);
        assert.strictEqual(node9.collapsed, false);
        assert.strictEqual(node9.parent!.data, 8);
        assert.strictEqual(node9.visible, true);
        assert.strictEqual(node9.children.length, 0);
        
        let node10 = tree.getNode(10);
        assert.strictEqual(node10.data, 10);
        assert.strictEqual(node10.depth, 3);
        assert.strictEqual(node10.collapsible, false);
        assert.strictEqual(node10.collapsed, false);
        assert.strictEqual(node10.parent!.data, 8);
        assert.strictEqual(node10.visible, true);
        assert.strictEqual(node10.children.length, 0);

        let node11 = tree.getNode(11);
        assert.strictEqual(node11.data, 11);
        assert.strictEqual(node11.depth, 3);
        assert.strictEqual(node11.collapsible, false);
        assert.strictEqual(node11.collapsed, false);
        assert.strictEqual(node11.parent!.data, 8);
        assert.strictEqual(node11.visible, true);
        assert.strictEqual(node11.children.length, 0);

        let node12 = tree.getNode(12);
        assert.strictEqual(node12.data, 12);
        assert.strictEqual(node12.depth, 3);
        assert.strictEqual(node12.collapsible, false);
        assert.strictEqual(node12.collapsed, false);
        assert.strictEqual(node12.parent!.data, 8);
        assert.strictEqual(node12.visible, true);
        assert.strictEqual(node12.children.length, 0);

        TREE1.set(1, []);
        TREE1.set(3, []);

        await tree.refresh(1);

        assert.strictEqual(tree.size(), 10);

        let node1 = tree.getNode(1);
        assert.strictEqual(node1.data, 1);
        assert.strictEqual(node1.depth, 1);
        assert.strictEqual(node1.collapsible, false);
        assert.strictEqual(node1.collapsed, false);
        assert.strictEqual(node1.parent?.data, 0);
        assert.strictEqual(node1.visible, true);
        assert.strictEqual(node1.children.length, 0);

        await tree.refresh(3);
        assert.strictEqual(tree.size(), 4);

        node3 = tree.getNode(3);
        assert.strictEqual(node3.data, 3);
        assert.strictEqual(node3.depth, 1);
        assert.strictEqual(node3.collapsible, false);
        assert.strictEqual(node3.collapsed, false);
        assert.strictEqual(node3.parent?.data, 0);
        assert.strictEqual(node3.visible, true);
        assert.strictEqual(node3.children.length, 0);

        TREE1.set(0, []);
        await tree.refresh();

        assert.strictEqual(tree.size(), 0);
    });

    test('collapse / expand', async () => {

        const TREE2 = new Map<number, number[]>();
        TREE2.set(0, [1, 2, 3]);
        TREE2.set(1, [4, 5]);
        TREE2.set(2, [6]);
        TREE2.set(3, []);
        TREE2.set(4, []);
        TREE2.set(5, []);
        TREE2.set(6, [7, 8]);
        TREE2.set(7, []);
        TREE2.set(8, []);

        const tree = new AsyncTree<number, void>(
            document.createElement('div'), 
            0,
            {
                forcePrimitiveType: true,
                renderers: [],
                itemProvider: {
                    getSize: (data) => 10,
                    getType: (data) => RendererType.Unknown
                },
                collapsedByDefault: false,
                childrenProvider: {
                    getChildren: (data) => TREE2.get(data)!,
                    hasChildren: (data) => !!TREE2.get(data)!.length,
                    collapseByDefault: () => false
                },
            }
        );

        await tree.refresh();

        assert.strictEqual(tree.size(), 8);

        assert.strictEqual(tree.isCollapsible(1), true);
        assert.strictEqual(tree.isCollapsed(1), false);
        assert.strictEqual(tree.isCollapsible(2), true);
        assert.strictEqual(tree.isCollapsed(2), false);
        assert.strictEqual(tree.isCollapsible(3), false);
        assert.strictEqual(tree.isCollapsed(3), false);
        assert.strictEqual(tree.isCollapsible(4), false);
        assert.strictEqual(tree.isCollapsed(4), false);
        assert.strictEqual(tree.isCollapsible(5), false);
        assert.strictEqual(tree.isCollapsed(5), false);
        assert.strictEqual(tree.isCollapsible(6), true);
        assert.strictEqual(tree.isCollapsed(6), false);
        assert.strictEqual(tree.isCollapsible(7), false);
        assert.strictEqual(tree.isCollapsed(7), false);
        assert.strictEqual(tree.isCollapsible(8), false);
        assert.strictEqual(tree.isCollapsed(8), false);

        tree.collapse(1, false);
        tree.collapse(2, false);
        assert.strictEqual(tree.isCollapsed(1), true);
        assert.strictEqual(tree.isCollapsed(2), true);
        assert.strictEqual(tree.isCollapsed(6), false);
        
        tree.collapse(6, false);
        assert.strictEqual(tree.isCollapsed(6), true);

        await tree.toggleCollapseOrExpand(6, false);
        await tree.refresh();
        assert.strictEqual(tree.isCollapsed(6), false);

        await tree.toggleCollapseOrExpand(2, false);
        await tree.refresh();
        assert.strictEqual(tree.isCollapsed(2), false);

        tree.collapse(2, true);
        assert.strictEqual(tree.isCollapsed(2), true);
        assert.strictEqual(tree.isCollapsed(6), true);

        await tree.expand(2, true);
        await tree.refresh();
        assert.strictEqual(tree.isCollapsed(2), false);
        assert.strictEqual(tree.isCollapsed(6), false);

        tree.expandAll();
        for (let i = 1; i <= 8; i++) {
            if (tree.isCollapsible(i)) {
                assert.strictEqual(tree.isCollapsed(i), false);
            }
        }

        tree.collapseAll();
        for (let i = 1; i <= 8; i++) {
            if (tree.isCollapsible(i)) {
                assert.strictEqual(tree.isCollapsed(i), true);
            }
        }
    });

    test('size', async () => {
        const [TREE, size] = generateTreeLike(() => Object.create(null), 10);
        const tree = new AsyncTree(
            document.createElement('div'), 
            TREE,
            {
                renderers: [],
                itemProvider: {
                    getSize: (data) => 0,
                    getType: (data) => 0
                },
                collapsedByDefault: false,
                childrenProvider: {
                    getChildren: (item) => Array.isArray(item) ? item : [],
                    hasChildren: (item) => Array.isArray(item),
                    collapseByDefault: () => false,
                },
            }
        );

        await tree.refresh();
        assert.strictEqual(tree.size(), size);
    });

    test('use primitive type as client data', async () => {
        const [TREE, size] = generateTreeLike(() => true, 1);
        try {
            const tree = new AsyncTree(
                document.createElement('div'), 
                TREE,
                {
                    renderers: [],
                    itemProvider: {
                        getSize: (data) => 0,
                        getType: (data) => 0
                    },
                    collapsedByDefault: false,
                    childrenProvider: {
                        getChildren: (item) => Array.isArray(item) ? item : [] as any,
                        hasChildren: (item) => Array.isArray(item),
                        collapseByDefault: () => false,
                    },
                }
            );
            assert.fail('does not support primitive types');
        } catch {
            assert.ok(true);
        }
    });

    test('childrenProvider', async () => {
        const TREE = new Map<number, number[]>();
        TREE.set(0, [1]);
        TREE.set(1, [2]);
        TREE.set(2, []);

        class Child {
            constructor(public readonly data: number) {}
            resolved = false;
            children: Child[] = [];

            getChildren() {
                if (this.resolved) {
                    return this.children;
                }
                this.children = TREE.get(this.data)!.map(num => new Child(num));
                this.resolved = true;
                return this.children;
            }

            hasChildren() {
                return !!TREE.get(this.data)!.length;
            }

            forgetChildren() {
                this.resolved = false;
                this.children = [];
            }
        }
        
        const children = new Map<number, Child>();
        const tree = new AsyncTree<Child, void>(
            document.createElement('div'), 
            new Child(0),
            {
                renderers: [],
                itemProvider: {
                    getSize: (data) => 1,
                    getType: (data) => 1
                },
                collapsedByDefault: true,
                childrenProvider: {
                    getChildren: (data) => data.getChildren(),
                    hasChildren: (data) => data.hasChildren(),
                    forgetChildren: data => data.forgetChildren(),
                    isChildrenResolved: data => data.resolved,
                },
                onDidCreateNode: data => {
                    children.set(data.data.data, data.data);
                },
                onDidDeleteNode: data => {
                    children.delete(data.data.data);
                },
            }
        );

        await tree.refresh();
        assert.strictEqual(tree.size(), 1);

        await tree.refresh(children.get(1));
        assert.strictEqual(tree.size(), 1);

        const child1 = children.get(1)!;
        await tree.expand(child1);
        assert.strictEqual(tree.size(), 2);

        tree.collapse(child1);
        assert.strictEqual(tree.size(), 2);

        TREE.set(1, [3, 4]);
        TREE.set(3, []);
        TREE.set(4, []);
        await tree.refresh(child1);
        assert.strictEqual(tree.size(), 2);

        await tree.expand(child1);
        assert.strictEqual(tree.size(), 3);
    });

    test('identityProvider', async () => {
        const TREE = new Map<number, number[]>();
        TREE.set(0, [1]);
        TREE.set(1, [2]);
        TREE.set(2, []);

        class Child {
            constructor(public readonly data: number) {}
            resolved = false;
            children: Child[] = [];

            getChildren() {
                if (this.resolved) {
                    return this.children;
                }
                this.children = TREE.get(this.data)!.map(num => new Child(num));
                this.resolved = true;
                return this.children;
            }

            hasChildren() {
                return !!TREE.get(this.data)!.length;
            }

            forgetChildren() {
                this.resolved = false;
                this.children = [];
            }
        }
        
        const children = new Map<number, Child>();
        const tree = new AsyncTree<Child, void>(
            document.createElement('div'), 
            new Child(0),
            {
                renderers: [],
                itemProvider: {
                    getSize: (data) => 1,
                    getType: (data) => 1
                },
                collapsedByDefault: true,
                childrenProvider: {
                    getChildren: (data) => data.getChildren(),
                    hasChildren: (data) => data.hasChildren(),
                    forgetChildren: data => data.forgetChildren(),
                    isChildrenResolved: data => data.resolved,
                },
                onDidCreateNode: data => {
                    children.set(data.data.data, data.data);
                },
                onDidDeleteNode: data => {
                    children.delete(data.data.data);
                },
                identityProvider: {
                    getID: item => item.toString(),
                },
            }
        );

        await tree.refresh();
        assert.strictEqual(tree.size(), 1);

        await tree.refresh(children.get(1));
        assert.strictEqual(tree.size(), 1);

        const child1 = children.get(1)!;
        await tree.expand(child1);
        assert.strictEqual(tree.size(), 2);

        tree.collapse(child1);
        assert.strictEqual(tree.size(), 2);

        TREE.set(1, [3, 4]);
        TREE.set(3, []);
        TREE.set(4, []);
        await tree.refresh(child1);
        assert.strictEqual(tree.size(), 2);

        await tree.expand(child1);
        assert.strictEqual(tree.size(), 3);
    });
});