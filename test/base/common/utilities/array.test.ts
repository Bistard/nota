import * as assert from 'assert';
import { Arrays } from 'src/base/common/utilities/array';
import { CompareOrder, isNumber } from 'src/base/common/utilities/type';

suite('array-test', () => {

    suite('is', function () {
        test('should return true if the object is an array', function () {
            assert.strictEqual(Arrays.is<number>([1, 2, 3]), true);
        });

        test('should return false if the object is not an array', function () {
            assert.strictEqual(Arrays.is<number>({ a: 1, b: 2 }), false);
        });
    });
    
    suite('last', function () {
        test('should return the last element of a non-empty array', () => {
            assert.strictEqual(Arrays.last([1, 2, 3]), 3);
            assert.strictEqual(Arrays.last(['a', 'b', 'c']), 'c');
            assert.strictEqual(Arrays.last([true, false, true]), true);
        });
    
        test('should return undefined for an empty array', () => {
            assert.strictEqual(Arrays.last([]), undefined);
        });
    
        test('should handle arrays with one element', () => {
            assert.strictEqual(Arrays.last([5]), 5);
            assert.strictEqual(Arrays.last(['only']), 'only');
        });
    });

    suite('isType', function() {
        test('should return true for empty array', function() {
            const result = Arrays.isType([], (element): element is number => typeof element === 'number');
            assert.strictEqual(result, true);
        });
    
        test('should return true for all elements matching the type', function() {
            const result = Arrays.isType([1, 2, 3], (element): element is number => typeof element === 'number');
            assert.strictEqual(result, true);
        });
    
        test('should return false if first element does not match the type', function() {
            const result = Arrays.isType(['a', 2, 3], (element): element is number => typeof element === 'number');
            assert.strictEqual(result, false);
        });
    });

    suite('isEmpty', function () {
        test('should return true for an empty array', function () {
            assert.strictEqual(Arrays.isEmpty([]), true);
        });

        test('should return false for a non-empty array', function () {
            assert.strictEqual(Arrays.isEmpty([1]), false);
        });
    });

    suite('isNonEmpty', function () {
        test('should return false for an empty array', function () {
            assert.strictEqual(Arrays.isNonEmpty([]), false);
        });

        test('should return true for a non-empty array', function () {
            assert.strictEqual(Arrays.isNonEmpty([1]), true);
        });
    });
    

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

    suite('exist', () => {
        test('should return true when value exists in the array', () => {
            const result = Arrays.exist([1, 2, 3], 2);
            assert.strictEqual(result, true);
        });
    
        test('should return false when value does not exist in the array', () => {
            const result = Arrays.exist([1, 2, 3], 4);
            assert.strictEqual(result, false);
        });
    
        test('should work with an empty array', () => {
            const result = Arrays.exist([], 1);
            assert.strictEqual(result, false);
        });
    
        test('should work with non-primitive values', () => {
            const obj = { key: 'value' };
            const result = Arrays.exist([obj, { key: 'another' }], obj);
            assert.strictEqual(result, true);
        });
    });
    
    suite('exist2', () => {
        test('should return true when predicate matches an element', () => {
            const result = Arrays.exist2([1, 2, 3], value => value > 2);
            assert.strictEqual(result, true);
        });
    
        test('should return false when predicate does not match any element', () => {
            const result = Arrays.exist2([1, 2, 3], value => value > 5);
            assert.strictEqual(result, false);
        });
    
        test('should pass correct parameters to the predicate', () => {
            const indices: number[] = [];
            Arrays.exist2([10, 20, 30], (value, index) => {
                indices.push(index);
                return false;
            });
            assert.deepStrictEqual(indices, [0, 1, 2]);
        });
    
        test('should work with an empty array', () => {
            const result = Arrays.exist2([], () => true);
            assert.strictEqual(result, false);
        });
    
        test('should work with non-primitive values', () => {
            const obj = { key: 'value' };
            const result = Arrays.exist2([{ key: 'value' }, { key: 'another' }], value => value.key === 'value');
            assert.strictEqual(result, true);
        });
    });

    suite('tail', function() {
        
        test('should return the last element of a non-empty array', function() {
            const inputArray = [1, 2, 3, 4, 5];
            const expectedOutput = 5;
            assert.strictEqual(Arrays.tail(inputArray), expectedOutput);
        });
    
        test('should return the third element from the end when n=2', function() {
            const inputArray = [1, 2, 3, 4, 5];
            const expectedOutput = 3;
            assert.strictEqual(Arrays.tail(inputArray, 2), expectedOutput);
        });
    
        test('should return undefined for an empty array', function() {
            const inputArray: number[] = [];
            const expectedOutput = undefined;
            assert.strictEqual(Arrays.tail(inputArray), expectedOutput);
        });
    
        test('should throw an error if n is larger than array size', function() {
            const inputArray = [1, 2, 3];
            assert.strictEqual(Arrays.tail(inputArray, 5), undefined);
        });
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

    suite('removeByIndex', function () {

        test('should remove single element from array', function () {
            const array = [1, 2, 3, 4];
            const indices = [2];
            Arrays.removeByIndex(array, indices);
            assert.deepStrictEqual(array, [1, 2, 4]);
        });

        test('should remove multiple elements from array', function () {
            const array = ['a', 'b', 'c', 'd', 'e'];
            const indices = [1, 3];
            Arrays.removeByIndex(array, indices);
            assert.deepStrictEqual(array, ['a', 'c', 'e']);
        });

        test('should handle empty indices array', function () {
            const array = [10, 20, 30];
            const indices = [];
            Arrays.removeByIndex(array, indices);
            assert.deepStrictEqual(array, [10, 20, 30]);
        });

        test('should ignore out-of-bound indices', function () {
            const array = [5, 6, 7];
            const indices = [-1, 3, 5];
            Arrays.removeByIndex(array, indices);
            assert.deepStrictEqual(array, [5, 6, 7]);
        });
    });

    suite('relocateByIndex', () => {
        test('should correctly relocate single element', () => {
            const array = [1, 2, 3, 4, 5];
            const result = Arrays.relocateByIndex(array, [2], 0);
            assert.deepStrictEqual(result, [3, 1, 2, 4, 5]);
        });

        test('should correctly relocate multiple elements', () => {
            const array = [1, 2, 3, 4, 5];
            const result = Arrays.relocateByIndex(array, [1, 3], 4);
            assert.deepStrictEqual(result, [1, 3, 2, 4, 5]);
        });

        test('should handle moving elements to the end', () => {
            const array = [1, 2, 3, 4, 5];
            const result = Arrays.relocateByIndex(array, [0, 1], 5);
            assert.deepStrictEqual(result, [3, 4, 5, 1, 2]);
        });

        test('should throw if destination index is out of bounds', () => {
            const array = [1, 2, 3, 4, 5];
            assert.throws(() => Arrays.relocateByIndex(array, [0], 6), Error);
        });

        test('should throw if any of the indices are out of bounds', () => {
            const array = [1, 2, 3, 4, 5];
            assert.throws(() => Arrays.relocateByIndex(array, [5], 0), Error);
        });

        test('should not modify array if indices array is empty', () => {
            const array = [1, 2, 3, 4, 5];
            const result = Arrays.relocateByIndex(array, [], 2);
            assert.deepStrictEqual(result, [1, 2, 3, 4, 5]);
        });

        test('should maintain original order of moved elements', () => {
            const array = [1, 2, 3, 4, 5];
            const result = Arrays.relocateByIndex(array, [1, 3], 2);
            assert.deepStrictEqual(result, [1, 2, 4, 3, 5]);
        });

        test('moves multiple elements to new position', function() {
            const array = ['a', 'b', 'c', 'd', 'e'];
            const result = Arrays.relocateByIndex(array, [1, 2], 4);
            assert.deepStrictEqual(result, ['a', 'd', 'b', 'c', 'e']);
        });
        
        test('moves elements to start of array', function() {
            const array = ['a', 'b', 'c', 'd'];
            const result = Arrays.relocateByIndex(array, [2, 3], 0);
            assert.deepStrictEqual(result, ['c', 'd', 'a', 'b']);
        });
        
        test('maintains original array order for sorted indices', function() {
            const array = ['a', 'b', 'c', 'd', 'e'];
            const result = Arrays.relocateByIndex(array, [0, 2, 4], 1);
            assert.deepStrictEqual(result, ['a', 'c', 'e', 'b', 'd']);
        });

        test('moves multiple adjacent elements forward', function () {
            const array = [1, 2, 3, 4, 5];
            const result = Arrays.relocateByIndex(array, [1, 2], 4);
            assert.deepStrictEqual(result, [1, 4, 2, 3, 5]);
        });

        test('moves multiple non-adjacent elements forward', function () {
            const array = [1, 2, 3, 4, 5];
            const result = Arrays.relocateByIndex(array, [0, 2], 3);
            assert.deepStrictEqual(result, [2, 1, 3, 4, 5]);
        });

        test('moves multiple adjacent elements backward', function () {
            const array = [1, 2, 3, 4, 5];
            const result = Arrays.relocateByIndex(array, [2, 3], 0);
            assert.deepStrictEqual(result, [3, 4, 1, 2, 5]);
        });

        test('moves multiple non-adjacent elements backward', function () {
            const array = [1, 2, 3, 4, 5];
            const result = Arrays.relocateByIndex(array, [1, 3], 0);
            assert.deepStrictEqual(result, [2, 4, 1, 3, 5]);
        });
        
        test('moves elements to middle of array', function () {
            const array = ['a', 'b', 'c', 'd', 'e', 'f'];
            const result = Arrays.relocateByIndex(array, [0, 5], 3);
            assert.deepStrictEqual(result, ['b', 'c', 'a', 'f', 'd', 'e']);
        });

        test('maintains order when moving multiple elements forward', function () {
            const array = ['a', 'b', 'c', 'd', 'e'];
            const result = Arrays.relocateByIndex(array, [0, 1], 3);
            assert.deepStrictEqual(result, ['c', 'a', 'b', 'd', 'e']);
        });

        test('maintains order when moving multiple elements backward', function () {
            const array = ['a', 'b', 'c', 'd', 'e'];
            const result = Arrays.relocateByIndex(array, [3, 4], 1);
            assert.deepStrictEqual(result, ['a', 'd', 'e', 'b', 'c']);
        });

        test('moves 1st element to the 1st', function () {
            const array = [1, 2, 3, 4, 5];
            const result = Arrays.relocateByIndex(array, [0], 0);
            assert.deepStrictEqual(result, [1, 2, 3, 4, 5]);
        });

        test('moves elements to the same index should not change the array', function () {
            const array = [1, 2, 3, 4, 5];
            const result = Arrays.relocateByIndex(array, [1, 2], 1);
            assert.deepStrictEqual(result, [1, 2, 3, 4, 5]);
        });
    });

    test('fill', () => {
        assert.deepStrictEqual(Arrays.fill('hello', 0), []);
        assert.deepStrictEqual(Arrays.fill('hello', 1), ['hello']);
        assert.deepStrictEqual(Arrays.fill('hello', 5), ['hello', 'hello', 'hello', 'hello', 'hello']);
    });

    suite('parallelEach', function() {
        
        test('should iterate over multiple arrays in parallel', function() {
          const nums = [1, 2, 3];
          const strs = ['one', 'two', 'three'];
          const bools = [true, false, true];
      
          const result: Array<[number, string, boolean]> = [];
      
          Arrays.parallelEach([nums, strs, bools], (num, str, bool) => {
            result.push([num, str, bool]);
          });
      
          assert.deepStrictEqual(result, [
            [1, 'one', true],
            [2, 'two', false],
            [3, 'three', true]
          ]);
        });
      
        test('should handle empty array of arrays', function() {
          const result: any[] = [];
      
          Arrays.parallelEach([], () => {
            result.push([]);
          });
      
          assert.deepStrictEqual(result, []);
        });
      
        test('should throw error when inner arrays are not of the same length', function() {
          const nums = [1, 2, 3];
          const strs = ['one', 'two'];
          const bools = [true, false, true];
      
          assert.throws(() => {
            Arrays.parallelEach([nums, strs, bools], () => {});
          }, /All arrays must have the same length/);
        });
    });

    suite('dfs', () => {
        test('DFS should visit all nodes', () => {
            const nodes = ['a', 'b', 'c'];
            const visited: string[] = [];
            Arrays.dfs(nodes, node => { visited.push(node); }, node => []);
            assert.deepEqual(visited, nodes);
        });

        test('DFS should follow child nodes', () => {
            const nodes = { a: ['b'], b: ['c'], c: [] };
            const visited: string[] = [];
            Arrays.dfs(['a'], node => { visited.push(node); }, node => nodes[node]);
            assert.deepEqual(visited, ['a', 'b', 'c']);
        });
    });

    suite('bfs', () => {
        test('BFS should visit all nodes', () => {
            const nodes = ['a', 'b', 'c'];
            const visited: string[] = [];
            Arrays.bfs(nodes, node => { visited.push(node); }, node => []);
            assert.deepEqual(visited, nodes);
        });

        test('BFS should visit nodes level by level', () => {
            const nodes = { a: ['b', 'c'], b: ['d'], c: [], d: [] };
            const visited: string[] = [];
            Arrays.bfs(['a'], node => { visited.push(node); }, node => nodes[node]);
            assert.deepEqual(visited, ['a', 'b', 'c', 'd']);
        });
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

    suite('insertSequence', function () {
        
        test('should insert elements at specified index', function () {
            const result = Arrays.insertSequence([1, 2, 3], 2, [4, 5]);
            assert.deepStrictEqual(result, [1, 2, 4, 5, 3]);
        });
    
        test('should insert elements at the start when index is 0', function () {
            const result = Arrays.insertSequence([1, 2, 3], 0, [4, 5]);
            assert.deepStrictEqual(result, [4, 5, 1, 2, 3]);
        });
    
        test('should append elements when index is equal to array length', function () {
            const result = Arrays.insertSequence([1, 2, 3], 3, [4, 5]);
            assert.deepStrictEqual(result, [1, 2, 3, 4, 5]);
        });
    
        test('should insert elements at the end when index is negative and absolute value is less than array length', function () {
            const result = Arrays.insertSequence([1, 2, 3], -1, [4, 5]);
            assert.deepStrictEqual(result, [1, 2, 4, 5, 3]);
        });
    
        test('should insert elements at the start when index is negative and absolute value is greater than or equal to array length', function () {
            const result = Arrays.insertSequence([1, 2, 3], -4, [4, 5]);
            assert.deepStrictEqual(result, [4, 5, 1, 2, 3]);
        });
    
        test('should handle empty array with non-negative index', function () {
            const result = Arrays.insertSequence([], 0, [4, 5]);
            assert.deepStrictEqual(result, [4, 5]);
        });
    
        test('should handle empty array with negative index', function () {
            const result = Arrays.insertSequence([], -1, [4, 5]);
            assert.deepStrictEqual(result, [4, 5]);
        });
    
        test('should handle insertion of empty elements array', function () {
            const result = Arrays.insertSequence([1, 2, 3], 2, []);
            assert.deepStrictEqual(result, [1, 2, 3]);
        });
    });

    suite('insertMultiple', function() {
        
        test('should insert single item at specified index', function() {
            const arr = [1, 4];
            Arrays.insertMultiple(arr, [0], [0]);
            assert.deepEqual(arr, [0, 1, 4]);
            
            Arrays.insertMultiple(arr, [2], [2]);
            assert.deepEqual(arr, [0, 1, 2, 4]);
            
            Arrays.insertMultiple(arr, [3], [3]);
            assert.deepEqual(arr, [0, 1, 2, 3, 4]);
            
            Arrays.insertMultiple(arr, [5], [5]);
            assert.deepEqual(arr, [0, 1, 2, 3, 4, 5]);
        });

        test('should insert items at specified indices', function() {
            const arr = [1, 4];
            Arrays.insertMultiple(arr, [0, 2, 3], [0, 1, 1]);
            assert.deepEqual(arr, [0, 1, 2, 3, 4]);
        });
    
        test('should handle empty arrays', function() {
            const arr: number[] = [];
            Arrays.insertMultiple(arr, [1, 2], [0, 0]);
            assert.deepEqual(arr, [1, 2]);
        });
    
        test('should handle insertion at the end', function() {
            const arr = [1, 2];
            Arrays.insertMultiple(arr, [3, 4], [2, 2]);
            assert.deepEqual(arr, [1, 2, 3, 4]);
        });
    
        test('should not alter the array if indices array is empty', function() {
            const arr = [1, 2, 3];
            Arrays.insertMultiple(arr, [], []);
            assert.deepEqual(arr, [1, 2, 3]);
        });
    
        test('should throw an error for out of range indices', function() {
            const arr = [1, 2, 3];
            assert.throws(() => Arrays.insertMultiple(arr, [4], [5]), Error);
        });
    });
    
    suite('group', function () {

        test('should group numbers by even and odd', function () {
            const numbers = [1, 2, 3, 4, 5, 6];
            const grouped = Arrays.group(numbers, item => item % 2 === 0 ? 'even' : 'odd');
            assert.deepStrictEqual(grouped.get('even'), [2, 4, 6]);
            assert.deepStrictEqual(grouped.get('odd'), [1, 3, 5]);
        });

        test('should return an empty map for an empty array', function () {
            const emptyArray: number[] = [];
            const grouped = Arrays.group(emptyArray, item => item);
            assert.strictEqual(grouped.size, 0);
        });

        test('should group strings by their first letter', function () {
            const strings = ['apple', 'banana', 'apricot', 'cherry', 'avocado'];
            const grouped = Arrays.group(strings, item => item[0]);
            assert.deepStrictEqual(grouped.get('a'), ['apple', 'apricot', 'avocado']);
            assert.deepStrictEqual(grouped.get('b'), ['banana']);
            assert.deepStrictEqual(grouped.get('c'), ['cherry']);
        });

        test('should handle grouping with custom objects', function () {
            type Fruit = { name: string, color: string; };
            const fruits: Fruit[] = [
                { name: 'apple', color: 'red' },
                { name: 'strawberry', color: 'red' },
                { name: 'banana', color: 'yellow' }
            ];
            const grouped = Arrays.group(fruits, item => item.color);
            assert.deepStrictEqual(grouped.get('red'), [{ name: 'apple', color: 'red' }, { name: 'strawberry', color: 'red' }]);
            assert.deepStrictEqual(grouped.get('yellow'), [{ name: 'banana', color: 'yellow' }]);
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

        function bs(arr: number[], expect: number, expectResult: boolean) {
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

    test('fromIterable without converter', function () {
        const inputArray = [1, 2, 3];
        const expectedOutput = [1, 2, 3];
        assert.deepStrictEqual(Arrays.fromIterable(inputArray), expectedOutput);
    });

    test('fromIterable with converter', function () {
        const inputArray = ['1', '2', '3'];
        const converter = (item: string) => parseInt(item);
        const expectedOutput = [1, 2, 3];
        assert.deepStrictEqual(Arrays.fromIterable(inputArray, converter), expectedOutput);
    });

    test('fromSet without converter', function () {
        const inputSet = new Set([1, 2, 3]);
        const expectedOutput = [1, 2, 3];
        assert.deepStrictEqual(Arrays.fromSet(inputSet), expectedOutput);
    });

    test('fromSet with converter', function () {
        const inputSet = new Set([1, 2, 3]);
        const converter = (item: number) => item.toString();
        const expectedOutput = ['1', '2', '3'];
        assert.deepStrictEqual(Arrays.fromSet(inputSet, converter), expectedOutput);
    });

    test('fromMap without converter', function () {
        const inputMap = new Map([['a', 1], ['b', 2], ['c', 3]]);
        const converter = (value: number, key: string) => `${key}${value}`;
        const expectedOutput = ['a1', 'b2', 'c3'];
        assert.deepStrictEqual(Arrays.fromMap(inputMap, converter), expectedOutput);
    });

    test('fromMap with converter', function () {
        const inputMap = new Map();
        const converter = (value: any, key: any) => `${key}${value}`;
        const expectedOutput: string[] = [];
        assert.deepStrictEqual(Arrays.fromMap(inputMap, converter), expectedOutput);
    });
});