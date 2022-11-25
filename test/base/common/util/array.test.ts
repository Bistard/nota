import * as assert from 'assert';
import { Arrays, Deque, Queue, Stack } from 'src/base/common/util/array';

suite('array-test', () => {

    test('remove', () => {
        const arr = [1, 1, 2, 3, 4, 5];
        assert.deepStrictEqual(Arrays.remove(arr, 1), [1, 2, 3, 4, 5]);
        assert.deepStrictEqual(Arrays.remove(arr, 1), [2, 3, 4, 5]);
        assert.deepStrictEqual(Arrays.remove(arr, 1), [2, 3, 4, 5]);
        assert.deepStrictEqual(Arrays.remove(arr, 5), [2, 3, 4]);
    });

    test('reverseIterate', () => {
        const arr = [1, 2, 3, 4, 5];
        const newArr: number[] = [];
        Arrays.reverseIterate(arr, (ele) => newArr.push(ele));
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

    test('equals', () => {
        const ref = [1, 2, 3];
        assert.strictEqual(Arrays.equals([], []), true);
        assert.strictEqual(Arrays.equals(ref, ref), true);
        assert.strictEqual(Arrays.equals(ref, [1, 2, 3, 4]), false);
        assert.strictEqual(Arrays.equals([1, 2, 3], [1, 2, 3, 4]), false);
        assert.strictEqual(Arrays.equals([1, 2, 3, 4], [1, 2, 3, 4]), true);
        assert.strictEqual(Arrays.equals([1, 2, 3, 4], [4, 3, 2, 1]), false);
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
});

suite('deque-test', () => {

    const toArray = function <T>(deque: Deque<T>): T[] {
        const arr: T[] = [];
        for (const ele of deque) {
            arr.push(ele);
        }
        return arr;
    }

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

suite('stack-test', () => {
   
    test('basic', () => {
        const s = new Stack<number>();
        assert.strictEqual(s.empty(), true);
        assert.strictEqual(s.size(), 0);
        
        s.push(0);
        assert.strictEqual(s.top(), 0);

        s.push(10);
        assert.strictEqual(s.top(), 10);

        s.push(11);
        assert.strictEqual(s.top(), 11);

        s.pop();
        assert.strictEqual(s.top(), 10);

        s.pop();
        assert.strictEqual(s.top(), 0);

        s.pop();
        assert.strictEqual(s.empty(), true);
        assert.strictEqual(s.size(), 0);
    });
});

suite('queue-test', () => {
   
    test('basic', () => {
        const q = new Queue<number>();
        assert.strictEqual(q.empty(), true);
        assert.strictEqual(q.size(), 0);
        
        q.pushBack(0);
        assert.strictEqual(q.back(), 0);
        assert.strictEqual(q.front(), 0);

        q.pushBack(10);
        assert.strictEqual(q.front(), 0);
        assert.strictEqual(q.back(), 10);

        q.pushBack(11);
        assert.strictEqual(q.front(), 0);
        assert.strictEqual(q.back(), 11);

        q.popFront();
        assert.strictEqual(q.front(), 10);
        assert.strictEqual(q.back(), 11);

        q.popFront();
        assert.strictEqual(q.front(), 11);
        assert.strictEqual(q.back(), 11);

        q.popFront();
        assert.strictEqual(q.empty(), true);
        assert.strictEqual(q.size(), 0);
    });
});