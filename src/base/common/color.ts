import { DightInString } from "src/base/common/util/type";

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

function roundFloat(number: number, decimalPoints: number): number {
	const decimal = Math.pow(10, decimalPoints);
	return Math.round(number * decimal) / decimal;
}

export class RGBA {

	// Red: integer in [0-255]
	readonly r: number;

	// Green: integer in [0-255]
	readonly g: number;

	// Blue: integer in [0-255]
	readonly b: number;

	// Alpha: float in [0-1]
	readonly a: number;

	constructor(r: number, g: number, b: number, a: number = 1) {
		this.r = Math.min(255, Math.max(0, r)) | 0;
		this.g = Math.min(255, Math.max(0, g)) | 0;
		this.b = Math.min(255, Math.max(0, b)) | 0;
		this.a = roundFloat(Math.max(Math.min(1, a), 0), 3);
	}

	private _string?: string;

    public toString(): string {
		if (this._string) {
			return this._string;
		}
        this._string = 'rgb(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')';
		return this._string;
    }

	public static equals(a: RGBA, b: RGBA): boolean {
		return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
	}

}

export const WHITE: RGBA = new RGBA(255, 255, 255, 1);
export const BLACK: RGBA = new RGBA(0, 0, 0, 1);
export const RED: RGBA = new RGBA(255, 0, 0, 1);
export const BLUE: RGBA = new RGBA(0, 0, 255, 1);
export const GREEN: RGBA = new RGBA(0, 255, 0, 1);
export const YELLOW: RGBA = new RGBA(255, 255, 0, 1);

export const LIGHT_RED: RGBA = new RGBA(255, 211, 211, 1);

/**
 * // TODO
 */
export class Color {

}