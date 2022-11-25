import { IIterable } from "src/base/common/util/iterable";
import { CompareFn } from "src/base/common/util/type";

/**
 * @namespace Array A series of helper functions that relates to array.
 */
export namespace Arrays {

    /**
     * @description Returns a new elements of an array that removed all the 
     * falsy elements.
     * @param array The given array.
     */
    export function coalesce<T>(array: ReadonlyArray<T | undefined | null>): T[] {
        return <T[]>array.filter(e => !!e);
    }

    /**
     * @description Try to removes the first given item from the given array (will 
     * modify the original array).
     * @param array The given array.
     * @param item The item to be removed.
     * @returns Returns the same array.
     */
    export function remove<T>(array: T[], item: T): T[] {
        const find = array.indexOf(item);
        if (find !== -1) {
            array.splice(find, 1);
        }
        return array;
    }

    /**
     * @description Insert the given item to the sorted array in a sort way. The
     * method mutates the original array and returns a reference to the same one.
     * @param sorted The sorted array.
     * @param insert The given item.
     * @param cmp The compare function. 
     *                  true -> `a` before `b`
     *                  false -> `a` after `b`
     */
    export function insert<T>(sorted: T[], insert: T, cmp: (a: T, b: T) => boolean = (a, b) => a < b): T[] {

        if (sorted.length === 0) {
            sorted.push(insert);
            return sorted;
        }

        let i = 0;
        for (i = 0; i < sorted.length; i++) {
            const item = sorted[i]!;

            if (cmp(insert, item) === true) {
                sorted.splice(i, 0, insert);
                return sorted;
            }
        }
        
        sorted.splice(i, 0, insert);
        return sorted;
    }

    /**
     * @description Determines if the content of the given two arrays are equal.
     * @param array1 The given 1st array.
     * @param array2 The given 2nd array.
     * @param cmp The compare function.
     */
    export function equals<T>(array1: ReadonlyArray<T>, array2: ReadonlyArray<T>, cmp: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
        if (array1 === array2) {
            return true;
        }

        if (array1.length !== array2.length) {
            return false;
        }

        for (let i = 0, len = array1.length; i < len; i++) {
            if (cmp(array1[i]!, array2[i]!) === false) {
                return false;
            }
        }
    
        return true;
    }

    /**
     * @description Creates a new number array that contains numbers from begin
     * to end.
     * @param begin The begin of the array number (inclusive).
     * @param end The end of the array number (exclusive).
     * @returns The new created array.
     */
    export function range(begin: number, end: number): number[] {
        const arr: number[] = [];

        let i: number;
        if (begin <= end) {
            for (i = begin; i < end; i++) {
                arr.push(i);
            }
        } else {
            for (i = begin; i > end; i--) {
                arr.push(i);
            }
        }

        return arr;
    }

    /**
     * @description Returns the union (OR) of the two given arrays.
     * @param array1 The given first array.
     * @param array2 The given second array.
     * @param valueFn The function to decide how the items to be determined for equality.
     * @returns The new created array.
     * 
     * @note The returned union array will remove all the unique items.
     * @complexity O(n + m)
     */
    export function union<T>(array1: ReadonlyArray<T>, array2: ReadonlyArray<T>, valueFn: (value: T) => any = value => value): T[] {
        const union: T[] = [];
        const visited = new Set<T>();
        
        const each = (item: T): void => {
            const value = valueFn(item);

            if (visited.has(value)) {
                return;
            }

            union.push(value);
            visited.add(value);
        }

        array1.forEach(item => each(item));
        array2.forEach(item => each(item));

        return union;
    }

