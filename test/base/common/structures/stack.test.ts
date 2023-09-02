import * as assert from 'assert';
import { Stack } from 'src/base/common/structures/stack';

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