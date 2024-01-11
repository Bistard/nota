import { memoize } from "src/base/common/memoization";
import { CharCode } from "src/base/common/utilities/char";
import { Numbers } from "src/base/common/utilities/number";
import { DightInString } from "src/base/common/utilities/type";

/**
 * ANSI escape color codes for foreground color.
 */
export const enum ASNIForegroundColor {
    Reset = '\x1b[39m',
	Black = '\x1b[30m',
    Red = '\x1b[31m',
    Green = '\x1b[32m',
    Yellow = '\x1b[33m',
    Blue = '\x1b[34m',
    Magenta = '\x1b[35m',
    Cyan = '\x1b[36m',
    White = '\x1b[37m',
	LightGray = '\x1b[90m',
    LightRed = '\x1b[91m',
    LightGreen = '\x1b[92m',
    LightYellow = '\x1b[93m',
    LightBlue = '\x1b[94m',
    LightMagenta = '\x1b[95m',
    LightCyan = '\x1b[96m',
    LightWhite = '\x1b[97m',
}

/**
 * ANSI escape color codes for background color.
 */
export const enum ASNIBackgroundColor {
    Reset = '\x1b[49m',
	Black = '\x1b[40m',
    Red = '\x1b[41m',
    Green = '\x1b[42m',
    Yellow = '\x1b[43m',
    Blue = '\x1b[44m',
    Magenta = '\x1b[45m',
    Cyan = '\x1b[46m',
    White = '\x1b[47m',
    LightGray = '\x1b[100m',
    LightRed = '\x1b[101m',
    LightGreen = '\x1b[102m',
    LightYellow = '\x1b[103m',
    LightBlue = '\x1b[104m',
    LightMagenta = '\x1b[105m',
    LightCyan = '\x1b[106m',
    LightWhite = '\x1b[107m',
}

export type ANSIColor = ASNIForegroundColor | ASNIBackgroundColor;


export namespace TextColors {
	/**
	 * @description Sets the ANSI foreground and background colors for a given 
	 * string of text.
	 * 
	 * @param text - The text to be colored.
	 * @param fgColor - The ANSI foreground color code to set for the text.
	 * @param bgColor - The ANSI background color code to set for the text.
	 * @returns - The text string prefixed with ANSI color codes and suffixed 
	 * with a reset color code.
	 *
	 * @example
	 * const coloredText = setANSIColor("This is a colored message.", ASNIForegroundColor.Red, ASNIBackgroundColor.White);
	 * console.log(coloredText); // Prints the message in red color with white background in the console.
	 */
	export function setANSIColor(text: string, colors?: { fgColor?: ASNIForegroundColor, bgColor?: ASNIBackgroundColor }): string {
		return `${colors?.fgColor ?? ''}${colors?.bgColor ?? ''}${text}\x1b[0m`;
	}

	/**
	 * @description Sets the ANSI (RGB) foreground for a given string of text. 
	 * The color is only supported with morden command line.
	 * @param text The text to be colored.
	 * @returns The text string prefixed with ANSI color codes and suffixed with 
	 * a reset color code.
	 */
	export function setRGBColor(text: string, r: number, g: number, b: number): string {
		return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
	}
}

export type LowerHexLetter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';
export type UpperHexLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type HexDigit = LowerHexLetter | UpperHexLetter | DightInString;

/**
 * @type If the given string is in the form '#xxxxxx' where x stands for legal 
 * {@link HexDigit}.
 */
export type HexColor<T extends string> =
    T extends `#${HexDigit}${HexDigit}${HexDigit}${infer Rest1}`
        ? (Rest1 extends `` 
            ? T // three-digit hex color
            : (
                Rest1 extends `${HexDigit}${HexDigit}${HexDigit}`
                    ? T  // six-digit hex color
                    : never
            )
        )
        : never;

export class RGBA {

	// [field]

	/** Red: integer in [0-255] */
	public readonly r: number;

	/** Green: integer in [0-255] */
	public readonly g: number;

	/** Blue: integer in [0-255] */
	public readonly b: number;

