import * as assert from 'assert';
import { PriorityQueue } from 'src/base/common/structures/priorityQueue';

suite('priority-queue-test', () => {
    
    test('basic', () => {
        const pq = new PriorityQueue<number>((a, b) => b - a);
        
        pq.enqueue(5);
        pq.enqueue(3);
        pq.enqueue(7);
        
        assert.strictEqual(pq.size(), 3);
        assert.strictEqual(pq.peek(), 7);
        assert.strictEqual(pq.dequeue(), 7);
        assert.strictEqual(pq.peek(), 5);
        assert.strictEqual(pq.isEmpty(), false);
        assert.strictEqual(pq.dequeue(), 5);
        assert.strictEqual(pq.dequeue(), 3);
        assert.strictEqual(pq.isEmpty(), true);
    });

    test('remove - primitive 1', () => {
        const queue = new PriorityQueue<number>((a, b) => a - b);
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(2);
        queue.enqueue(3);
        assert.equal(queue.size(), 4);
        
        queue.remove(2);
        assert.equal(queue.size(), 3);

        queue.remove(2);
        assert.equal(queue.size(), 2);
        
        assert.strictEqual(queue.dequeue(), 1);
        assert.strictEqual(queue.dequeue(), 3);

        assert.equal(queue.size(), 0);
    });
    
    test('remove - primitive 2', () => {
        const queue = new PriorityQueue<number>((a, b) => a - b);
        queue.enqueue(1);
        queue.enqueue(1);
        queue.enqueue(1);
        queue.enqueue(1);
        assert.equal(queue.size(), 4);
        
        queue.remove(1);
        assert.equal(queue.size(), 3);

        queue.remove(1);
        assert.equal(queue.size(), 2);

        queue.remove(1);
        assert.equal(queue.size(), 1);

        queue.remove(1);
        assert.equal(queue.size(), 0);
    });

    test('remove - reference', () => {
        const queue = new PriorityQueue<{ num: number }>((a, b) => a.num - b.num);
        
        const obj1 = { num: 1 };
        const obj2 = { num: 2 };
        const obj3 = { num: 3 };
        const obj4 = { num: 4 };
        
        queue.enqueue(obj1);
        queue.enqueue(obj2);
        queue.enqueue(obj3);
        queue.enqueue(obj4);
        
        assert.equal(queue.size(), 4);
        
        queue.remove(obj1);
        assert.equal(queue.size(), 3);

        queue.remove(obj2);
        assert.equal(queue.size(), 2);

        queue.remove(obj3);
        assert.equal(queue.size(), 1);

        queue.remove(obj4);
        assert.equal(queue.size(), 0);
    });
    
    test('remove - reference 2', () => {
        const queue = new PriorityQueue<{ num: number }>((a, b) => a.num - b.num);
        
        const obj1 = { num: 1 };
        const obj2 = { num: 1 };
        const obj3 = { num: 1 };
        const obj4 = { num: 1 };
        
        queue.enqueue(obj1);
        queue.enqueue(obj2);
        queue.enqueue(obj3);
        queue.enqueue(obj4);
        
        assert.equal(queue.size(), 4);
        
        queue.remove(obj1);
        assert.equal(queue.size(), 3);

        queue.remove(obj2);
        assert.equal(queue.size(), 2);

        queue.remove(obj3);
        assert.equal(queue.size(), 1);

        queue.remove(obj4);
        assert.equal(queue.size(), 0);
    });

    test('customized compare', () => {
        const pq = new PriorityQueue<string>((a, b) => b.length - a.length);
        
        pq.enqueue("apple");
        pq.enqueue("banana");
        pq.enqueue("pear");

        assert.strictEqual(pq.size(), 3);
        assert.strictEqual(pq.peek(), "banana");
        assert.strictEqual(pq.dequeue(), "banana");
        assert.strictEqual(pq.peek(), "apple");
        assert.strictEqual(pq.isEmpty(), false);
        assert.strictEqual(pq.dequeue(), "apple");
        assert.strictEqual(pq.dequeue(), "pear");
        assert.strictEqual(pq.isEmpty(), true);
    });

    test('iterator', () => {
        const pq = new PriorityQueue<number>((a, b) => b - a);
        
        pq.enqueue(1);
        pq.enqueue(2);
        pq.enqueue(3);

        const values = Array.from(pq);
        assert.deepStrictEqual(values, [3, 2, 1]);
    });

    test('edge cases', () => {
        const pq = new PriorityQueue<number>((a, b) => b - a);
        
        assert.strictEqual(pq.peek(), undefined);
        assert.strictEqual(pq.dequeue(), undefined);

        pq.enqueue(1);
        assert.strictEqual(pq.peek(), 1);
        assert.strictEqual(pq.dequeue(), 1);
        
        assert.strictEqual(pq.peek(), undefined);
        assert.strictEqual(pq.dequeue(), undefined);
    });
});