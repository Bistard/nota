import * as assert from 'assert';
import { Deque } from "src/base/common/structures/deque";

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