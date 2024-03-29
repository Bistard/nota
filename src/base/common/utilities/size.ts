
export interface IMeasureable {
	size: number;
}

export interface IDimension {
    readonly width: number;
    readonly height: number;
}

export interface IPosition {
	readonly top: number;
	readonly left: number;
}

export interface IDomBox extends IDimension, IPosition {
	// empty
}

export class Dimension implements IDimension {

	public static readonly None = new Dimension(0, 0);

	constructor(
		public width: number,
		public height: number,
	) { }

	public static create(other: IDimension): Dimension {
		return new Dimension(other.width, other.height);
	}

	public with(width: number = this.width, height: number = this.height): Dimension {
		if (width !== this.width || height !== this.height) {
			return new Dimension(width, height);
		} else {
			return this;
		}
	}

	public equals(a: Dimension | undefined, b: Dimension | undefined): boolean {
		if (a === b) {
			return true;
		}
		if (!a || !b) {
			return false;
		}
		return a.width === b.width && a.height === b.height;
	}
}