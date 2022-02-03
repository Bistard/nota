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
		return range.end - range.start <= 0;
	}

	/**
	 * @description Shifts the range by an amount of distance.
	 * @param range The range.
	 * @param distance The amount of distance.
	 */
	export function shift(range: IRange, distance: number): IRange {
		return {
			start: range.start + distance,
			end: range.end + distance
		};
	}

	/**
	 * Returns the relative complement of `A` with respect to `B`, is the set of
	 * elements in `B` that are not in `A`.
	 * @param A The range A.
	 * @param B The range B.
	 * @returns An array of size 2, the first part is the smaller elements not 
	 * in A, the second part is the larger elements not in A. If either part is 
	 * empty, a {@link Range.EMPTY} will be returned.
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

		!Range.empty(before) ? complement.push(before) : complement.push(Range.EMPTY);
		!Range.empty(after) ? complement.push(after) : complement.push(Range.EMPTY);
		
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

	/**
	 * @description Returns a mutiple intersections of a {@link IRange} with all 
	 * other {@link IRangeList}s, each intersection is also a {@link IRangeList} 
	 * with the same size.
	 * @param range The range.
	 * @param rangeLists The array of range list.
	 * @returns The muti-intersections.
	 */
	export function listIntersection(range: IRange, rangeLists: IRangeList[]): IRangeList[] {
		const intersects: IRangeList[] = [];

		for (let list of rangeLists) {
			const intersect = Range.intersection(range, list.range);

			if (Range.empty(intersect)) {
				continue;
			}

			intersects.push({
				range: intersect,
				size: list.size
			});
		}

		return intersects;
	}

	/**
	 * @description Merging an array of {@link IRangeList} that has the same size.
	 * @param lists An array of IRangeList.
	 * @returns The flattened version.
	 */
	export function flatten(lists: IRangeList[]): IRangeList[] {
		const flatten: IRangeList[] = [];
		let prevList: IRangeList | null = null;

		for (let list of lists) {
			const start = list.range.start;
			const end = list.range.end;
			const size = list.size;

			if (prevList && size === prevList.size) {
				prevList.range.end = end;
				continue;
			}

			prevList = { range: { start, end }, size };
			flatten.push(prevList);
		}

		return flatten;
	}

	/**
	 * @description Concatenates a collection of {@link IRangeList} as a single 
	 * array.
	 * @param lists A collection of IRangeList.
	 */
	export function concatenate(...lists: IRangeList[][]): IRangeList[] {
		return Range.flatten(lists.reduce((x, y) => x.concat(y), []));
	}
}

/**
 * @class A tool that can represent a range of items (eg. rows or columns) with
 * potential different sizes (eg. height or width). Provides functionalities to
 * splice items (insert or delete) and find the item by either index or actual 
 * size.
 * 
 * For instance, {@link RangeTable} can represent a table such as items with 
 * index 0-50 has size 20, items with index 51-100 has size 22, items with index 
 * 101-200 has size 20 again.
 * 
 * @example See more examples in `range.test.ts`.
 * 
 * @note If all the items shares the same size, {@link RangeTable} is no needed.
 * A {@link IRangeList} will do.
 */
export class RangeTable {

	private _list: IRangeList[];
	private _size: number;

	constructor() {
		this._list = [];
		this._size = 0;
	}

	/**
	 * @description Returns the total number of items in {@link RangeTable}.
	 */
	public count(): number {
		const len = this._list.length;
		if (len === 0) {
			return 0;
		}

		return this._list[len - 1]!.range.end;
	}

	/**
	 * @description Returns the sum of the sizes of all items in {@link RangeTable}.
	 */
	public size(): number {
		return this._size;
	}

	/**
     * @description Removes items from an {@link RangeTable} and, if necessary, 
	 * inserts new items in their place.
     * @param start The zero-based location in the {@link RangeTable} from which 
	 * to start removing items.
     * @param deleteCount The number of items to remove.
     * @param items Elements to insert into the {@link RangeTable} in place of 
	 * the deleted items.
     */
	public splice<T extends IMeasureable>(index: number, deleteCount: number, items: T[] = []): void {

		// selects all the items before the splice.
		const before: IRangeList[] = Range.listIntersection({start: 0, end: index}, this._list);

		// selects all the items after the splice.
		const after: IRangeList[] = Range.listIntersection({start: index + deleteCount, end: Number.POSITIVE_INFINITY}, this._list);
		after.map(list => { list.range = Range.shift(list.range, items.length - deleteCount) });

		// generates a collection of items in IRangeList[] form.
		const insertion: IRangeList[] = items.map((item, i) => ({
			range: {start: index + i, end: index + i + 1},
			size: item.size
		}));

		// generates a single total range table.
		this._list = Range.concatenate(before, insertion, after);

		// update the size
		this._size = this._list.reduce((x, y) => x + (y.size * (y.range.end - y.range.start)), 0);
	}

	/**
	 * @description Returns the index of the item at the given position.
	 * @param position The position of the item.
	 * @returns The index of the item.
	 */
	public indexAt(position: number): number {
		if (position < 0) {
			return -1;
		}
		
		let index = 0;
		let size = 0;

		for (let list of this._list) {
			const count = list.range.end - list.range.start;
			const nextSize = size + (count * list.size);

			if (position < nextSize) {
				return index + Math.floor((position - size) / list.size);
			}

			index += count;
			size = nextSize;
		}

		return index;
	}

	/**
	 * @description Returns the start position of the item at the given index.
	 * @param index The index of the item.
	 * @returns The start position of the item.
	 */
	public positionAt(index: number): number {
		if (index < 0) {
			return -1;
		}
		
		let position = 0;
		let count = 0;

		for (let list of this._list) {
			const listCount = list.range.end - list.range.start;
			const nextCount = count + listCount;

			if (index < nextCount) {
				return position + ((index - count) * list.size);
			}

			position += listCount * list.size;
			count = nextCount;
		}

		return -1;
	}
}