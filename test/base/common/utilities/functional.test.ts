import * as assert from 'assert';
import { pipe } from 'src/base/common/utilities/functional';

suite('functional-test', () => {
    
    test('pipe', () => {
        const len = (s: string): number => s.length;
        const double = (n: number): number => n * 2;

        assert.strictEqual(pipe('aaa', len), 3);
        assert.strictEqual(pipe('aaa', len, double), 6);
        assert.strictEqual(pipe('aaa', len, double, double), 12);
        assert.strictEqual(pipe('aaa', len, double, double, double), 24);
        assert.strictEqual(pipe('', len, double, double, double), 0);
    });
});