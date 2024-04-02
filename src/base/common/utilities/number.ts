
/**
 * @description A series of helper functions that relates to numbers.
 */
export namespace Numbers {
    
    /**
     * @description Check if the given number is a decimal (12.0 is an integer).
     * @param num The given number.
     */
    export function isDecimal(num: number): boolean {
        return !Number.isInteger(num);
    }

    /**
     * @description Counts the total number of digits of the given number.
     */
    export function totalDigit(num: number): number {
        num = Math.abs(num);
        let digits = 0;
        do {
            num = Math.floor(num / 10);
            ++digits;
        } while (num > 0);
        return digits;
    }

    /**
     * @description Extracts the nth digit from a given number, counting from 
     * the right (0-based index).
     * 
     * @param num The number from which to extract the digit.
     * @param n The 0-based position of the digit from the right.
     * @returns The nth digit of `num`. Returns -1 if:
     *      - `n` is negative or 
     *      - if `n`is >= the number of digits in `num`.
     * 
     * @note The function treats the number as an absolute value and ignores the 
     *       sign.
     */
    export function getDigitAt(num: number, n: number): number {
        if (n < 0 || !Number.isInteger(n) || n >= totalDigit(num)) {
            return -1;
        }

        if (n === 0) {
            return Math.abs(num) % 10;
        }

        // perf (extend as needed)
        const powersOf10 = [1, 10, 100, 1000, 10000];
        const divisor = n < powersOf10.length ? powersOf10[n]! : Math.pow(10, n);
    
        return Math.floor(Math.abs(num) / divisor) % 10;
    }

    /**
     * @description Restricts the given number to a given range.
     * @param num The given number.
     * @param min The minimum boundary.
     * @param max The maximum boundary.
     */
    export function clamp(num: number, min: number, max: number): number {
        if (num <= min) {
            return min;
        }
        if (num >= max) {
            return max;
        }
        return num;
    }

    /**
     * @description Checks if a number is within a specified range.
     * @param num The number to check.
     * @param start Start of the range.
     * @param end End of the range.
     * @param includeStart If `true`, includes `start` in the range.
     * @param includeEnd If `true`, includes `end` in the range.
     */
    export function within(num: number, start: number, end: number, includeStart: boolean, includeEnd: boolean): boolean {
        const startCond = includeStart ? num >= start : num > start;
        const endCond   = includeEnd   ? num <= end   : num < end;
        return startCond && endCond;
    }

    /**
     * @description Checks if a given number is within a specified range. The 
     * function verifies if:
     *      - the number is >= to 0 and 
     *      - < the specified size.
     * @param num The number to check.
     * @param size The upper bound of the range (exclusive).
     * 
     * @example isValidIndex => (0 <= num < size)
     * @note Usefully when checking a given index (0-based) is within a given 
     * size.
     * @note If you want more flexibility, use {@link Numbers.within}.
     */
    export function isValidIndex(num: number, size: number): boolean {
        return 0 <= num && num < size;
    }
}

/**
 * @description A series of helper functions that relates to bit operations.
 */
export namespace Bit {

    /**
     * @description Selects the bit at the position i of x. 
     * @example 
     * at(5, 0) => 1; 
     * at(5, 2) => 4;
     */
    export function at(x: number, i: number): number {
        return x & (1 << i);
    }

    /**
     * @description Returns the lowest significant bit of the given number.
     */
    export function lowBit(x: number): number {
        return x & (x ^ (x - 1));
    }

    /**
     * @description Counts the number of bits (1's) of the given number (only
     * works for 32-bit integer).
     * @note More general solution go see {@link Bit.bitCount}.
     */
    export function bitCount32(x: number): number {
        x = x - ((x >> 1) & 0x55555555);
        x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
        return ((x + (x >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
    }

    /**
     * @description Counts the number of bits (1's) of the given number.
     */
    export function bitCount(x: number): number {
        let bits = 0;
        while (x) {
          bits += bitCount32(x | 0);
          x /= 0x100000000;
        }
        return bits;
    }

    /**
     * @description Convert the given number into a binary string form.
     */
    export function toBinary(x: number): string {
        return (x >>> 0).toString(2);
    }
}