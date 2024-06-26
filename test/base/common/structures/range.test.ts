import * as assert from 'assert';
import { IRange, IRangeList, Range, RangeTable } from 'src/base/common/structures/range';

function createRange(start: number, end: number): IRange {
	return { start, end } as IRange;
}

suite('Range-test', () => {

	test('empty', () => {
		assert.deepStrictEqual(Range.empty(Range.EMPTY), true);
		assert.deepStrictEqual(Range.empty({start: 0, end: 0}), true);
		assert.deepStrictEqual(Range.empty({start: 31, end: 31}), true);
		assert.deepStrictEqual(Range.empty({start: 0, end: 31}), false);
		assert.deepStrictEqual(Range.empty({start: 31, end: 0}), true);
	});

	test('within', () => {
		assert.deepStrictEqual(Range.within(Range.EMPTY, 5), false);
		assert.deepStrictEqual(Range.within(createRange(0, 4), 5), false);
		assert.deepStrictEqual(Range.within(createRange(0, 4), -1), false);
		assert.deepStrictEqual(Range.within(createRange(0, 4), 0), true);
		assert.deepStrictEqual(Range.within(createRange(0, 4), 4), true);
	});

	test('exact', () => {
		assert.deepStrictEqual(Range.exact(Range.EMPTY, createRange(0, 0)), true);
		assert.deepStrictEqual(Range.exact(Range.EMPTY, createRange(5, 5)), false);
		assert.deepStrictEqual(Range.exact(createRange(0, 4), createRange(0, 4)), true);
		assert.deepStrictEqual(Range.exact(createRange(0, 4), createRange(4, 8)), false);
	});

	test('same', () => {
		assert.deepStrictEqual(Range.same(Range.EMPTY, createRange(0, 0)), true);
		assert.deepStrictEqual(Range.same(Range.EMPTY, createRange(5, 5)), true);
		assert.deepStrictEqual(Range.same(createRange(0, 4), createRange(0, 4)), true);
		assert.deepStrictEqual(Range.same(createRange(0, 4), createRange(4, 8)), true);
	});

	test('shift', () => {
		assert.deepStrictEqual(Range.shift(Range.EMPTY, 10), {start: 10, end: 10});
		assert.deepStrictEqual(Range.shift({start: 0, end: 31}, 10), {start: 10, end: 41});
	});

	test('intersection', () => {
		assert.deepStrictEqual(Range.intersection({ start: 0, end: 0 }, { start: 0, end: 0 }), { start: 0, end: 0 });
		assert.deepStrictEqual(Range.intersection({ start: 0, end: 0 }, { start: 5, end: 5 }), { start: 0, end: 0 });
		assert.deepStrictEqual(Range.intersection({ start: 0, end: 1 }, { start: 5, end: 6 }), { start: 0, end: 0 });
		assert.deepStrictEqual(Range.intersection({ start: 5, end: 6 }, { start: 0, end: 1 }), { start: 0, end: 0 });
		assert.deepStrictEqual(Range.intersection({ start: 0, end: 5 }, { start: 2, end: 2 }), { start: 0, end: 0 });
		assert.deepStrictEqual(Range.intersection({ start: 0, end: 1 }, { start: 0, end: 1 }), { start: 0, end: 1 });
		assert.deepStrictEqual(Range.intersection({ start: 0, end: 10 }, { start: 0, end: 5 }), { start: 0, end: 5 });
		assert.deepStrictEqual(Range.intersection({ start: 0, end: 5 }, { start: 0, end: 10 }), { start: 0, end: 5 });
		assert.deepStrictEqual(Range.intersection({ start: 0, end: 10 }, { start: 5, end: 10 }), { start: 5, end: 10 });
		assert.deepStrictEqual(Range.intersection({ start: 5, end: 10 }, { start: 0, end: 10 }), { start: 5, end: 10 });
		assert.deepStrictEqual(Range.intersection({ start: 0, end: 10 }, { start: 2, end: 8 }), { start: 2, end: 8 });
		assert.deepStrictEqual(Range.intersection({ start: 2, end: 8 }, { start: 0, end: 10 }), { start: 2, end: 8 });
		assert.deepStrictEqual(Range.intersection({ start: 0, end: 10 }, { start: 5, end: 15 }), { start: 5, end: 10 });
		assert.deepStrictEqual(Range.intersection({ start: 5, end: 15 }, { start: 0, end: 10 }), { start: 5, end: 10 });
	});

	suite('relativeComplement', function() {
		test('basics', () => {
			assert.deepStrictEqual(Range.relativeComplement({start: 50, end: 150}, {start: 0, end: 200}), [{start: 0, end: 50}, {start: 150, end: 200}]);
			assert.deepStrictEqual(Range.relativeComplement({start: 0, end: 150}, {start: 0, end: 200}), [Range.EMPTY, {start: 150, end: 200}]);
			assert.deepStrictEqual(Range.relativeComplement({start: 50, end: 150}, {start: 0, end: 150}), [Range.EMPTY, {start: 0, end: 50}]);
			assert.deepStrictEqual(Range.relativeComplement({start: 50, end: 150}, {start: 50, end: 150}), [Range.EMPTY, Range.EMPTY]);
			assert.deepStrictEqual(Range.relativeComplement({start: 0, end: 50}, {start: 50, end: 100}), [Range.EMPTY, {start: 50, end: 100}]);
		});
	
		test('B fully within A', function() {
			const A: IRange = { start: 1, end: 5 };
			const B: IRange = { start: 2, end: 4 };
			assert.deepStrictEqual(Range.relativeComplement(A, B), [Range.EMPTY, Range.EMPTY]);
		});
	
		test('A and B non-overlapping with B after A', function() {
			const A: IRange = { start: 1, end: 3 };
			const B: IRange = { start: 4, end: 6 };
			assert.deepStrictEqual(Range.relativeComplement(A, B), [Range.EMPTY, { start: 4, end: 6 }]);
		});
	
		test('A and B non-overlapping with B before A', function() {
			const A: IRange = { start: 5, end: 7 };
			const B: IRange = { start: 1, end: 4 };
			assert.deepStrictEqual(Range.relativeComplement(A, B), [Range.EMPTY, { start: 1, end: 4 }]);
		});
	
		test('A overlaps B at start', function() {
			const A: IRange = { start: 1, end: 5 };
			const B: IRange = { start: 0, end: 3 };
			assert.deepStrictEqual(Range.relativeComplement(A, B), [Range.EMPTY, { start: 0, end: 1 }]);
		});
	
		test('A overlaps B at end', function() {
			const A: IRange = { start: 2, end: 6 };
			const B: IRange = { start: 5, end: 8 };
			assert.deepStrictEqual(Range.relativeComplement(A, B), [Range.EMPTY, { start: 6, end: 8 }]);
		});
	
		test('A equals B', function() {
			const A: IRange = { start: 2, end: 5 };
			const B: IRange = { start: 2, end: 5 };
			assert.deepStrictEqual(Range.relativeComplement(A, B), [Range.EMPTY, Range.EMPTY]);
		});
	
		test('B entirely before A', function() {
			const A: IRange = { start: 10, end: 15 };
			const B: IRange = { start: 1, end: 5 };
			assert.deepStrictEqual(Range.relativeComplement(A, B), [Range.EMPTY, { start: 1, end: 5 }]);
		});
	
		test('B entirely after A', function() {
			const A: IRange = { start: 1, end: 5 };
			const B: IRange = { start: 6, end: 10 };
			assert.deepStrictEqual(Range.relativeComplement(A, B), [Range.EMPTY, { start: 6, end: 10 }]);
		});
	
		test('A fully contains B', function() {
			const A: IRange = { start: 1, end: 10 };
			const B: IRange = { start: 2, end: 5 };
			assert.deepStrictEqual(Range.relativeComplement(A, B), [Range.EMPTY, Range.EMPTY]);
		});
	});

	test('listIntersection', () => {
		assert.deepStrictEqual(
			Range.listIntersection(
				{ start: 0, end: 0 },
				[{ range: { start: 0, end: 10 }, size: 1 }]
			),
			[]
		);

		assert.deepStrictEqual(
			Range.listIntersection(
				{ start: 10, end: 20 },
				[{ range: { start: 0, end: 10 }, size: 1 }]
			),
			[]
		);

		assert.deepStrictEqual(
			Range.listIntersection(
				{ start: 2, end: 8 },
				[{ range: { start: 0, end: 10 }, size: 1 }]
			),
			[{ range: { start: 2, end: 8 }, size: 1 }]
		);

		assert.deepStrictEqual(
			Range.listIntersection(
				{ start: 2, end: 8 },
				[{ range: { start: 0, end: 10 }, size: 1 }, { range: { start: 10, end: 20 }, size: 5 }]
			),
			[{ range: { start: 2, end: 8 }, size: 1 }]
		);

		assert.deepStrictEqual(
			Range.listIntersection(
				{ start: 12, end: 18 },
				[{ range: { start: 0, end: 10 }, size: 1 }, { range: { start: 10, end: 20 }, size: 5 }]
			),
			[{ range: { start: 12, end: 18 }, size: 5 }]
		);

		assert.deepStrictEqual(
			Range.listIntersection(
				{ start: 2, end: 18 },
				[{ range: { start: 0, end: 10 }, size: 1 }, { range: { start: 10, end: 20 }, size: 5 }]
			),
			[{ range: { start: 2, end: 10 }, size: 1 }, { range: { start: 10, end: 18 }, size: 5 }]
		);

		assert.deepStrictEqual(
			Range.listIntersection(
				{ start: 2, end: 28 },
				[{ range: { start: 0, end: 10 }, size: 1 }, { range: { start: 10, end: 20 }, size: 5 }, { range: { start: 20, end: 30 }, size: 10 }]
			),
			[{ range: { start: 2, end: 10 }, size: 1 }, { range: { start: 10, end: 20 }, size: 5 }, { range: { start: 20, end: 28 }, size: 10 }]
		);
	});

	test('flatten', () => {
		assert.deepStrictEqual(Range.flatten([]), []);

		assert.deepStrictEqual(
			Range.flatten([{ range: { start: 0, end: 10 }, size: 1 }]),
			[{ range: { start: 0, end: 10 }, size: 1 }]
		);

		assert.deepStrictEqual(
			Range.flatten([
				{ range: { start: 0, end: 10 }, size: 1 },
				{ range: { start: 10, end: 20 }, size: 1 }
			]),
			[{ range: { start: 0, end: 20 }, size: 1 }]
		);

		assert.deepStrictEqual(
			Range.flatten([
				{ range: { start: 0, end: 10 }, size: 1 },
				{ range: { start: 10, end: 20 }, size: 1 },
				{ range: { start: 20, end: 100 }, size: 1 }
			]),
			[{ range: { start: 0, end: 100 }, size: 1 }]
		);

		assert.deepStrictEqual(
			Range.flatten([
				{ range: { start: 0, end: 10 }, size: 1 },
				{ range: { start: 10, end: 20 }, size: 5 },
				{ range: { start: 20, end: 30 }, size: 10 }
			]),
			[
				{ range: { start: 0, end: 10 }, size: 1 },
				{ range: { start: 10, end: 20 }, size: 5 },
				{ range: { start: 20, end: 30 }, size: 10 }
			]
		);

		assert.deepStrictEqual(
			Range.flatten([
				{ range: { start: 0, end: 10 }, size: 1 },
				{ range: { start: 10, end: 20 }, size: 2 },
				{ range: { start: 20, end: 100 }, size: 2 }
			]),
			[
				{ range: { start: 0, end: 10 }, size: 1 },
				{ range: { start: 10, end: 100 }, size: 2 }
			]
		);
	});

	test('concatenate', () => {
		const part1: IRangeList[] = [
			{range: {start: 0, end: 20}, size: 10}, 
			{range: {start: 10, end: 30}, size: 10}, 
			{range: {start: 15, end: 20}, size: 10}, 
		];
		const part2: IRangeList[] = [
			{range: {start: 0, end: 20}, size: 10}, 
			{range: {start: 10, end: 50}, size: 10}, 
		];
		assert.deepStrictEqual(Range.concatenate(part1, part2), [{range: {start: 0, end: 50}, size: 10}]);

		const part3: IRangeList[] = [
			{range: {start: 10, end: 30}, size: 20}, 
		];
		assert.deepStrictEqual(Range.concatenate(part1, part2, part3), [{range: {start: 0, end: 50}, size: 10}, {range: {start: 10, end: 30}, size: 20}]);
	});
});

