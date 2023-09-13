import { IDisposable } from "src/base/common/dispose";
import { Deque } from "src/base/common/structures/deque";
import { IIterable } from "src/base/common/utilities/iterable";

/**
 * Interface only for {@link Queue}.
 */
export interface IQueue<T> extends IIterable<T>, IDisposable {
    size(): number;
    empty(): boolean;
    front(): T;
    back(): T;
    pushBack(element: T): void;
    popFront(): T;
    clear(): void;
}

export class Queue<T> implements IQueue<T> {

    private readonly _deque: Deque<T>;

    constructor(elements: T[] = []) {
        this._deque = new Deque(elements);
    }

    public size(): number {
        return this._deque.size();
    }

    public empty(): boolean {
        return this._deque.empty();
    }

    public front(): T {
        return this._deque.front();
    }

    public back(): T {
        return this._deque.back();
    }

    public pushBack(element: T): void {
        this._deque.pushBack(element);
    }

    public popFront(): T {
        return this._deque.popFront();
    }

    public clear(): void {
        this._deque.clear();
    }

    public dispose(): void {
        this.clear();
    }

    *[Symbol.iterator](): Iterator<T> {
		let idx = 0;
        while (idx < this.size()) {
			yield this._deque.at(idx);
			idx += 1;
		}
	}
}