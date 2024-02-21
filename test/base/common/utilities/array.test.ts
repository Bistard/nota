import * as assert from 'assert';
import { Arrays } from 'src/base/common/utilities/array';
import { CompareOrder, isNumber } from 'src/base/common/utilities/type';

suite('array-test', () => {

    test('clear', () => {
        assert.strictEqual(Arrays.clear([]).length, 0);
        assert.strictEqual(Arrays.clear([1, 2, 3]).length, 0);
        assert.strictEqual(Arrays.clear([[], 1, 2, 3, 'abc', [true, false, { value: null }]]).length, 0);
    });

    test('swap', () => {
        assert.deepStrictEqual(Arrays.swap([], 0, 1), []);
        assert.deepStrictEqual(Arrays.swap([1, 2, 3], 0, 3), [1, 2, 3]);
        assert.deepStrictEqual(Arrays.swap([1, 2, 3], 0, 2), [3, 2, 1]);
    });

    test('remove', () => {
        const arr = [1, 1, 2, 3, 4, 5];
        assert.deepStrictEqual(Arrays.remove(arr, 1), [1, 2, 3, 4, 5]);
        assert.deepStrictEqual(Arrays.remove(arr, 1), [2, 3, 4, 5]);
        assert.deepStrictEqual(Arrays.remove(arr, 1), [2, 3, 4, 5]);
        assert.deepStrictEqual(Arrays.remove(arr, 5), [2, 3, 4]);

        // with provided index
        assert.deepStrictEqual(Arrays.remove(arr, 2, 0), [3, 4]);
        assert.deepStrictEqual(Arrays.remove(arr, 4, 1), [3]);
        assert.deepStrictEqual(Arrays.remove(arr, 100, 0), []);
    });

    suite('removeByIndex', function() {
        
        test('should remove single element from array', function() {
            const array = [1, 2, 3, 4];
            const indices = [2];
            Arrays.removeByIndex(array, indices);
            assert.deepStrictEqual(array, [1, 2, 4]);
        });

        test('should remove multiple elements from array', function() {
            const array = ['a', 'b', 'c', 'd', 'e'];
            const indices = [1, 3];
            Arrays.removeByIndex(array, indices);
            assert.deepStrictEqual(array, ['a', 'c', 'e']);
        });

        test('should handle empty indices array', function() {
            const array = [10, 20, 30];
            const indices = [];
            Arrays.removeByIndex(array, indices);
            assert.deepStrictEqual(array, [10, 20, 30]);
        });

        test('should ignore out-of-bound indices', function() {
            const array = [5, 6, 7];
            const indices = [-1, 3, 5];
            Arrays.removeByIndex(array, indices);
            assert.deepStrictEqual(array, [5, 6, 7]);
        });
    });

    test('fill', () => {
        assert.deepStrictEqual(Arrays.fill('hello', 0), []);
        assert.deepStrictEqual(Arrays.fill('hello', 1), ['hello']);
        assert.deepStrictEqual(Arrays.fill('hello', 5), ['hello', 'hello', 'hello', 'hello', 'hello']);
    });

    test('reverseIterate', () => {
        const arr = [1, 2, 3, 4, 5];
        const newArr: number[] = [];
        Arrays.reverseIterate(arr, (ele) => { newArr.push(ele); });
        assert.deepStrictEqual(newArr, arr.reverse());
    });

    test('insertSorted', () => {
        assert.deepStrictEqual(Arrays.insertSorted([], 3), [3]);
        assert.deepStrictEqual(Arrays.insertSorted([1], 3), [1, 3]);
        assert.deepStrictEqual(Arrays.insertSorted([1], 0), [0, 1]);
        assert.deepStrictEqual(Arrays.insertSorted([1, 3, 5], 9), [1, 3, 5, 9]);
        assert.deepStrictEqual(Arrays.insertSorted([1, 3, 5], 0), [0, 1, 3, 5]);
        assert.deepStrictEqual(Arrays.insertSorted([1, 5, 9], 7), [1, 5, 7, 9]);
        assert.deepStrictEqual(Arrays.insertSorted([1, 5, 9], 13), [1, 5, 9, 13]);
        assert.deepStrictEqual(Arrays.insertSorted([1, 5, 9], 0), [0, 1, 5, 9]);
        assert.deepStrictEqual(Arrays.insertSorted([3, 3, 3], 0), [0, 3, 3, 3]);
        assert.deepStrictEqual(Arrays.insertSorted([3, 3, 3], 6), [3, 3, 3, 6]);
        assert.deepStrictEqual(Arrays.insertSorted([0, 3, 3, 3], 1), [0, 1, 3, 3, 3]);
        assert.deepStrictEqual(Arrays.insertSorted([3, 3, 3, 9], 6), [3, 3, 3, 6, 9]);
    });

    suite('insertByIndex', function() {
        
        test('Insert single elements at different positions', function() {
          const originalArray = [1, 3];
          const result = Arrays.insertByIndex(originalArray, [0, 2], [[0], [4]]);
          assert.deepEqual(result, [0, 1, 3, 4]);
        });
      
        test('Insert multiple elements at a single position', function() {
          const originalArray = [1, 3];
          const result = Arrays.insertByIndex(originalArray, [1], [[2, 2.5]]);
          assert.deepEqual(result, [1, 2, 2.5, 3]);
        });
      
        test('Insert elements at consecutive positions', function() {
          const originalArray = ['a', 'd'];
          const result = Arrays.insertByIndex(originalArray, [1, 2], [['b', 'c'], ['e']]);
          assert.deepEqual(result, ['a', 'b', 'c', 'd', 'e']);
        });
      
        test('Insert with no elements (no-op)', function() {
          const originalArray = [10, 20];
          const result = Arrays.insertByIndex(originalArray, [], []);
          assert.deepEqual(result, [10, 20]);
        });
      
        test('Insert at the end of the array', function() {
          const originalArray = [1, 2];
          const result = Arrays.insertByIndex(originalArray, [2], [[3]]);
          assert.deepEqual(result, [1, 2, 3]);
        });
      
        test('Attempt insert with mismatched indice and elements length', function() {
          const originalArray = [1, 2, 3];
          assert.throws(() => Arrays.insertByIndex(originalArray, [1], [[4], [5]]));
        });
      
        test('Attempt insert out of bounds', function() {
          const originalArray = [1, 2, 3];
          assert.throws(() => Arrays.insertByIndex(originalArray, [4], [[5]]));
        });
      });

    test('exactEquals', () => {
        const ref = [1, 2, 3];
        assert.strictEqual(Arrays.exactEquals([], []), true);
        assert.strictEqual(Arrays.exactEquals(ref, ref), true);
        assert.strictEqual(Arrays.exactEquals(ref, [1, 2, 3, 4]), false);
        assert.strictEqual(Arrays.exactEquals([1, 2, 3], [1, 2, 3, 4]), false);
        assert.strictEqual(Arrays.exactEquals([1, 2, 3, 4], [1, 2, 3, 4]), true);
        assert.strictEqual(Arrays.exactEquals([1, 2, 3, 4], [4, 3, 2, 1]), false);
    });

    test('range', () => {
        assert.deepStrictEqual(Arrays.range(0, 5), [0, 1, 2, 3, 4]);
        assert.deepStrictEqual(Arrays.range(1, 5), [1, 2, 3, 4]);
        assert.deepStrictEqual(Arrays.range(5, 0), [5, 4, 3, 2, 1]);
        assert.deepStrictEqual(Arrays.range(5, 1), [5, 4, 3, 2]);
    });

    test('union', () => {
        assert.deepStrictEqual(Arrays.union([], []), []);
        assert.deepStrictEqual(Arrays.union([], [2]), [2]);
        assert.deepStrictEqual(Arrays.union([1], [2]), [1, 2]);
        assert.deepStrictEqual(Arrays.union([1], [2, 2]), [1, 2]);
        assert.deepStrictEqual(Arrays.union([1], [1]), [1]);
        assert.deepStrictEqual(Arrays.union([1, 1, 2, 3], [4, 5]), [1, 2, 3, 4, 5]);
    });

    test('intersection', () => {
        assert.deepStrictEqual(Arrays.intersection([], []), []);
        assert.deepStrictEqual(Arrays.intersection([], [2]), []);
        assert.deepStrictEqual(Arrays.intersection([1], [2]), []);
        assert.deepStrictEqual(Arrays.intersection([1], [2, 2]), []);
        assert.deepStrictEqual(Arrays.intersection([1], [1]), [1]);
        assert.deepStrictEqual(Arrays.intersection([1, 1, 2, 3], [1, 2, 4, 5]), [1, 2]);
        assert.deepStrictEqual(Arrays.intersection([1, 1, 2, 3], [1, 1, 2, 3]), [1, 2, 3]);
    });

    test('disjunction', () => {
        assert.deepStrictEqual(Arrays.disjunction([], []), []);
        assert.deepStrictEqual(Arrays.disjunction([], [2]), [2]);
        assert.deepStrictEqual(Arrays.disjunction([1], [2]), [1, 2]);
        assert.deepStrictEqual(Arrays.disjunction([1], [2, 2]), [1, 2]);
        assert.deepStrictEqual(Arrays.disjunction([1], [1]), []);
        assert.deepStrictEqual(Arrays.disjunction([1, 1, 2, 3], [1, 2, 4, 5]), [3, 4, 5]);
        assert.deepStrictEqual(Arrays.disjunction([1, 1, 2, 3], [1, 1, 2, 3]), []);
        assert.deepStrictEqual(Arrays.disjunction([1, 2, 3], [4, 5, 6]), [1, 2, 3, 4, 5, 6]);
    });

    test('complement', () => {
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

    test('unique', () => {
        assert.deepStrictEqual(Arrays.unique([]), []);
        assert.deepStrictEqual(Arrays.unique([1, 2]), [1, 2]);
        assert.deepStrictEqual(Arrays.unique([1, 1, 1]), [1]);
        assert.deepStrictEqual(Arrays.unique([1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3]), [1, 2, 3]);
    });

    test('matchAny', () => {
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

    test('matchAll', () => {
        let array: any[] = [1, 2, 3, 4, 5];
        let values: any[] = [1, 2, 3];
        let result = Arrays.matchAll(array, values);
        assert.strictEqual(result, true);

        array = [];
        values = [];
        result = Arrays.matchAll(array, values);
        assert.strictEqual(result, true);

        array = [1, 2, 3, 4, 5];
        values = [];
        result = Arrays.matchAll(array, values);
        assert.strictEqual(result, true);

        array = [1, 2, 3, 4, 5];
        values = [1, 2, 6];
        result = Arrays.matchAll(array, values);
        assert.strictEqual(result, false);

        array = ['apple', 'banana', 'cherry'];
        values = ['banana', 'cherry'];
        result = Arrays.matchAll(array, values);
        assert.strictEqual(result, true);

        array = ['apple', 'banana', 'cherry'];
        values = ['apple', 'banana'];
        result = Arrays.matchAll(array, values);
        assert.strictEqual(result, true);

        array = ['apple', 'banana', 'cherry'];
        values = ['apple', 'banana', 'pear'];
        result = Arrays.matchAll(array, values);
        assert.strictEqual(result, false);
    });

    test('binarySearch', () => {
        
        function bs (arr: number[], expect: number, expectResult: boolean) {
            const match = (value: number) => { 
                if (value === expect) {
                    return CompareOrder.Same;
                } else if (value < expect) {
                    return CompareOrder.First;
                } else {
                    return CompareOrder.Second;
                }
            };
            assert.strictEqual(isNumber(Arrays.binarySearch(arr, match)), expectResult, `array: [${arr}], searchFor: ${expect}, expectResult: ${expectResult}`);
        }

        function bsArr(arr: number[]) {
            if (arr.length === 0) {
                bs([], 0, false);
                return;
            }
            
            const min = Math.min(...arr);
            const max = Math.max(...arr);

            for (let num = min; num <= max; num++) {
                const existed = !(arr.indexOf(num) === -1);
                bs(arr, num, existed);
            }
        }

        bsArr([]);
        bsArr([1]);
        bsArr([1, 2]);
        bsArr([1, 10]);
        bsArr([1, 10, 11]);
        bsArr([0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 100]);
    });

    test('fromIterable without converter', function() {
        const inputArray = [1, 2, 3];
        const expectedOutput = [1, 2, 3];
        assert.deepStrictEqual(Arrays.fromIterable(inputArray), expectedOutput);
    });

    test('fromIterable with converter', function() {
        const inputArray = ['1', '2', '3'];
        const converter = (item: string) => parseInt(item);
        const expectedOutput = [1, 2, 3];
        assert.deepStrictEqual(Arrays.fromIterable(inputArray, converter), expectedOutput);
    });

    test('fromSet without converter', function() {
        const inputSet = new Set([1, 2, 3]);
        const expectedOutput = [1, 2, 3];
        assert.deepStrictEqual(Arrays.fromSet(inputSet), expectedOutput);
    });

    test('fromSet with converter', function() {
        const inputSet = new Set([1, 2, 3]);
        const converter = (item: number) => item.toString();
        const expectedOutput = ['1', '2', '3'];
        assert.deepStrictEqual(Arrays.fromSet(inputSet, converter), expectedOutput);
    });

    test('fromMap without converter', function() {
        const inputMap = new Map([['a', 1], ['b', 2], ['c', 3]]);
        const converter = (value: number, key: string) => `${key}${value}`;
        const expectedOutput = ['a1', 'b2', 'c3'];
        assert.deepStrictEqual(Arrays.fromMap(inputMap, converter), expectedOutput);
    });

    test('fromMap with converter', function() {
        const inputMap = new Map();
        const converter = (value: any, key: any) => `${key}${value}`;
        const expectedOutput: string[] = [];
        assert.deepStrictEqual(Arrays.fromMap(inputMap, converter), expectedOutput);
    });
});