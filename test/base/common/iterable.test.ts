import * as assert from 'assert';
import { Iterable } from 'src/base/common/iterable';

suite('iterable-test', () => {

    test('map', () => {
        const fn = (each: number, index: number) => each % 2 === 0;
        assert.deepStrictEqual(Array.from(Iterable.map([0, 3, 1, 200, 5, 7], fn)), [true, false, false, true, false, false]);
    });

    test('reduce', () => {
        const fn = (tot: boolean, curr: boolean) => tot ? true : curr;
        assert.strictEqual(Iterable.reduce([false, true, false, false], false, fn), true);
        assert.strictEqual(Iterable.reduce([false, false, false, false], false, fn), false);
    });

    test('equals', () => {
        assert.strictEqual(Iterable.equals([1, 2], [1, 2]), true);
		assert.strictEqual(Iterable.equals([1, 2], [1]), false);
		assert.strictEqual(Iterable.equals([1], [1, 2]), false);
		assert.strictEqual(Iterable.equals([2, 1], [1, 2]), false);
    });

});