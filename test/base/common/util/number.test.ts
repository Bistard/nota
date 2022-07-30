import * as assert from 'assert';
import { Numbers } from 'src/base/common/util/number';

suite('number-test', () => {

    test('isDecimal', () => {
        assert.strictEqual(Numbers.isDecimal(0), false);
        assert.strictEqual(Numbers.isDecimal(0.0), false);
        assert.strictEqual(Numbers.isDecimal(0.1), true);
        assert.strictEqual(Numbers.isDecimal(0.00000000001), true);
        assert.strictEqual(Numbers.isDecimal(-0.1), true);
        assert.strictEqual(Numbers.isDecimal(-0.00000000001), true);
        assert.strictEqual(Numbers.isDecimal(10), false);
        assert.strictEqual(Numbers.isDecimal(10.0), false);
        assert.strictEqual(Numbers.isDecimal(10.1), true);
        assert.strictEqual(Numbers.isDecimal(10.0000000001), true);
        assert.strictEqual(Numbers.isDecimal(-10), false);
        assert.strictEqual(Numbers.isDecimal(-10.0), false);
        assert.strictEqual(Numbers.isDecimal(-10.1), true);
        assert.strictEqual(Numbers.isDecimal(-10.0000000001), true);
        assert.strictEqual(Numbers.isDecimal(1), false);
        assert.strictEqual(Numbers.isDecimal(12.0), false);
        assert.strictEqual(Numbers.isDecimal(20.0), false);
        assert.strictEqual(Numbers.isDecimal(-1), false);
        assert.strictEqual(Numbers.isDecimal(-12.0), false);
        assert.strictEqual(Numbers.isDecimal(-20.0), false);
    });

});