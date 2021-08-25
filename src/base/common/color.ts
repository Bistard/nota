
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

    public toString(): string {
        return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')';
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