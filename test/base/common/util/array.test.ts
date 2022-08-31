import * as assert from 'assert';
import { Arrays } from 'src/base/common/util/array';

suite('array-test', () => {

    test('Array.remove()', () => {
        const arr = [1, 1, 2, 3, 4, 5];
        assert.deepStrictEqual(Arrays.remove(arr, 1), [1, 2, 3, 4, 5]);
        assert.deepStrictEqual(Arrays.remove(arr, 1), [2, 3, 4, 5]);
        assert.deepStrictEqual(Arrays.remove(arr, 1), [2, 3, 4, 5]);
        assert.deepStrictEqual(Arrays.remove(arr, 5), [2, 3, 4]);
    });

    test('Array.insert()', () => {
        assert.deepStrictEqual(Arrays.insert([], 3), [3]);
        assert.deepStrictEqual(Arrays.insert([1], 3), [1, 3]);
        assert.deepStrictEqual(Arrays.insert([1], 0), [0, 1]);
        assert.deepStrictEqual(Arrays.insert([1, 3, 5], 9), [1, 3, 5, 9]);
        assert.deepStrictEqual(Arrays.insert([1, 3, 5], 0), [0, 1, 3, 5]);
        assert.deepStrictEqual(Arrays.insert([1, 5, 9], 7), [1, 5, 7, 9]);
        assert.deepStrictEqual(Arrays.insert([1, 5, 9], 13), [1, 5, 9, 13]);
        assert.deepStrictEqual(Arrays.insert([1, 5, 9], 0), [0, 1, 5, 9]);
        assert.deepStrictEqual(Arrays.insert([3, 3, 3], 0), [0, 3, 3, 3]);
        assert.deepStrictEqual(Arrays.insert([3, 3, 3], 6), [3, 3, 3, 6]);
        assert.deepStrictEqual(Arrays.insert([0, 3, 3, 3], 1), [0, 1, 3, 3, 3]);
        assert.deepStrictEqual(Arrays.insert([3, 3, 3, 9], 6), [3, 3, 3, 6, 9]);
    });

    test('Array.equals()', () => {
        const ref = [1, 2, 3];
        assert.strictEqual(Arrays.equals([], []), true);
        assert.strictEqual(Arrays.equals(ref, ref), true);
        assert.strictEqual(Arrays.equals(ref, [1, 2, 3, 4]), false);
        assert.strictEqual(Arrays.equals([1, 2, 3], [1, 2, 3, 4]), false);
        assert.strictEqual(Arrays.equals([1, 2, 3, 4], [1, 2, 3, 4]), true);
        assert.strictEqual(Arrays.equals([1, 2, 3, 4], [4, 3, 2, 1]), false);
    });

    test('Array.range()', () => {
        assert.deepStrictEqual(Arrays.range(0, 5), [0, 1, 2, 3, 4]);
        assert.deepStrictEqual(Arrays.range(1, 5), [1, 2, 3, 4]);
        assert.deepStrictEqual(Arrays.range(5, 0), [5, 4, 3, 2, 1]);
        assert.deepStrictEqual(Arrays.range(5, 1), [5, 4, 3, 2]);
    });

    test('Array.union()', () => {
        assert.deepStrictEqual(Arrays.union([], []), []);
        assert.deepStrictEqual(Arrays.union([], [2]), [2]);
        assert.deepStrictEqual(Arrays.union([1], [2]), [1, 2]);
        assert.deepStrictEqual(Arrays.union([1], [2, 2]), [1, 2]);
        assert.deepStrictEqual(Arrays.union([1], [1]), [1]);
        assert.deepStrictEqual(Arrays.union([1, 1, 2, 3], [4, 5]), [1, 2, 3, 4, 5]);
    });

    test('Array.intersection()', () => {
        assert.deepStrictEqual(Arrays.intersection([], []), []);
        assert.deepStrictEqual(Arrays.intersection([], [2]), []);
        assert.deepStrictEqual(Arrays.intersection([1], [2]), []);
        assert.deepStrictEqual(Arrays.intersection([1], [2, 2]), []);
        assert.deepStrictEqual(Arrays.intersection([1], [1]), [1]);
        assert.deepStrictEqual(Arrays.intersection([1, 1, 2, 3], [1, 2, 4, 5]), [1, 2]);
        assert.deepStrictEqual(Arrays.intersection([1, 1, 2, 3], [1, 1, 2, 3]), [1, 2, 3]);
    });

    test('Array.disjunction()', () => {
        assert.deepStrictEqual(Arrays.disjunction([], []), []);
        assert.deepStrictEqual(Arrays.disjunction([], [2]), [2]);
        assert.deepStrictEqual(Arrays.disjunction([1], [2]), [1, 2]);
        assert.deepStrictEqual(Arrays.disjunction([1], [2, 2]), [1, 2]);
        assert.deepStrictEqual(Arrays.disjunction([1], [1]), []);
        assert.deepStrictEqual(Arrays.disjunction([1, 1, 2, 3], [1, 2, 4, 5]), [3, 4, 5]);
        assert.deepStrictEqual(Arrays.disjunction([1, 1, 2, 3], [1, 1, 2, 3]), []);
        assert.deepStrictEqual(Arrays.disjunction([1, 2, 3], [4, 5, 6]), [1, 2, 3, 4, 5, 6]);
    });

    test('Array.complement()', () => {
        assert.deepStrictEqual(Arrays.relativeComplement([], []), []);
        assert.deepStrictEqual(Arrays.relativeComplement([], [2]), [2]);
        assert.deepStrictEqual(Arrays.relativeComplement([1, 2], []), []);
        assert.deepStrictEqual(Arrays.relativeComplement([1], [2]), [2]);
        assert.deepStrictEqual(Arrays.relativeComplement([1], [2, 2]), [2]);
        assert.deepStrictEqual(Arrays.relativeComplement([1], [1]), []);
        assert.deepStrictEqual(Arrays.relativeComplement([1, 1, 2, 3], [1, 2, 4, 5, 5]), [4, 5]);
        assert.deepStrictEqual(Arrays.relativeComplement([1, 1, 2, 3], [1, 1, 2, 3]), []);
        assert.deepStrictEqual(Arrays.relativeComplement([1, 2, 3], [4, 5, 6]), [4, 5, 6]);
    });

    test('Array.unique()', () => {
        assert.deepStrictEqual(Arrays.unique([]), []);
        assert.deepStrictEqual(Arrays.unique([1, 2]), [1, 2]);
        assert.deepStrictEqual(Arrays.unique([1, 1, 1]), [1]);
        assert.deepStrictEqual(Arrays.unique([1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3]), [1, 2, 3]);
    });

    test('Array.matchAny()', () => {
        const cmp = (arrVal, myVal) => arrVal === myVal;
        assert.strictEqual(Arrays.matchAny([true], [false, false], cmp), false);
        assert.strictEqual(Arrays.matchAny([true], [true, false], cmp), true);
        assert.strictEqual(Arrays.matchAny([false], [false, false], cmp), true);
        assert.strictEqual(Arrays.matchAny(['hello'], ['not hello', 'world'], cmp), false);
        assert.strictEqual(Arrays.matchAny(['hello'], ['hello', 'world'], cmp), true);

        const cmp1 = (changes: string, desired: string) => desired.startsWith(changes);
        assert.strictEqual(Arrays.matchAny(['path1.path2'], ['path1.path2'], cmp1), true);
        assert.strictEqual(Arrays.matchAny(['path1'], ['path1.path2'], cmp1), true);
        assert.strictEqual(Arrays.matchAny(['path1.path3'], ['path1.path2'], cmp1), false);
    });
});