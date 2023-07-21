import * as assert from 'assert';
import { Graph } from "src/platform/instantiation/common/dependencyGraph";

suite('dependency-graph-test', () => {
	let graph: Graph<string>;

	setup(() => {
		graph = new Graph<string>(s => s);
	});

	test('is possible to getNode nodes that don\'t exist', function () {
		assert.strictEqual(graph.getNode('ddd'), undefined);
	});

	test('inserts nodes when not there yet', function () {
		assert.strictEqual(graph.getNode('ddd'), undefined);
		assert.strictEqual(graph.getOrInsertNode('ddd').data, 'ddd');
		assert.strictEqual(graph.getNode('ddd')!.data, 'ddd');
	});

	test('can remove nodes and get length', function () {
		assert.ok(graph.isEmpty());
		assert.strictEqual(graph.getNode('ddd'), undefined);
		assert.strictEqual(graph.getOrInsertNode('ddd').data, 'ddd');
		assert.ok(!graph.isEmpty());
		graph.removeNode('ddd');
		assert.strictEqual(graph.getNode('ddd'), undefined);
		assert.ok(graph.isEmpty());
	});

	test('root', () => {
		graph.insertEdge('1', '2');
		let roots = graph.roots();
		assert.strictEqual(roots.length, 1);
		assert.strictEqual(roots[0]!.data, '2');

		graph.insertEdge('2', '1');
		roots = graph.roots();
		assert.strictEqual(roots.length, 0);
	});

	test('root complex', function () {
		graph.insertEdge('1', '2');
		graph.insertEdge('1', '3');
		graph.insertEdge('3', '4');

		const roots = graph.roots();
		assert.strictEqual(roots.length, 2);
		assert.ok(['2', '4'].every(n => roots.some(node => node.data === n)));
	});
});