    /**
     * @description Returns the intersection (AND) of the two given arrays.
     * @param array1 The given first array.
     * @param array2 The given second array.
     * @param valueFn The function to decide how the items to be determined for equality.
     * @returns The new created array.
     * 
     * @note The returned union array will remove all the unique items.
     * @complexity O(n + m)
     */
    export function intersection<T>(array1: ReadonlyArray<T>, array2: ReadonlyArray<T>, valueFn: (value: T) => any = value => value): T[] {
        array1 = Arrays.unique(array1, valueFn);
        array2 = Arrays.unique(array2, valueFn);
        
        const intersection: T[] = [];
        const visited = new Set<T>();
        
        const each = (item: T): void => {
            const value = valueFn(item);

            if (visited.has(value)) {
                intersection.push(value);
                return;
            }

            visited.add(value);
        };

        array1.forEach(item => each(item));
        array2.forEach(item => each(item));

        return intersection;
    }

    /**
     * @description Returns the exclusive disjunction (XOR) of the given two arrays.
     * @param array1 The given first array.
     * @param array2 The given second array.
     * @param valueFn The function to decide how the items to be determined for equality.
     * @returns The new created array.
     * 
     * @note The returned union array will remove all the unique items.
     * @complexity O(n + m)
     */
    export function disjunction<T>(array1: ReadonlyArray<T>, array2: ReadonlyArray<T>, valueFn: (value: T) => any = value => value): T[] {
        array1 = Arrays.unique(array1, valueFn);
        array2 = Arrays.unique(array2, valueFn);
        
        const visitedOnce = new Set<any>();
        const visitedOnceItems = new Map<any, T>();
        
        const visited = new Set<any>();
        
        const each = (item: T): void => {
            const value = valueFn(item);

            if (visited.has(value)) {
                visitedOnce.delete(value);
                visitedOnceItems.delete(value);
                return;
            }

            visitedOnce.add(value);
            visitedOnceItems.set(value, item);
            visited.add(value);
        };

        array1.forEach(item => each(item));
        array2.forEach(item => each(item));

        const disjunction: T[] = [];
        visitedOnceItems.forEach((value, item) => disjunction.push(item));

        return disjunction;
    }

    /**
     * @description Returns the relative complement (') of the 1st array respect 
     * to the 2nd array, which is the array contains items in the 2nd one but 
     * not in the 1st one.
     * @param array1 The given first array.
     * @param array2 The given second array.
     * @param valueFn The function to decide how the items to be determined for equality.
     * @returns The new created array.
     * 
     * @note The returned union array will remove all the unique items.
     * @complexity O(n + m)
     */
    export function relativeComplement<T>(array1: ReadonlyArray<T>, array2: ReadonlyArray<T>, valueFn: (value: T) => any = value => value): T[] {
        array1 = Arrays.unique(array1, valueFn);
        array2 = Arrays.unique(array2, valueFn);

        const array1Visited = new Set<any>();

        for (const item of array1) {
            const value = valueFn(item);
            array1Visited.add(value);
        }

        const complement: T[] = [];
        const visited = new Set<any>();

        for (const item of array2) {
            const value = valueFn(item);
            
            if (array1Visited.has(value) || visited.has(value)) {
                continue;
            }

            complement.push(item);
            visited.add(value);
        }

        return complement;
    }

    /**
     * @description Removes the duplicate items in the given array.
     * @param array The given array.
     * @param valueFn The function to decide how the items to be determined for equality.
     * @returns The new created array.
     * 
     * @complexity O(n)
     */
    export function unique<T>(array: ReadonlyArray<T>, valueFn: (value: T) => any = value => value): T[] {
        const visited = new Set<T>();

        return array.filter(item => {
            const value = valueFn(item);
            
            if (visited.has(value)) {
                return false;
            }

            visited.add(value);
            return true;
        });
    }

    /**
     * @description If the given array includes any values that matches any of 
     * your provided values.
     * @param array The given array.
     * @param values The provided values.
     * @param match A compare function.
     */
    export function matchAny<T>(array: ReadonlyArray<T>, values: T[], match: (arrValue: T, yourValue: T) => boolean): boolean {
        for (const yourValue of values) {
            for (const arrValue of array) {
                if (match(arrValue, yourValue)) {
                    return true;
                }
            }
        }
        return false;
    }
}

