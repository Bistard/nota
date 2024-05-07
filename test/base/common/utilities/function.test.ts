import * as assert from 'assert';
import { beforeEach } from 'mocha';
import { bfs, cond, dfs, executeOnce, Flag, Reactivator, to01 } from 'src/base/common/utilities/function';

suite('function-test', () => {

    suite('executeOnce', function() {
        test('should execute function once without error', function() {
            const fn = () => 42;
            const wrappedFn = executeOnce(fn);
            assert.strictEqual(wrappedFn(), 42);
        });
    
        test('should throw error on second execution attempt', function() {
            const fn = () => 42;
            const wrappedFn = executeOnce(fn);
            wrappedFn();
            assert.throws(() => wrappedFn(), /can only be executed once/);
        });
    });
    
    suite('Reactivator', function() {
        let executor: Reactivator;
        let actionCounter: number;
    
        setup(function() {
            actionCounter = 0;
            executor = new Reactivator(() => actionCounter++);
        });
    
        test('should not execute before reactivate', function() {
            executor.execute();
            assert.strictEqual(actionCounter, 0);
        });
    
        test('should execute once after reactivate', function() {
            executor.reactivate();
            executor.execute();
            assert.strictEqual(actionCounter, 1);
        });
    
        test('should not execute more than once after single reactivate', function() {
            executor.reactivate();
            executor.execute();
            executor.execute();
            assert.strictEqual(actionCounter, 1);
        });
    
        test('should execute default action if no function passed', function() {
            executor.reactivate();
            executor.execute();
            assert.strictEqual(actionCounter, 1);
        });
    
        test('should execute passed function instead of default action', function() {
            executor.reactivate();
            executor.execute(() => actionCounter += 2);
            assert.strictEqual(actionCounter, 2);
        });
    });

    suite('Flag', function() {
        test('turnOn one time', function() {
            const f = new Flag('created');
            assert.ok(!f.triggered());
            f.turnOn();
            assert.ok(f.triggered());
        });
        
        test('turnOn twice', function() {
            const f = new Flag('created');
            f.turnOn();
            assert.throws(() => f.turnOn());
        });
        
        test('assert', function() {
            const f = new Flag('created');
            f.assert(false, 'should expect current state is false');
            f.turnOn();
            f.assert(true, 'should expect current state is true');
            assert.throws(() => f.turnOn());
        });
    });

    suite('cond', function() {
        test('should return onTrue when condition is true', function() {
            assert.strictEqual(cond(true, 'trueValue', 'falseValue'), 'trueValue');
        });
    
        test('should return onFalse when condition is false', function() {
            assert.strictEqual(cond(false, 'trueValue', 'falseValue'), 'falseValue');
        });
    });
    
    suite('to01', function() {
        test('should return 1 for truthy values', function() {
            assert.strictEqual(to01(true), 1);
            assert.strictEqual(to01('non-empty'), 1);
            assert.strictEqual(to01(42), 1);
        });
    
        test('should return 0 for falsy values', function() {
            assert.strictEqual(to01(false), 0);
            assert.strictEqual(to01(''), 0);
            assert.strictEqual(to01(0), 0);
        });
    });

    suite('dfs & bfs', () => {
        interface ITreeNode {
            value: number;
            children: ITreeNode[];
        }
        
        function node(value: number, children: ITreeNode[] = []): ITreeNode {
            return { value, children };
        }

        let tree: ITreeNode;
        let visitOrder: number[];
    
        beforeEach(() => {
            // Construct a simple tree for testing
            //       1
            //      / \
            //     2   3
            //    /   / \
            //   4   5   6
            tree = node(1, [
                node(2, [node(4)]),
                node(3, [node(5), node(6)]),
            ]);
            visitOrder = [];
        });
    
        test('DFS should visit nodes in depth-first order', () => {
            dfs(tree, (node) => { visitOrder.push(node.value); }, (node) => node.children);
            assert.deepStrictEqual(visitOrder, [1, 2, 4, 3, 5, 6]);
        });
    
        test('BFS should visit nodes in breadth-first order', () => {
            bfs(tree, (node) => { visitOrder.push(node.value); }, (node) => node.children);
            assert.deepStrictEqual(visitOrder, [1, 2, 3, 4, 5, 6]);
        });
    
        test('DFS with single-node tree', () => {
            const singleNodeTree = node(1);
            dfs(singleNodeTree, (node) => { visitOrder.push(node.value); }, (node) => node.children);
            assert.deepStrictEqual(visitOrder, [1]);
        });
    
        test('BFS with single-node tree', () => {
            const singleNodeTree = node(1);
            bfs(singleNodeTree, (node) => { visitOrder.push(node.value); }, (node) => node.children);
            assert.deepStrictEqual(visitOrder, [1]);
        });
    
        test('DFS with empty children function', () => {
            dfs(tree, (node) => { visitOrder.push(node.value); }, () => []);
            assert.deepStrictEqual(visitOrder, [1]);
        });
    
        test('BFS with empty children function', () => {
            bfs(tree, (node) => { visitOrder.push(node.value); }, () => []);
            assert.deepStrictEqual(visitOrder, [1]);
        });
    });
    
});