import * as assert from 'assert';
import { AsyncMultiTree } from 'src/base/browser/basic/tree/asyncMultiTree';

suite('AsyncMultiTree-test', () => {

    const TREE = new Map<number, number[]>();
    TREE.set(0, [1, 2, 3]);
    TREE.set(1, [4, 5]);
    TREE.set(2, [6]);
    TREE.set(3, []);
    TREE.set(4, []);
    TREE.set(5, []);
    TREE.set(6, []);
    
    test('constructor / size / getNode / hasNode', async () => {
        const container = document.createElement('div');
        const tree = await AsyncMultiTree.create<number>(
            container, 
            0,
            [],
            {
                getSize: (data) => 10,
                getType: (data) => 10
            },
            {
                getChildren: (data) => TREE.get(data)!,
                hasChildren: (data) => !!TREE.get(data)!.length
            }
        );

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
        assert.strictEqual(node1.parent, null);
        assert.strictEqual(node1.visible, true);
        assert.strictEqual(node1.children.length, 2);
        
        const node2 = tree.getNode(2);
        assert.strictEqual(node2.data, 2);
        assert.strictEqual(node2.depth, 1);
        assert.strictEqual(node2.collapsible, true);
        assert.strictEqual(node2.collapsed, false);
        assert.strictEqual(node2.parent, null);
        assert.strictEqual(node2.visible, true);
        assert.strictEqual(node2.children.length, 1);

        const node3 = tree.getNode(3);
        assert.strictEqual(node3.data, 3);
        assert.strictEqual(node3.depth, 1);
        assert.strictEqual(node3.collapsible, false);
        assert.strictEqual(node3.collapsed, false);
        assert.strictEqual(node3.parent, null);
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
        const tree = await AsyncMultiTree.create<number>(
            document.createElement('div'), 
            0,
            [],
            {
                getSize: (data) => 10,
                getType: (data) => 10
            },
            {
                getChildren: (data) => TREE.get(data)!,
                hasChildren: (data) => !!TREE.get(data)!.length
            }
        );

        assert.strictEqual(tree.size(), 6);

        TREE.set(3, [7, 8]);
        TREE.set(7, []);
        TREE.set(8, [9, 10, 11, 12]);
        TREE.set(9, []);
        TREE.set(10, []);
        TREE.set(11, []);
        TREE.set(12, []);

        await tree.refresh(3);
        assert.strictEqual(tree.size(), 12);

        let node3 = tree.getNode(3);
        assert.strictEqual(node3.data, 3);
        assert.strictEqual(node3.depth, 1);
        assert.strictEqual(node3.collapsible, true);
        assert.strictEqual(node3.collapsed, false);
        assert.strictEqual(node3.parent, null);
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

        TREE.set(1, []);
        TREE.set(3, []);

        await tree.refresh(1);

        assert.strictEqual(tree.size(), 10);

        let node1 = tree.getNode(1);
        assert.strictEqual(node1.data, 1);
        assert.strictEqual(node1.depth, 1);
        assert.strictEqual(node1.collapsible, false);
        assert.strictEqual(node1.collapsed, false);
        assert.strictEqual(node1.parent, null);
        assert.strictEqual(node1.visible, true);
        assert.strictEqual(node1.children.length, 0);

        await tree.refresh(3);
        assert.strictEqual(tree.size(), 4);

        node3 = tree.getNode(3);
        assert.strictEqual(node3.data, 3);
        assert.strictEqual(node3.depth, 1);
        assert.strictEqual(node3.collapsible, false);
        assert.strictEqual(node3.collapsed, false);
        assert.strictEqual(node3.parent, null);
        assert.strictEqual(node3.visible, true);
        assert.strictEqual(node3.children.length, 0);
    });
});