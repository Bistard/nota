import { IMeasureable } from "src/base/common/size";

export interface ISpliceable<T> {
	splice(index: number, deleteCount: number, itemsToInsert: T[]): void;
}

export interface IRange {
	start: number,
	end: number
}

export interface IRangeList {
	/**
	 * The range of the list.
	 */
	range: IRange,
	
	/**
	 * The size of each item in the range.
	 */
	size: number
}

/**
 * @description Provides functions to handle the logic of ranges.
 */
export namespace Range {

	export const EMPTY: IRange = {start: 0, end: 0};

	/**
	 * @description Determines if the given range is empty.
	 * @param range The given range.
	 */
	export function empty(range: IRange): boolean {
		return range.end - range.start === 0;
	}

	/**
	 * Returns the relative complement of `A` with respect to `B`, is the set of
	 * elements in `B` that are not in `A`.
	 * @param A The range A.
	 * @param B The range B.
	 * @returns An array of size 2, the first part is the elements .
	 */
	export function relativeComplement(A: IRange, B: IRange): [IRange, IRange] {
		const complement: IRange[] = [];
		
		const before: IRange = {
			start: B.start,
			end: Math.min(B.end, A.start)
		};
		const after: IRange = {
			start: Math.max(B.start, A.end),
			end: B.end
		};

		Range.empty(before) ? complement.push(before) : complement.push(Range.EMPTY);
		Range.empty(after) ? complement.push(after) : complement.push(Range.EMPTY);
		
		return complement as [IRange, IRange];
	}

	/**
	 * Returns the intersection between two ranges.
	 * @param A One of the range.
	 * @param B One of the range.
	 * @returns Returns the intersection, { start: 0, end: 0 } if the intersection 
	 * is empty.
	 */
	export function intersection(A: IRange, B: IRange): IRange {
		
		if (A.start > B.end || B.start > A.end) {
			return Range.EMPTY;
		}

		const start = Math.max(A.start, B.start);
		const end = Math.min(A.end, B.end);
		if (end - start === 0) {
			return Range.EMPTY;
		}

		return { start: start, end: end };
	}
}

/**
 * @class A tool that can represent a range of items (eg. rows or columns) with
 * potential different sizes (eg. height or width). Provides functionalities to
 * splice items (insert or delete) and find the item by either index or actual 
 * size.
 * 
 * @example See more examples in `range.test.ts`.
 */
export class RangeTable<T extends IMeasureable> implements ISpliceable<T> {

	private _list: IRangeList[];
	private _size: number;

	constructor() {
		this._list = [];
		this._size = 0;
	}

	public count(): number {
		return -1;
	}

	public size(): number {
		return -1;
	}

	public splice(index: number, deleteCount: number, items: T[] = []): void {

	}

	public indextAt(position: number): number {
		return -1;
	}

	public positionAt(index: number): number {
		return -1;
	}
}