suite('RangeTable-test', () => {
	let rangeMap: RangeTable;

	setup(() => {
		rangeMap = new RangeTable();
	});

	test('empty', () => {
		assert.strictEqual(rangeMap.size(), 0);
		assert.strictEqual(rangeMap.count(), 0);
	});

	const one = { size: 1 };
	const two = { size: 2 };
	const three = { size: 3 };
	const five = { size: 5 };
	const ten = { size: 10 };

	test('length & count', () => {
		rangeMap.splice(0, 0, [one]);
		assert.strictEqual(rangeMap.size(), 1);
		assert.strictEqual(rangeMap.count(), 1);
	});

	test('length & count #2', () => {
		rangeMap.splice(0, 0, [one, one, one, one, one]);
		assert.strictEqual(rangeMap.size(), 5);
		assert.strictEqual(rangeMap.count(), 5);
	});

	test('length & count #3', () => {
		rangeMap.splice(0, 0, [five]);
		assert.strictEqual(rangeMap.size(), 5);
		assert.strictEqual(rangeMap.count(), 1);
	});

	test('length & count #4', () => {
		rangeMap.splice(0, 0, [five, five, five, five, five]);
		assert.strictEqual(rangeMap.size(), 25);
		assert.strictEqual(rangeMap.count(), 5);
	});

	test('insert', () => {
		rangeMap.splice(0, 0, [five, five, five, five, five]);
		assert.strictEqual(rangeMap.size(), 25);
		assert.strictEqual(rangeMap.count(), 5);

		rangeMap.splice(0, 0, [five, five, five, five, five]);
		assert.strictEqual(rangeMap.size(), 50);
		assert.strictEqual(rangeMap.count(), 10);

		rangeMap.splice(5, 0, [ten, ten]);
		assert.strictEqual(rangeMap.size(), 70);
		assert.strictEqual(rangeMap.count(), 12);

		rangeMap.splice(12, 0, [{ size: 200 }]);
		assert.strictEqual(rangeMap.size(), 270);
		assert.strictEqual(rangeMap.count(), 13);
	});

	test('delete', () => {
		rangeMap.splice(0, 0, [five, five, five, five, five,
			five, five, five, five, five,
			five, five, five, five, five,
			five, five, five, five, five]);
		assert.strictEqual(rangeMap.size(), 100);
		assert.strictEqual(rangeMap.count(), 20);

		rangeMap.splice(10, 5);
		assert.strictEqual(rangeMap.size(), 75);
		assert.strictEqual(rangeMap.count(), 15);

		rangeMap.splice(0, 1);
		assert.strictEqual(rangeMap.size(), 70);
		assert.strictEqual(rangeMap.count(), 14);

		rangeMap.splice(1, 13);
		assert.strictEqual(rangeMap.size(), 5);
		assert.strictEqual(rangeMap.count(), 1);

		rangeMap.splice(1, 1);
		assert.strictEqual(rangeMap.size(), 5);
		assert.strictEqual(rangeMap.count(), 1);
	});

	test('insert & delete', () => {
		assert.strictEqual(rangeMap.size(), 0);
		assert.strictEqual(rangeMap.count(), 0);

		rangeMap.splice(0, 0, [one]);
		assert.strictEqual(rangeMap.size(), 1);
		assert.strictEqual(rangeMap.count(), 1);

		rangeMap.splice(0, 1);
		assert.strictEqual(rangeMap.size(), 0);
		assert.strictEqual(rangeMap.count(), 0);
	});

	test('insert & delete #2', () => {
		rangeMap.splice(0, 0, [one, one, one, one, one,
			one, one, one, one, one]);
		rangeMap.splice(2, 6);
		assert.strictEqual(rangeMap.count(), 4);
		assert.strictEqual(rangeMap.size(), 4);
	});

	test('insert & delete #3', () => {
		rangeMap.splice(0, 0, [one, one, one, one, one,
			one, one, one, one, one,
			two, two, two, two, two,
			two, two, two, two, two]);
		rangeMap.splice(8, 4);
		assert.strictEqual(rangeMap.count(), 16);
		assert.strictEqual(rangeMap.size(), 24);
	});

	test('insert & delete #3', () => {
		rangeMap.splice(0, 0, [one, one, one, one, one,
			one, one, one, one, one,
			two, two, two, two, two,
			two, two, two, two, two]);
		rangeMap.splice(5, 0, [three, three, three, three, three]);
		assert.strictEqual(rangeMap.count(), 25);
		assert.strictEqual(rangeMap.size(), 45);

		rangeMap.splice(4, 7);
		assert.strictEqual(rangeMap.count(), 18);
		assert.strictEqual(rangeMap.size(), 28);
	});

	suite('indexAt, positionAt', () => {
		test('empty', () => {
			assert.strictEqual(rangeMap.indexAt(0), 0);
			assert.strictEqual(rangeMap.indexAt(10), 0);
			assert.strictEqual(rangeMap.indexAt(-1), -1);
			assert.strictEqual(rangeMap.positionAt(0), -1);
			assert.strictEqual(rangeMap.positionAt(10), -1);
			assert.strictEqual(rangeMap.positionAt(-1), -1);
		});

		test('simple', () => {
			rangeMap.splice(0, 0, [one]);
			assert.strictEqual(rangeMap.indexAt(0), 0);
			assert.strictEqual(rangeMap.indexAt(1), 1);
			assert.strictEqual(rangeMap.positionAt(0), 0);
			assert.strictEqual(rangeMap.positionAt(1), -1);
		});

		test('simple #2', () => {
			rangeMap.splice(0, 0, [ten]);
			assert.strictEqual(rangeMap.indexAt(0), 0);
			assert.strictEqual(rangeMap.indexAt(5), 0);
			assert.strictEqual(rangeMap.indexAt(9), 0);
			assert.strictEqual(rangeMap.indexAt(10), 1);
			assert.strictEqual(rangeMap.positionAt(0), 0);
			assert.strictEqual(rangeMap.positionAt(1), -1);
		});

		test('insert', () => {
			rangeMap.splice(0, 0, [one, one, one, one, one, one, one, one, one, one]);
			assert.strictEqual(rangeMap.indexAt(0), 0);
			assert.strictEqual(rangeMap.indexAt(1), 1);
			assert.strictEqual(rangeMap.indexAt(5), 5);
			assert.strictEqual(rangeMap.indexAt(9), 9);
			assert.strictEqual(rangeMap.indexAt(10), 10);
			assert.strictEqual(rangeMap.indexAt(11), 10);

			rangeMap.splice(10, 0, [one, one, one, one, one, one, one, one, one, one]);
			assert.strictEqual(rangeMap.indexAt(10), 10);
			assert.strictEqual(rangeMap.indexAt(19), 19);
			assert.strictEqual(rangeMap.indexAt(20), 20);
			assert.strictEqual(rangeMap.indexAt(21), 20);
			assert.strictEqual(rangeMap.positionAt(0), 0);
			assert.strictEqual(rangeMap.positionAt(1), 1);
			assert.strictEqual(rangeMap.positionAt(19), 19);
			assert.strictEqual(rangeMap.positionAt(20), -1);
		});

		test('delete', () => {
			rangeMap.splice(0, 0, [one, one, one, one, one, one, one, one, one, one]);
			rangeMap.splice(2, 6);

			assert.strictEqual(rangeMap.indexAt(0), 0);
			assert.strictEqual(rangeMap.indexAt(1), 1);
			assert.strictEqual(rangeMap.indexAt(3), 3);
			assert.strictEqual(rangeMap.indexAt(4), 4);
			assert.strictEqual(rangeMap.indexAt(5), 4);
			assert.strictEqual(rangeMap.positionAt(0), 0);
			assert.strictEqual(rangeMap.positionAt(1), 1);
			assert.strictEqual(rangeMap.positionAt(3), 3);
			assert.strictEqual(rangeMap.positionAt(4), -1);
		});

		test('delete #2', () => {
			rangeMap.splice(0, 0, [ten, ten, ten, ten, ten, ten, ten, ten, ten, ten]);
			rangeMap.splice(2, 6);

			assert.strictEqual(rangeMap.indexAt(0), 0);
			assert.strictEqual(rangeMap.indexAt(1), 0);
			assert.strictEqual(rangeMap.indexAt(30), 3);
			assert.strictEqual(rangeMap.indexAt(40), 4);
			assert.strictEqual(rangeMap.indexAt(50), 4);
			assert.strictEqual(rangeMap.positionAt(0), 0);
			assert.strictEqual(rangeMap.positionAt(1), 10);
			assert.strictEqual(rangeMap.positionAt(2), 20);
			assert.strictEqual(rangeMap.positionAt(3), 30);
			assert.strictEqual(rangeMap.positionAt(4), -1);
		});
	});
});
