import { Disposable, IDisposable, untrackDisposable } from "src/base/common/dispose";
import { IIterable } from "src/base/common/utilities/iterable";
import { Comparator } from "src/base/common/utilities/type";

export interface IPriorityQueue<T> extends IIterable<T>, IDisposable {
	
	/**
     * @description Adds an element to the queue.
     * @param element - The element to add.
     */
	enqueue(element: T): void;
		
	/**
	 * @description Removes and returns the highest-priority element.
	 * @returns The highest-priority element or undefined if the queue is empty.
	 */
	dequeue(): T | undefined;

    /**
     * @description Removes the specified element from the priority queue. This 
     * method finds all occurrences of the given element in the heap, replaces 
     * them with the last element in the heap, and then sifts up or down as 
     * necessary to maintain the heap properties. 
     * @param element - The element to be removed from the priority queue.
     * @complexity O(n) - where n is the number of elements in the heap.
     * @throws If the element is not found.
     */
    remove(element: T): void;

	/**
	 * @description Returns the highest-priority element without removing it.
	 * @returns The highest-priority element or undefined if the queue is empty.
	 */
	peek(): T | undefined;

	/**
	 * @description Returns the number of elements in the queue.
	 * @returns The number of elements in the queue.
	 */
	size(): number;

	/**
	 * @description Checks if the queue is empty.
	 * @returns True if the queue is empty, false otherwise.
	 */
	empty(): boolean;

    /**
     * @description Clear the entire queue to empty.
     */
    clear(): void;
}

export class PriorityQueue<T> extends Disposable implements IPriorityQueue<T> {
	
	// [fields]

    private _heap: T[] = [];
    private _count: number = 0;
    private readonly __comparator: Comparator<T>;

	// [constructor]

    constructor(comparator: Comparator<T>) {
        super();
        this.__comparator = comparator;
    }

	// [public methods]
    
    public enqueue(element: T): void {
        this._heap[this._count] = element;
        this._count++;
        this.__bubbleUp();
    }
    
    public dequeue(): T | undefined {
        if (this.empty()) {
            return undefined;
        }
        
        const item = this._heap[0];
        this._heap[0] = this._heap[this._count - 1]!;
        this._heap.pop();
        
        this._count--;
        this.__sinkDown();

        return item;
    }

    public remove(element: T): void {
        const index = this._heap.findIndex(e => e === element);
    
        if (index === -1) {
            return;
        }
    
        this._heap[index] = this._heap[this._count - 1]!;
        this._heap.pop();
        this._count--;
    
        // If the element was the last or only element, no reordering is necessary.
        if (index === this._count) {
            return;
        }
    
        // Decide whether to bubble up or sink down
        const parentIdx = Math.floor((index - 1) / 2);
        if (index > 0 && this.__comparator(this._heap[index]!, this._heap[parentIdx]!) < 0) {
            this.__bubbleUp(index);
        } else {
            this.__sinkDown(index);
        }
    }
    
    public peek(): T | undefined {
        if (this.empty()) {
            return undefined;
        }
        return this._heap[0];
    }
    
    public size(): number {
        return this._count;
    }
    
    public empty(): boolean {
        return this._heap.length === 0;
    }

    public clear(): void {
        this._heap = [];
        this._count = 0;
    }

    public override dispose(): void {
        super.dispose();
        this.clear();
    }

	*[Symbol.iterator](): Iterator<T> {
        const copy = [...this._heap];
        const copyCount = this._count;
        const copyComparator = this.__comparator;

        const copyQueue = untrackDisposable(new PriorityQueue<T>(copyComparator));
        copyQueue._heap = copy;
        copyQueue._count = copyCount;
        
        while (!copyQueue.empty()) {
            yield copyQueue.dequeue()!;
        }
    }
    
    // [private helper methods]

    private __bubbleUp(index: number = this._count - 1): void {
        while (index > 0) {
            const item = this._heap[index]!;
            const parentIdx = Math.floor((index - 1) / 2);
            const parent = this._heap[parentIdx]!;
            
            if (this.__comparator(item, parent) >= 0) {
                break;
            }
            
            this._heap[index] = parent;
            this._heap[parentIdx] = item;
            index = parentIdx;
        }
    }

    private __sinkDown(index: number = 0): void {
        const length = this.size();
        const element = this._heap[0]!;

        while (true) {
            const leftChildIdx = 2 * index + 1;
            const rightChildIdx = 2 * index + 2;
            
            let swapIdx: number | null = null;

            if (leftChildIdx < length) {
                const leftChild = this._heap[leftChildIdx]!;
                if (this.__comparator(leftChild, element) < 0) {
                    swapIdx = leftChildIdx;
                }
            }
            
            if (rightChildIdx < length) {
                const leftChild = this._heap[leftChildIdx]!;
                const rightChild = this._heap[rightChildIdx]!;
                if (
                    (swapIdx === null && this.__comparator(rightChild, element) < 0) || 
                    (swapIdx !== null && this.__comparator(rightChild, leftChild) < 0)
                ) {
                    swapIdx = rightChildIdx;
                }
            }

            if (swapIdx === null) {
                break;
            }

            this._heap[index] = this._heap[swapIdx]!;
            this._heap[swapIdx] = element;
            index = swapIdx;
        }
    }
}