	/** Alpha: float in [0-1] */
	public readonly a: number;

	public static readonly WHITE  = new RGBA(255, 255, 255, 1);
	public static readonly BLACK  = new RGBA(0, 0, 0, 1);
	public static readonly RED 	  = new RGBA(255, 0, 0, 1);
	public static readonly BLUE   = new RGBA(0, 0, 255, 1);
	public static readonly GREEN  = new RGBA(0, 255, 0, 1);
	public static readonly YELLOW = new RGBA(255, 255, 0, 1);

	// [constructor]

	constructor(r: number, g: number, b: number, a: number = 1) {
		this.r = Numbers.clamp(r, 0, 255) | 0;
		this.g = Numbers.clamp(g, 0, 255) | 0;
		this.b = Numbers.clamp(b, 0, 255) | 0;
		this.a = __roundFloat(Math.max(Math.min(1, a), 0), 3);
	}

	// [public methods]

	@memoize
	public toString(): string {
		return `rgb(${this.r},${this.g},${this.b},${this.a})`;
	}

    public static toString(color: RGBA): string {
        return `rgb(${color.r},${color.g},${color.b},${color.a})`;
    }

	public static equals(a: RGBA, b: RGBA): boolean {
		return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
	}

	/**
	 * @description Converts an Hex color text to a {@link RGBA}.
	 * @param str string (#RGB, #RGBA, #RRGGBB or #RRGGBBAA).
	 */
	public static parse(str: string): RGBA | null {
		const length = str.length;

		if (length === 0) {
			return null;
		}

		if (str.charCodeAt(0) !== CharCode.Hash) {
			return null;
		}

		try {
			// #RRGGBB format
			if (length === 7) {
				const r = 16 * __getHexDight(str.charCodeAt(1)) + __getHexDight(str.charCodeAt(2));
				const g = 16 * __getHexDight(str.charCodeAt(3)) + __getHexDight(str.charCodeAt(4));
				const b = 16 * __getHexDight(str.charCodeAt(5)) + __getHexDight(str.charCodeAt(6));
				return new RGBA(r, g, b, 1);
			}

			// #RRGGBBAA format
			if (length === 9) {
				const r = 16 * __getHexDight(str.charCodeAt(1)) + __getHexDight(str.charCodeAt(2));
				const g = 16 * __getHexDight(str.charCodeAt(3)) + __getHexDight(str.charCodeAt(4));
				const b = 16 * __getHexDight(str.charCodeAt(5)) + __getHexDight(str.charCodeAt(6));
				const a = 16 * __getHexDight(str.charCodeAt(7)) + __getHexDight(str.charCodeAt(8));
				return new RGBA(r, g, b, a / 255);
			}

			// #RGB format
			if (length === 4) {
				const r = __getHexDight(str.charCodeAt(1));
				const g = __getHexDight(str.charCodeAt(2));
				const b = __getHexDight(str.charCodeAt(3));
				return new RGBA(16 * r + r, 16 * g + g, 16 * b + b);
			}

			// #RGBA format
			if (length === 5) {
				const r = __getHexDight(str.charCodeAt(1));
				const g = __getHexDight(str.charCodeAt(2));
				const b = __getHexDight(str.charCodeAt(3));
				const a = __getHexDight(str.charCodeAt(4));
				return new RGBA(16 * r + r, 16 * g + g, 16 * b + b, (16 * a + a) / 255);
			}
		} catch {}

		return null;
	}
}

function __getHexDight(char: number): number {
	if (CharCode.Digit0 <= char && char <= CharCode.Digit9) {
		return char - CharCode.Digit0;
	}

	if (CharCode.a <= char && char <= CharCode.z) {
		return char - CharCode.a + 10;
	}

	if (CharCode.A <= char && char <= CharCode.Z) {
		return char - CharCode.A + 10;
	}

	throw new Error(`invalid hex digit ${char}.`);
}

function __roundFloat(number: number, decimalPoints: number): number {
	const decimal = Math.pow(10, decimalPoints);
	return Math.round(number * decimal) / decimal;
}