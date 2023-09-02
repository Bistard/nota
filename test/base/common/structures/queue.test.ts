import * as assert from 'assert';
import { Queue } from 'src/base/common/structures/queue';

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