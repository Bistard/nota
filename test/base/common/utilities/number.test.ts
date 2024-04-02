import * as assert from 'assert';
import { Bit, Numbers } from 'src/base/common/utilities/number';

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

    test('clamp', function () {
        assert.strictEqual(Numbers.clamp(5, 1, 10), 5);
        assert.strictEqual(Numbers.clamp(0, 1, 10), 1);
        assert.strictEqual(Numbers.clamp(11, 1, 10), 10);
    });

    suite('within', function () {
        test('should return true if number is within the range including boundaries', function () {
            assert.ok(Numbers.within(5, 1, 10, true, true));
        });

        test('should return false if number is outside the range', function () {
            assert.ok(!Numbers.within(0, 1, 10, true, true));
            assert.ok(!Numbers.within(11, 1, 10, true, true));
        });

        test('should respect inclusive/exclusive boundaries', function () {
            assert.ok(!Numbers.within(1, 1, 10, false, true));
            assert.ok(!Numbers.within(10, 1, 10, true, false));
        });
    });

    suite('totalDigit', function() {
        test('should return 1 for num = 0', function() {
            assert.strictEqual(Numbers.totalDigit(0), 1);
        });
    
        test('should return correct digit count for a positive integer', function() {
            assert.strictEqual(Numbers.totalDigit(123), 3);
        });
    
        test('should return correct digit count for a negative integer', function() {
            assert.strictEqual(Numbers.totalDigit(-123), 3);
        });
    
        test('should return 2 for num = 10', function() {
            assert.strictEqual(Numbers.totalDigit(10), 2);
        });
    
        test('should handle large numbers', function() {
            assert.strictEqual(Numbers.totalDigit(1234567890), 10);
        });
    });

    suite('getDigitAt', function() {
        test('should return -1 for negative n', function() {
            assert.strictEqual(Numbers.getDigitAt(123, -1), -1);
        });
    
        test('should return last digit for n = 0', function() {
            assert.strictEqual(Numbers.getDigitAt(123, 0), 3);
        });
    
        test('should return correct digit for a positive num and valid n', function() {
            assert.strictEqual(Numbers.getDigitAt(12345, 2), 3);
        });
    
        test('should return correct digit for a negative num and valid n', function() {
            assert.strictEqual(Numbers.getDigitAt(-12345, 2), 3);
        });
    
        test('should return 0 for n larger than the number of digits in num', function() {
            assert.strictEqual(Numbers.getDigitAt(123, 5), -1);
        });
    
        test('should handle n = 0 for num = 0', function() {
            assert.strictEqual(Numbers.getDigitAt(0, 0), 0);
        });
    
        test('should return correct digit for n within the range of powersOf10 array', function() {
            assert.strictEqual(Numbers.getDigitAt(123456, 4), 2);
        });
    
        test('should return correct digit for n beyond the range of powersOf10 array', function() {
            assert.strictEqual(Numbers.getDigitAt(987654321, 8), 9);
        });
    });

    suite('isValidIndex', function() {

        test('should return true for num within the range', function() {
            assert.strictEqual(Numbers.isValidIndex(5, 10), true);
        });
    
        test('should return false for num equal to the size', function() {
            assert.strictEqual(Numbers.isValidIndex(10, 10), false);
        });
    
        test('should return false for num greater than the size', function() {
            assert.strictEqual(Numbers.isValidIndex(11, 10), false);
        });
    
        test('should return true for num = 0 and size > 0', function() {
            assert.strictEqual(Numbers.isValidIndex(0, 1), true);
        });
    
        test('should return false for num < 0', function() {
            assert.strictEqual(Numbers.isValidIndex(-1, 10), false);
        });
    
        test('should return false for size <= 0', function() {
            assert.strictEqual(Numbers.isValidIndex(5, 0), false);
            assert.strictEqual(Numbers.isValidIndex(5, -1), false);
        });
    
        test('should return true for num = 0 and size = 1', function() {
            assert.strictEqual(Numbers.isValidIndex(0, 1), true);
        });
    
        test('should return false for num = 0 and size = 0', function() {
            assert.strictEqual(Numbers.isValidIndex(0, 0), false);
        });
    
    });
});





