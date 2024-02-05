import * as CryptoJS from 'crypto-js';

/**
 * @description Hashes a given string into number.
 * @param s The given string.
 * @returns The number hash code. e.g. '1481881795', '7441251790', etc...
 */
export function hash(s: string): number {
    let h = 0;
    let i = s.length;
    while (i > 0) {
        h = (h << 5) - h + s.charCodeAt(--i) | 0;
    }
    return h; 
}

/**
 * @description Hashes a given string with MD5
 * @param input The given string.
 * @returns The hash code converted to a string
 */
export function generateMD5Hash(input: string): string {
    return CryptoJS.MD5(input).toString();
}
