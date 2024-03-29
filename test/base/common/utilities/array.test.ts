import * as assert from 'assert';
import { Arrays } from 'src/base/common/utilities/array';
import { Deque } from "src/base/common/structures/deque";
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

    test('insert', () => {
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
});

suite('deque-test', () => {

    const toArray = function <T>(deque: Deque<T>): T[] {
        const arr: T[] = [];
        for (const ele of deque) {
            arr.push(ele);
        }
        return arr;
    };

    test('constructor', () => {
        const deq = new Deque<number>([1, 2, 3]);
        assert.strictEqual(deq.size(), 3);
        assert.strictEqual(deq.front(), 1);
        assert.strictEqual(deq.at(1), 2);
        assert.strictEqual(deq.back(), 3);
    });

    test('size / empty', () => {
        const deq = new Deque<number>();
        assert.strictEqual(deq.size(), 0);
        assert.strictEqual(deq.empty(), true);
        try {
            deq.at(0);
            assert.fail();
        } catch {
            assert.ok(true);
        }
    });

    test('push / pop', () => {
        const deq = new Deque<number>();
        
        deq.pushBack(1);
        assert.deepStrictEqual(toArray(deq), [1]);

        deq.pushFront(0);
        assert.deepStrictEqual(toArray(deq), [0, 1]);

        deq.popBack();
        assert.deepStrictEqual(toArray(deq), [0]);

        deq.popFront();
        assert.deepStrictEqual(toArray(deq), []);
        assert.strictEqual(deq.empty(), true);
    });

    test('insert / remove', () => {
        const deq = new Deque<number>();
        
        deq.insert(0, 1);
        assert.strictEqual(deq.at(0), 1);
        assert.strictEqual(deq.size(), 1);

        deq.insert(0, 0);
        assert.strictEqual(deq.at(0), 0);
        assert.strictEqual(deq.at(1), 1);
        assert.strictEqual(deq.size(), 2);

        deq.insert(2, 2);
        assert.strictEqual(deq.at(0), 0);
        assert.strictEqual(deq.at(1), 1);
        assert.strictEqual(deq.at(2), 2);
        assert.strictEqual(deq.size(), 3);

        assert.strictEqual(deq.remove(1), 1);
        assert.strictEqual(deq.size(), 2);

        assert.strictEqual(deq.remove(1), 2);
        assert.strictEqual(deq.size(), 1);
    });

    test('replace / swap / reverse', () => {
        const deq = new Deque<number>([1, 2, 3, 4]);

        deq.replace(0, 5);
        assert.deepStrictEqual(toArray(deq), [5, 2, 3, 4]);

        deq.swap(0, deq.size() - 1);
        assert.deepStrictEqual(toArray(deq), [4, 2, 3, 5]);

        deq.reverse();
        assert.deepStrictEqual(toArray(deq), [5, 3, 2, 4]);
    });

    test('extendFront / extendBack / clear', () => {
        const deq = new Deque<number>([1, 2, 3, 4]);
        
        deq.extendBack(new Deque<number>([5, 6, 7]));
        assert.deepStrictEqual(toArray(deq), [1, 2, 3, 4, 5, 6, 7]);

        deq.extendFront(new Deque<number>([0, -1, -2]));
        assert.deepStrictEqual(toArray(deq), [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]);

        deq.clear();
        assert.deepStrictEqual(toArray(deq), []);
        assert.deepStrictEqual(deq.empty(), true);
    });
});