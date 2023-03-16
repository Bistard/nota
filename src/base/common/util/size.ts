
export interface IMeasureable {
	size: number;
}

export interface IDimension {
    readonly width: number;
    readonly height: number;
}

export interface IDomPosition extends IDimension {
	readonly top: number;
	readonly left: number;
}

export class Dimension implements IDimension {

	static readonly None = new Dimension(0, 0);

	constructor(
		public width: number,
		public height: number,
	) { }

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