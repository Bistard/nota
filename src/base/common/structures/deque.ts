import { IDisposable } from "src/base/common/dispose";
import { IIterable } from "src/base/common/utilities/iterable";
import { panic } from "src/base/common/utilities/panic";

/**
 * Interface for {@link IDeque}.
 */
export interface IDeque<T> extends IIterable<T>, IDisposable {
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
    
    extendFront(other: Deque<T>): void;
    extendBack(other: Deque<T>): void;
    clear(): number;
}

export class Deque<T> implements IDeque<T> {

    // [field]
    private _arr: T[];

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
        if (index < 0 || index >= this.size()) {
            panic(`Invalid index when getting elements in deque at ${index}.`);
        }
        return this._arr[index]!;
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
            panic('Cannot pop back from deque because it is empty.');
        }
        return this._arr.pop()!;
    }

    public popFront(): T {
        if (this.empty()) {
            panic('Cannot pop front from deque because it is empty.');
        }
        return this._arr.splice(0, 1)[0]!;
    }

    public insert(index: number, element: T): void {
        if (index < 0 || index > this.size()) {
            panic(`Invalid index when inserting elements in deque at ${index}.`);
        }
        this._arr.splice(index, 0, element);
    }

    public remove(index: number): T {
        const removed = this._arr.splice(index, 1);
        if (!removed.length) {
            panic(`Cannot remove elements from deque at invalid index ${index}.`);
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

    public dispose(): void {
        this.clear();
    }

    *[Symbol.iterator](): Iterator<T> {
        let idx = 0;
        while (idx < this.size()) {
            yield this._arr[idx]!;
            idx += 1;
        }
    }
}
