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

    suite('totalDigit', function () {
        test('should return 1 for num = 0', function () {
            assert.strictEqual(Numbers.totalDigit(0), 1);
        });

        test('should return correct digit count for a positive integer', function () {
            assert.strictEqual(Numbers.totalDigit(123), 3);
        });

        test('should return correct digit count for a negative integer', function () {
            assert.strictEqual(Numbers.totalDigit(-123), 3);
        });

        test('should return 2 for num = 10', function () {
            assert.strictEqual(Numbers.totalDigit(10), 2);
        });

        test('should handle large numbers', function () {
            assert.strictEqual(Numbers.totalDigit(1234567890), 10);
        });
    });

    suite('getDigitAt', function () {
        test('should return -1 for negative n', function () {
            assert.strictEqual(Numbers.getDigitAt(123, -1), -1);
        });
        
        test('should return -1 for decimal n', function () {
            assert.strictEqual(Numbers.getDigitAt(123, 1.5), -1);
        });

        test('should return last digit for n = 0', function () {
            assert.strictEqual(Numbers.getDigitAt(123, 0), 3);
        });

        test('should return correct digit for a positive num and valid n', function () {
            assert.strictEqual(Numbers.getDigitAt(12345, 2), 3);
        });

        test('should return correct digit for a negative num and valid n', function () {
            assert.strictEqual(Numbers.getDigitAt(-12345, 2), 3);
        });

        test('should return 0 for n larger than the number of digits in num', function () {
            assert.strictEqual(Numbers.getDigitAt(123, 5), -1);
        });

        test('should handle n = 0 for num = 0', function () {
            assert.strictEqual(Numbers.getDigitAt(0, 0), 0);
        });

        test('should return correct digit for n within the range of powersOf10 array', function () {
            assert.strictEqual(Numbers.getDigitAt(123456, 4), 2);
        });

        test('should return correct digit for n beyond the range of powersOf10 array', function () {
            assert.strictEqual(Numbers.getDigitAt(987654321, 8), 9);
        });
    });

    suite('isValidIndex', function () {

        test('should return true for num within the range', function () {
            assert.strictEqual(Numbers.isValidIndex(5, 10), true);
        });

        test('should return false for num equal to the size', function () {
            assert.strictEqual(Numbers.isValidIndex(10, 10), false);
        });

        test('should return false for num greater than the size', function () {
            assert.strictEqual(Numbers.isValidIndex(11, 10), false);
        });

        test('should return true for num = 0 and size > 0', function () {
            assert.strictEqual(Numbers.isValidIndex(0, 1), true);
        });

        test('should return false for num < 0', function () {
            assert.strictEqual(Numbers.isValidIndex(-1, 10), false);
        });

        test('should return false for size <= 0', function () {
            assert.strictEqual(Numbers.isValidIndex(5, 0), false);
            assert.strictEqual(Numbers.isValidIndex(5, -1), false);
        });

        test('should return true for num = 0 and size = 1', function () {
            assert.strictEqual(Numbers.isValidIndex(0, 1), true);
        });

        test('should return false for num = 0 and size = 0', function () {
            assert.strictEqual(Numbers.isValidIndex(0, 0), false);
        });

    });
});

suite('bit-test', function () {
    suite('at', () => {
        test('Should select bit at position 0', () => {
            assert.strictEqual(Bit.at(5, 0), 1);
        });

        test('Should select bit at position 2', () => {
            assert.strictEqual(Bit.at(5, 2), 4);
        });

        test('Should return 0 for non-set bit positions', () => {
            assert.strictEqual(Bit.at(5, 1), 0);
        });

        test('Should handle negative numbers correctly', () => {
            assert.strictEqual(Bit.at(-1, 0), 1);
        });

        test('cases when the index is over 32', () => {
            assert.strictEqual(Bit.at(5, 32), 1); // 32 % 32 = 0 => 1
            assert.strictEqual(Bit.at(5, 33), 0); // 33 % 32 = 1 => 0
            assert.strictEqual(Bit.at(5, 34), 4); // 33 % 32 = 1 => 4
        });
    });

    suite('lowBit', () => {
        test('Should return lowest significant bit of positive number', () => {
            assert.strictEqual(Bit.lowBit(10), 2); // 10 in binary is 1010, lowest significant bit is 0010 which is 2
        });

        test('Should return the number itself if it is a power of 2', () => {
            assert.strictEqual(Bit.lowBit(8), 8); // 8 in binary is 1000, which is already the lowest significant bit
        });

        test('Should return 1 for odd numbers', () => {
            assert.strictEqual(Bit.lowBit(7), 1); // 7 in binary is 0111, lowest significant bit is 0001 which is 1
        });

        test('Should handle zero correctly', () => {
            assert.strictEqual(Bit.lowBit(0), 0); // 0 in binary has no set bits, so should return 0
        });

        test('Should handle negative numbers correctly', () => {
            assert.strictEqual(Bit.lowBit(-10), 2); // -10 in two's complement is ...11110110, lowest significant bit is 0010 which is 2
        });
    });

    suite('bitCount32', () => {
        test('Should count bits correctly for zero', () => {
            assert.strictEqual(Bit.bitCount32(0), 0);
        });

        test('Should count bits correctly for positive numbers', () => {
            assert.strictEqual(Bit.bitCount32(5), 2); // 5 in binary is 101, so two 1's
        });

        test('Should count bits correctly for negative numbers', () => {
            assert.strictEqual(Bit.bitCount32(-1), 32); // -1 in 32-bit binary is all 1's, so 32 bits
        });

        test('Should count bits correctly for the maximum 32-bit integer', () => {
            assert.strictEqual(Bit.bitCount32(0xFFFFFFFF), 32); // Max 32-bit int is all 1's in binary
        });

        test('Should count bits correctly for a random positive number', () => {
            assert.strictEqual(Bit.bitCount32(0x12345678), 13); // 0x12345678 has 13 1's in binary
        });
    });

    suite('bitCount', () => {

        test('Should count bits correctly for zero', () => {
            assert.strictEqual(Bit.bitCount(0), 0);
        });

        test('Should count bits correctly for positive numbers within 32-bit range', () => {
            assert.strictEqual(Bit.bitCount(5), 2); // 5 in binary is 101, so two 1's
        });

        test('Should count bits correctly for negative numbers within 32-bit range', () => {
            assert.strictEqual(Bit.bitCount(-1), 32); // -1 in 32-bit binary is all 1's, so 32 bits
        });

        test('Should count bits correctly for numbers beyond 32-bit range', () => {
            const largeNumber = Math.pow(2, 34) + 1; // This is 100...001 in binary, so two 1's
            assert.strictEqual(Bit.bitCount(largeNumber), 2);
        });

        test('Should work correctly with floating point numbers', () => {
            assert.strictEqual(Bit.bitCount(5.5), 2); // 5 in binary is 101, so two 1's, decimal part ignored
        });
    });

    suite('toBinary', () => {
        test('Should convert positive number to binary string', () => {
            assert.strictEqual(Bit.toBinary(10), '1010');
        });

        test('Should convert zero to binary string', () => {
            assert.strictEqual(Bit.toBinary(0), '0');
        });

        test('Should handle negative numbers by converting to unsigned 32-bit binary string', () => {
            assert.strictEqual(Bit.toBinary(-1), '11111111111111111111111111111111');
        });

        test('Should convert small positive number to binary string', () => {
            assert.strictEqual(Bit.toBinary(3), '11');
        });

        test('Should convert large positive number to binary string', () => {
            assert.strictEqual(Bit.toBinary(1023), '1111111111');
        });
    });
});
