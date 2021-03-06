import * as assert from 'assert';
import { Array } from 'src/base/common/util/array';

suite('array-test', () => {

    test('Array.remove()', () => {
        const arr = [1, 1, 2, 3, 4, 5];
        assert.deepStrictEqual(Array.remove(arr, 1), [1, 2, 3, 4, 5]);
        assert.deepStrictEqual(Array.remove(arr, 1), [2, 3, 4, 5]);
        assert.deepStrictEqual(Array.remove(arr, 1), [2, 3, 4, 5]);
        assert.deepStrictEqual(Array.remove(arr, 5), [2, 3, 4]);
    });

    test('Array.insert()', () => {
        assert.deepStrictEqual(Array.insert([], 3), [3]);
        assert.deepStrictEqual(Array.insert([1], 3), [1, 3]);
        assert.deepStrictEqual(Array.insert([1], 0), [0, 1]);
        assert.deepStrictEqual(Array.insert([1, 3, 5], 9), [1, 3, 5, 9]);
        assert.deepStrictEqual(Array.insert([1, 3, 5], 0), [0, 1, 3, 5]);
        assert.deepStrictEqual(Array.insert([1, 5, 9], 7), [1, 5, 7, 9]);
        assert.deepStrictEqual(Array.insert([1, 5, 9], 13), [1, 5, 9, 13]);
        assert.deepStrictEqual(Array.insert([1, 5, 9], 0), [0, 1, 5, 9]);
        assert.deepStrictEqual(Array.insert([3, 3, 3], 0), [0, 3, 3, 3]);
        assert.deepStrictEqual(Array.insert([3, 3, 3], 6), [3, 3, 3, 6]);
        assert.deepStrictEqual(Array.insert([0, 3, 3, 3], 1), [0, 1, 3, 3, 3]);
        assert.deepStrictEqual(Array.insert([3, 3, 3, 9], 6), [3, 3, 3, 6, 9]);
    });

    test('Array.equals()', () => {
        const ref = [1, 2, 3];
        assert.strictEqual(Array.equals([], []), true);
        assert.strictEqual(Array.equals(ref, ref), true);
        assert.strictEqual(Array.equals(ref, [1, 2, 3, 4]), false);
        assert.strictEqual(Array.equals([1, 2, 3], [1, 2, 3, 4]), false);
        assert.strictEqual(Array.equals([1, 2, 3, 4], [1, 2, 3, 4]), true);
        assert.strictEqual(Array.equals([1, 2, 3, 4], [4, 3, 2, 1]), false);
    });

    test('Array.range()', () => {
        assert.deepStrictEqual(Array.range(0, 5), [0, 1, 2, 3, 4]);
        assert.deepStrictEqual(Array.range(1, 5), [1, 2, 3, 4]);
        assert.deepStrictEqual(Array.range(5, 0), [5, 4, 3, 2, 1]);
        assert.deepStrictEqual(Array.range(5, 1), [5, 4, 3, 2]);
    });

    test('Array.union()', () => {
        assert.deepStrictEqual(Array.union([], []), []);
        assert.deepStrictEqual(Array.union([], [2]), [2]);
        assert.deepStrictEqual(Array.union([1], [2]), [1, 2]);
        assert.deepStrictEqual(Array.union([1], [2, 2]), [1, 2]);
        assert.deepStrictEqual(Array.union([1], [1]), [1]);
        assert.deepStrictEqual(Array.union([1, 1, 2, 3], [4, 5]), [1, 2, 3, 4, 5]);
    });

    test('Array.intersection()', () => {
        assert.deepStrictEqual(Array.intersection([], []), []);
        assert.deepStrictEqual(Array.intersection([], [2]), []);
        assert.deepStrictEqual(Array.intersection([1], [2]), []);
        assert.deepStrictEqual(Array.intersection([1], [2, 2]), []);
        assert.deepStrictEqual(Array.intersection([1], [1]), [1]);
        assert.deepStrictEqual(Array.intersection([1, 1, 2, 3], [1, 2, 4, 5]), [1, 2]);
        assert.deepStrictEqual(Array.intersection([1, 1, 2, 3], [1, 1, 2, 3]), [1, 2, 3]);
    });

    test('Array.disjunction()', () => {
        assert.deepStrictEqual(Array.disjunction([], []), []);
        assert.deepStrictEqual(Array.disjunction([], [2]), [2]);
        assert.deepStrictEqual(Array.disjunction([1], [2]), [1, 2]);
        assert.deepStrictEqual(Array.disjunction([1], [2, 2]), [1, 2]);
        assert.deepStrictEqual(Array.disjunction([1], [1]), []);
        assert.deepStrictEqual(Array.disjunction([1, 1, 2, 3], [1, 2, 4, 5]), [3, 4, 5]);
        assert.deepStrictEqual(Array.disjunction([1, 1, 2, 3], [1, 1, 2, 3]), []);
        assert.deepStrictEqual(Array.disjunction([1, 2, 3], [4, 5, 6]), [1, 2, 3, 4, 5, 6]);
    });

    test('Array.complement()', () => {
        assert.deepStrictEqual(Array.relativeComplement([], []), []);
        assert.deepStrictEqual(Array.relativeComplement([], [2]), [2]);
        assert.deepStrictEqual(Array.relativeComplement([1, 2], []), []);
        assert.deepStrictEqual(Array.relativeComplement([1], [2]), [2]);
        assert.deepStrictEqual(Array.relativeComplement([1], [2, 2]), [2]);
        assert.deepStrictEqual(Array.relativeComplement([1], [1]), []);
        assert.deepStrictEqual(Array.relativeComplement([1, 1, 2, 3], [1, 2, 4, 5, 5]), [4, 5]);
        assert.deepStrictEqual(Array.relativeComplement([1, 1, 2, 3], [1, 1, 2, 3]), []);
        assert.deepStrictEqual(Array.relativeComplement([1, 2, 3], [4, 5, 6]), [4, 5, 6]);
    });

    test('Array.unique()', () => {
        assert.deepStrictEqual(Array.unique([]), []);
        assert.deepStrictEqual(Array.unique([1, 2]), [1, 2]);
        assert.deepStrictEqual(Array.unique([1, 1, 1]), [1]);
        assert.deepStrictEqual(Array.unique([1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3]), [1, 2, 3]);
    });

});