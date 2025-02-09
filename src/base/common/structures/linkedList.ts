import { IIterable } from "src/base/common/utilities/iterable";

export interface ILinkedList<T> extends IIterable<T> {

    /** 
     * @description Determines if the list is empty. 
     */
    empty(): boolean;

    /** 
     * @description Returns the size of the list. 
     */
    size(): number;

    /**
     * @description Clears all the nodes in the list.
     * @returns The number of cleared nodes.
     */
    clear(): number;

    /** 
     * @description Returns the first node in the list. 
     */
    front(): ListNode<T> | undefined;

    /** 
     * @description Returns the last node in the list. 
     */
    back(): ListNode<T> | undefined;

    /**
     * @description Pushes a new node with given data into the back of the list.
     * @param data The data of the node.
     * @returns Returns the new constructed node.
     */
    push_back(data: T): ListNode<T>;

    /**
     * @description Pushes a new node with given data into the back of the list.
     * @param data The data of the node.
     * @returns Returns the new constructed node.
     */
    push_front(data: T): ListNode<T>;

    /**
     * @description Pops out the last node in the list.
     * @returns The last node in the list.
     */
    pop_back(): ListNode<T> | undefined;

    /**
     * @description Pops out the first node in the list.
     * @returns The first node in the list.
     */
    pop_front(): ListNode<T> | undefined;

    /**
     * @description Insert a new node before the given node.
     * @param node The node to insert before.
     * @param data The data of the new constructed node.
     * @returns Returns the new constructed node.
     */
    insert(node: ListNode<T>, data: T): ListNode<T>;

    /**
     * @description Removes a node from the list.
     * @note Operation takes O(1) and the provided node must be existed in the 
     * list.
     * @param node The node to be removed.
     */
    remove(node: ListNode<T>): void;

    /**
     * @description Determines if the given data is in the list.
     * @param data Data for determining purpose.
     * @returns The result of existence.
     */
    exist(data: T): boolean;
}

export class ListNode<T> {

    constructor(
        public readonly data: T,
        public prev: ListNode<T> | undefined = undefined,
        public next: ListNode<T> | undefined = undefined
    ) {}

}

/**
 * @description A doubly linked list. LinkedList<T> supports initializer list 
 * constructor.
 */
export class LinkedList<T> {

    private _first: ListNode<T> | undefined = undefined;
    private _last: ListNode<T> | undefined = undefined;
    private _size: number = 0;

    constructor(...elements: T[]) {
        for (const data of elements) {
            this.push_back(data);
        }
    }

    public empty(): boolean {
        return this._size === 0;
    }

    public size(): number {
        return this._size;
    }

    public clear(): number {
        const cleared = this._size;

        let node = this._first;
		while (node !== undefined) {
			const next = node.next;
			node.prev = undefined;
			node.next = undefined;
			node = next;
		}

		this._first = undefined;
		this._last = undefined;
		this._size = 0;

        return cleared;
    }

    public front(): ListNode<T> | undefined {
        return this._first;
    }

    public back(): ListNode<T> | undefined {
        return this._last;
    }

    public push_back(data: T): ListNode<T> {

        const newNode = new ListNode(data);

        // empty list, we insert a new one
        if (this.__pushIfEmpty(newNode) === true) {
            return newNode;
        }

        // we push the node to the back of the list
        return this.__pushAtLast(newNode);
    }

    public push_front(data: T): ListNode<T> {
        
        const newNode = new ListNode(data);
        
        // empty list, we insert a new one
        if (this.__pushIfEmpty(newNode) === true) {
            return newNode;
        }

        // we push the node to the front of the list
        return this.__pushAtFirst(newNode);
    }

    public pop_back(): ListNode<T> | undefined {
        
        // empty list
        if (this._last === undefined) {
            return undefined;
        }

        // only one node in the list
        const pop = this.__popIfOnlyOneNode();
        if (pop) {
            return pop;
        }
        
        // pops out the node from the back
        const node = this._last;
        this._last.prev!.next = undefined;
        this._last = this._last.prev;
        this._size--;
        return node;
    }

    public pop_front(): ListNode<T> | undefined {

        // empty list
        if (this._first === undefined) {
            return undefined;
        }

        // only one node in the list
        const pop = this.__popIfOnlyOneNode();
        if (pop) {
            return pop;
        }

        // pops out the node from the front
        const node = this._first;
        this._first.next!.prev = undefined;
        this._first = this._first.next;
        this._size--;
        return node;
    }

    public insert(node: ListNode<T>, data: T): ListNode<T> {

        const newNode = new ListNode<T>(data);

        // given node is at the beginning of the list
        if (this._first === node) {
            newNode.next = this._first;
            node.prev = newNode;
            this._first = newNode;
        }

        // simply insert the node before the given node
        else {
            newNode.prev = node.prev!.next;
            newNode.next = node;
            node.prev!.next = newNode;
            node.prev = newNode;
        }

        this._size++;
        return newNode;
    }

    public remove(node: ListNode<T>): void {
        // only one node in the list
        if (this.__popIfOnlyOneNode() !== undefined) {
            return;
        }

        // removing the first node
        if (node === this._first) {
            node.next!.prev = undefined;
            this._first = node.next;
        }

        // removing the last node
        else if (node === this._last) {
            node.prev!.next = undefined;
            this._last = node.prev;
        }

        // removing from middle
        else {
            node.prev!.next = node.next;
            node.next!.prev = node.prev;
        }

        this._size--;
    }

    public exist(data: T): boolean {
        let curr = this._first;
        while (curr) {
            if (curr.data === data) {
                return true;
            }
            curr = curr.next;
        }
        return false;
    }

    /***************************************************************************
     * Private Helper Functions
     **************************************************************************/

    /**
     * @description Only pushes the node if the list is empty.
     * @param newNode The node try to push.
     * @returns Returns if the push operation is taken.
     */
    private __pushIfEmpty(newNode: ListNode<T>): boolean {

        if (this._size === 0) {
            this._first = newNode;
            this._last = newNode;
            
            this._size++;
            return true;
        }

        return false;
    }

    /**
     * @description Pushes an existed node to the front of the list.
     * @param newNode The existed node.
     * @returns Returns the node we just pushed.
     * 
     * @undefined_behavior when list is empty.
     */
    private __pushAtFirst(newNode: ListNode<T>): ListNode<T> {
        newNode.next = this._first;
        
        this._first!.prev = newNode;
        this._first = newNode;
        
        this._size++;
        return newNode;
    }

    /**
     * @description Pushes an existed node to the end of the list.
     * @param newNode The existed node.
     * @returns Returns the node we just pushed.
     * 
     * @undefined_behavior when list is empty.
     */
    private __pushAtLast(newNode: ListNode<T>): ListNode<T> {
        newNode.prev = this._last;

        this._last!.next = newNode;
        this._last = newNode;
        
        this._size++;
        return newNode;
    }

    /**
     * @description Pops out the node only if there is only one node in the list.
     * @returns Returns node if operation performed, returns undefined if the
     * length of the list is not equal to one.
     */
    private __popIfOnlyOneNode(): ListNode<T> | undefined {
        // only one node in the list
        if (this._first === this._last) {
            const node = this._first;
            this._first = undefined;
            this._last = undefined;
            this._size--;
            return node;
        }

        return undefined;
    }

    /**
     * @readonly Mark the class as iterable.
     */
    *[Symbol.iterator](): Iterator<T> {
		let node = this._first;
		while (node !== undefined) {
			yield node.data;
			node = node.next;
		}
	}
}