export interface IDeque<T> extends IIterable<T> {
    size(): number;
    empty(): boolean;
    
    at(index: number): T;
    front(): T;
    back(): T;
    
    pushBack(element: T): void;
    pushFront(element: T): void;
    popBack(): T;
    popFront(): T;
    
    insert(index: number, element: T): void;
    remove(index: number): T;
    replace(index: number, element: T): T;
    swap(first: number, second: number): void;
    reverse(): void;
    
    count(element: T, cmp?: CompareFn<T>): number;
    find(element: T, cmp?: CompareFn<T>): T | null;

    extendFront(other: Deque<T>): void;
    extendBack(other: Deque<T>): void;
    clear(): number;
}

export class Deque<T> implements IDeque<T> {

    // [field]

    private _arr: T[];
    private _defaultCmp: CompareFn<T> = (a: T, b: T) => a === b ? 1 : 0;
    
    // [constructor]

    constructor(elements: T[] = []) {
        this._arr = [];
        for (const element of elements) {
            this._arr.push(element);
        }
    }

    // [public methods]

    public size(): number {
        return this._arr.length;
    }

    public empty(): boolean {
        return !this._arr.length;
    }

    public at(index: number): T {
        const element = this._arr[index];
        if (!element) {
            throw new Error(`Invalid index when getting elements in deque at ${index}.`);
        }
        return element;
    }

    public front(): T {
        return this.at(0);
    }

    public back(): T {
        return this.at(this.size() - 1);
    }

    public pushBack(element: T): void {
        this._arr.splice(this.size(), 0, element);
    }

    public pushFront(element: T): void {
        this._arr.splice(0, 0, element);
    }

    public popBack(): T {
        if (this.empty()) {
            throw new Error('Cannot pop back from deque because it is empty.');
        }
        return this._arr.pop()!;
    }

    public popFront(): T {
        if (this.empty()) {
            throw new Error('Cannot pop front from deque because it is empty.');
        }
        return this._arr.splice(0, 1)[0]!;
    }

    public insert(index: number, element: T): void {
        if (index < 0 || index > this.size()) {
            throw new Error(`Invalid index when inserting elements in deque at ${index}.`);
        }
        this._arr.splice(index, 1, element);
    }

    public remove(index: number): T {
        const removed = this._arr.splice(index, 1);
        if (!removed.length) {
            throw new Error(`Cannot remove elements from deque at invalid index ${index}.`);
        }
        return removed[0]!;
    }

    public replace(index: number, element: T): T {
        const old = this.at(index);
        this._arr[index] = element;
        return old;
    }

    public swap(first: number, second: number): void {
        const firstElement = this.at(first);
        this._arr[first] = this.at(second);
        this._arr[second] = firstElement;
    }

    public reverse(): void {
        this._arr.reverse();
    }

    public count(element: T, cmp: CompareFn<T> = this._defaultCmp): number {
        let cnt = 0;
        for (const ele of this._arr) {
            if (cmp(ele, element)) {
                cnt += 1;
            }
        }
        return cnt;
    }

    public find(element: T, cmp: CompareFn<T> = this._defaultCmp): T | null {
        const found = this._arr.find((val: T) => cmp!(val, element) === 1);
        return found ? found : null;
    }

    public extendFront(other: Deque<T>): void {
        for (const element of other) {
            this.pushFront(element);
        }
    }

    public extendBack(other: Deque<T>): void {
        for (const element of other) {
            this.pushBack(element);
        }
    }

    public clear(): number {
        const removed = this.size();
        this._arr = [];
        return removed;
    }

    *[Symbol.iterator](): Iterator<T> {
		let idx = 0;
        while (idx < this.size()) {
			yield this._arr[idx]!;
			idx += 1;
		}
	}
}