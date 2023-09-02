import { IDisposable } from "src/base/common/dispose";
import { Deque } from "src/base/common/structures/deque";
import { IIterable } from "src/base/common/utilities/iterable";

/**
 * Interface for {@link Stack}.
 */
export interface IStack<T> extends IIterable<T>, IDisposable {
    size(): number;
    empty(): boolean;
    top(): T;
    push(element: T): void;
    pop(): T;
    clear(): void;
}

export class Stack<T> implements IStack<T> {

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

    public top(): T {
        return this._deque.front();
    }

    public push(element: T): void {
        this._deque.pushFront(element);
    }

    public pop(): T {
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