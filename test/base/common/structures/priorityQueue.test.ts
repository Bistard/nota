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
        assert.strictEqual(pq.empty(), false);
        assert.strictEqual(pq.dequeue(), 5);
        assert.strictEqual(pq.dequeue(), 3);
        assert.strictEqual(pq.empty(), true);
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
        assert.strictEqual(pq.empty(), false);
        assert.strictEqual(pq.dequeue(), "apple");
        assert.strictEqual(pq.dequeue(), "pear");
        assert.strictEqual(pq.empty(), true);
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

    suite('more', () => {
        test('enqueue should add elements to the queue', () => {
            const pq = new PriorityQueue<number>((a, b) => a - b);
            pq.enqueue(5);
            pq.enqueue(3);
            pq.enqueue(7);
            assert.strictEqual(pq.size(), 3);
            assert.strictEqual(pq.peek(), 3);
        });
    
        test('dequeue should remove and return the highest-priority element', () => {
            const pq = new PriorityQueue<number>((a, b) => a - b);
            pq.enqueue(5);
            pq.enqueue(3);
            pq.enqueue(7);
            assert.strictEqual(pq.dequeue(), 3);
            assert.strictEqual(pq.dequeue(), 5);
            assert.strictEqual(pq.dequeue(), 7);
            assert.strictEqual(pq.dequeue(), undefined);
        });
    
        test('remove should delete a specified element from the queue', () => {
            const pq = new PriorityQueue<number>((a, b) => a - b);
            pq.enqueue(5);
            pq.enqueue(3);
            pq.enqueue(7);
            pq.remove(3);
            assert.strictEqual(pq.size(), 2);
            assert.strictEqual(pq.peek(), 5);
        });
    
        test('remove should do nothing if element is not found', () => {
            const pq = new PriorityQueue<number>((a, b) => a - b);
            pq.enqueue(5);
            pq.enqueue(7);
            pq.remove(3);
            assert.strictEqual(pq.size(), 2);
        });
    
        test('peek should return the highest-priority element without removing it', () => {
            const pq = new PriorityQueue<number>((a, b) => a - b);
            pq.enqueue(5);
            pq.enqueue(3);
            assert.strictEqual(pq.peek(), 3);
            assert.strictEqual(pq.size(), 2);
        });
    
        test('size should return the correct number of elements in the queue', () => {
            const pq = new PriorityQueue<number>((a, b) => a - b);
            assert.strictEqual(pq.size(), 0);
            pq.enqueue(10);
            assert.strictEqual(pq.size(), 1);
            pq.enqueue(20);
            assert.strictEqual(pq.size(), 2);
        });
    
        test('empty should return true if queue is empty, otherwise false', () => {
            const pq = new PriorityQueue<number>((a, b) => a - b);
            assert.strictEqual(pq.empty(), true);
            pq.enqueue(1);
            assert.strictEqual(pq.empty(), false);
            pq.dequeue();
            assert.strictEqual(pq.empty(), true);
        });
    
        test('clear should remove all elements from the queue', () => {
            const pq = new PriorityQueue<number>((a, b) => a - b);
            pq.enqueue(5);
            pq.enqueue(3);
            pq.clear();
            assert.strictEqual(pq.size(), 0);
            assert.strictEqual(pq.empty(), true);
        });
    
        test('dispose should clear the queue', () => {
            const pq = new PriorityQueue<number>((a, b) => a - b);
            pq.enqueue(5);
            pq.dispose();
            assert.strictEqual(pq.size(), 0);
            assert.strictEqual(pq.empty(), true);
        });
    
        test('iterator should yield elements in priority order', () => {
            const pq = new PriorityQueue<number>((a, b) => a - b);
            pq.enqueue(5);
            pq.enqueue(1);
            pq.enqueue(3);
            const iterated = [...pq];
            assert.deepStrictEqual(iterated, [1, 3, 5]);
        });
    });
});