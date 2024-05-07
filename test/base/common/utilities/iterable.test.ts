import * as assert from 'assert';
import { Iterable } from 'src/base/common/utilities/iterable';

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

    test('filter', () => {
        assert.deepStrictEqual(Iterable.filter<number>([], val => (val % 2 === 1)), []);
        assert.deepStrictEqual(Iterable.filter<number>([1, 2, 3, 4], val => (val % 2 === 1)), [1, 3]);
        assert.deepStrictEqual(Iterable.filter<NonNullable<any>>([null, 2, undefined, 4], val => !!val), [2, 4]);
    });

    test('coalesce', () => {
        assert.deepStrictEqual(Iterable.coalesce([]), []);
        assert.deepStrictEqual(Iterable.coalesce([1, 2, 3, 4]), [1, 2, 3, 4]);
        assert.deepStrictEqual(Iterable.coalesce([null, 2, undefined, 4]), [2, 4]);
        assert.deepStrictEqual(Iterable.coalesce([null, 'asd', undefined, 4]), ['asd', 4]);
    });

    suite('maxBy', function() {
        test('should return the maximum value based on the predicate', function() {
            const numbers = [1, 2, 3, 4, 5];
            const result = Iterable.maxBy(numbers, x => x);
            assert.strictEqual(result, 5);
        });
    
        test('should handle an empty array', function() {
            const numbers: number[] = [];
            const result = Iterable.maxBy(numbers, x => x);
            assert.strictEqual(result, null);
        });
    
        test('should return the item with maximum computed value', function() {
            const items = [{ name: 'A', value: 10 }, { name: 'B', value: 20 }, { name: 'C', value: 15 }];
            const result = Iterable.maxBy(items, item => item.value);
            assert.strictEqual(result, items[1]);
        });
    
        test('should handle negative values correctly', function() {
            const numbers = [-10, -20, -30, -5, -15];
            const result = Iterable.maxBy(numbers, x => x);
            assert.strictEqual(result, -5);
        });
    
        test('should work with non-integer values', function() {
            const numbers = [0.1, 0.5, 0.3, 0.8, 0.2];
            const result = Iterable.maxBy(numbers, x => x);
            assert.strictEqual(result, 0.8);
        });
    
        test('should return the first max element if multiple elements compute to the same max value', function() {
            const numbers = [1, 3, 5, 5, 4];
            const result = Iterable.maxBy(numbers, x => x);
            assert.strictEqual(result, 5);
        });

        test('should return the maximum value from a Set', function() {
            const numbers = new Set([1, 2, 3, 4, 5]);
            const result = Iterable.maxBy(numbers, x => x);
            assert.strictEqual(result, 5);
        });
    
        test('should return the maximum value from a Map based on keys', function() {
            const map = new Map([[1, 'a'], [2, 'b'], [3, 'c']]);
            const result = Iterable.maxBy(map, x => x[0]);
            assert.deepStrictEqual(result, [3, 'c']);
        });
    
        test('should return the maximum value from a Map based on values', function() {
            const map = new Map([['a', 10], ['b', 20], ['c', 15]]);
            const result = Iterable.maxBy(map, x => x[1]);
            assert.deepStrictEqual(result, ['b', 20]);
        });
    
        test('should work with an Iterable created from a generator function', function() {
            function* generateNumbers() {
                yield 3;
                yield 1;
                yield 2;
            }
            const iterable = generateNumbers();
            const result = Iterable.maxBy(iterable, x => x);
            assert.strictEqual(result, 3);
        });
    
        test('should correctly identify the maximum object in a Set based on a property', function() {
            const objects = new Set([{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }, { id: 3, name: "Charlie" }]);
            const result = Iterable.maxBy(objects, obj => obj.id);
            assert.deepStrictEqual(result, { id: 3, name: "Charlie" });
        });
    });

    suite('minBy', function() {
        test('should return the minimum value based on the predicate', function() {
            const numbers = [5, 4, 3, 2, 1];
            const result = Iterable.minBy(numbers, x => x);
            assert.strictEqual(result, 1);
        });
    
        test('should handle an empty array', function() {
            const numbers: number[] = [];
            const result = Iterable.minBy(numbers, x => x);
            assert.strictEqual(result, null);
        });
    
        test('should return the item with minimum computed value', function() {
            const items = [{ name: 'A', value: 10 }, { name: 'B', value: 20 }, { name: 'C', value: 15 }];
            const result = Iterable.minBy(items, item => item.value);
            assert.strictEqual(result, items[0]);
        });
    
        test('should handle negative values correctly', function() {
            const numbers = [-1, -2, -3, -4, -5];
            const result = Iterable.minBy(numbers, x => x);
            assert.strictEqual(result, -5);
        });
    
        test('should work with non-integer values', function() {
            const numbers = [0.7, 0.1, 0.4, 0.3, 0.2];
            const result = Iterable.minBy(numbers, x => x);
            assert.strictEqual(result, 0.1);
        });
    
        test('should return the first min element if multiple elements compute to the same min value', function() {
            const numbers = [3, 1, 2, 1, 4];
            const result = Iterable.minBy(numbers, x => x);
            assert.strictEqual(result, 1);
        });
    
        test('should return the minimum value from a Set', function() {
            const numbers = new Set([5, 4, 3, 2, 1]);
            const result = Iterable.minBy(numbers, x => x);
            assert.strictEqual(result, 1);
        });
    
        test('should return the minimum value from a Map based on keys', function() {
            const map = new Map([[3, 'c'], [2, 'b'], [1, 'a']]);
            const result = Iterable.minBy(map, x => x[0]);
            assert.deepStrictEqual(result, [1, 'a']);
        });
    
        test('should work with an Iterable created from a generator function', function() {
            function* generateNumbers() {
                yield 3;
                yield 2;
                yield 1;
            }
            const iterable = generateNumbers();
            const result = Iterable.minBy(iterable, x => x);
            assert.strictEqual(result, 1);
        });

        test('should return the minimum value from a Set', function() {
            const numbers = new Set([1, 2, 3, 4, 5]);
            const result = Iterable.minBy(numbers, x => x);
            assert.strictEqual(result, 1);
        });
    
        test('should return the minimum value from a Map based on keys', function() {
            const map = new Map([[1, 'a'], [2, 'b'], [3, 'c']]);
            const result = Iterable.minBy(map, x => x[0]);
            assert.deepStrictEqual(result, [1, 'a']);
        });
    
        test('should return the minimum value from a Map based on values', function() {
            const map = new Map([['a', 10], ['b', 20], ['c', 15]]);
            const result = Iterable.minBy(map, x => x[1]);
            assert.deepStrictEqual(result, ['a', 10]);
        });
    
        test('should work with an Iterable created from a generator function', function() {
            function* generateNumbers() {
                yield 3;
                yield 1;
                yield 2;
            }
            const iterable = generateNumbers();
            const result = Iterable.minBy(iterable, x => x);
            assert.strictEqual(result, 1);
        });
    
        test('should correctly identify the minimum object in a Set based on a property', function() {
            const objects = new Set([{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }, { id: 3, name: "Charlie" }]);
            const result = Iterable.minBy(objects, obj => obj.id);
            assert.deepStrictEqual(result, { id: 1, name: "Alice" });
        });
    });
});