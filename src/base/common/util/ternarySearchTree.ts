import { Random } from "src/base/common/util/random";

const enum Dir {
    Left = -1,
    Mid = 0,
    Right = 1
}

export interface IKeyIterator<K> {

    /**
     * 
     */
    next(): void;

    /**
     * 
     */
    hasNext(): boolean;
    
    /**
     * 
     */
    reset(value: K): this;

    /**
     * 
     * @param input 
     */
    cmp(input: string): number;

    /**
     * 
     */
    currVal(): string;
}

export class StringIterator implements IKeyIterator<string> {

    private _value: string = '';
    private _pos: number = 0;

    next(): void {
        this._pos += 1;
    }

    hasNext(): boolean {
        return this._pos < (this._value.length - 1)
    }

    reset(value: string): this {
        this._value = value;
        this._pos = 0;
        return this;
    }

    cmp(input: string): number {
        const inputChar = input.charCodeAt(0);
        const iterChar = this._value.charCodeAt(this._pos);
        return inputChar - iterChar;
    }

    currVal(): string {
        return this._value[this._pos]!;
    }
}

export interface ITernarySearchTree<K, V> {
    
    /** 
     * TODO:
    */
    clear(): void;

    /**
     * 
     * @param values 
     * @param keys 
     */
    fill(values: readonly [K, V][] | V, keys?: readonly K[]): void;

    /**
     * 
     * @param value 
     * @param key 
     */
    set(key: K, value: V): V | undefined;

    /**
     * 
     * @param key 
     */
    get(key: K): V | undefined;

    /**
     * TODO: test has, cat and cata
     * @param key 
     */
    has(key: K): boolean;

    /**
     * TODO:
     * @param key 
     */
    delete(key: K): void;
    
    /**
     * 
     * @param key 
     */
    findSubtr(key: K): V | undefined;
}

class TernarySearchTreeNode<K, V> {
    height: number = 1;

    // current segment of the key, assigned by key[pos]
    segment!: string;

    // the entire key
    key: K | undefined;

    value: V | undefined;
    left: TernarySearchTreeNode<K, V> | undefined;
    mid: TernarySearchTreeNode<K, V> | undefined;
    right: TernarySearchTreeNode<K, V> | undefined;

    // AVL rotate

    /**
     * @assert Requires `node.right` to be non-nullity.
     */
    public rotateLeft(): TernarySearchTreeNode<K, V> {
        const tmp = this.right!;
        this.right = tmp.left;
        tmp.left = this;
        return tmp;
    }

    /**
     * @assert Requires `node.right` to be non-nullity.
     */
    public rotateRight(): TernarySearchTreeNode<K, V> {
        const tmp = this.left!;
        this.left = tmp.right;
        tmp.right = this;
        return tmp;
    }

    public updateNodeHeight(): void {
        this.height = 1 + Math.max(this.leftHeight, this.rightHeight);
    }

    public balanceFactor(): number {
        return this.rightHeight - this.leftHeight;
    }

    get leftHeight(): number {
        return this.left?.height ?? 0;
    }

    get rightHeight(): number {
        return this.right?.height ?? 0;
    }
}

/**
 * 
 */
export namespace CreateTernarySearchTree {
    export function forStrings<E>(): TernarySearchTree<string, E> {
        return new TernarySearchTree<string, E>(new StringIterator());
    }


}

/**
 * 
 */
export class TernarySearchTree<K, V> implements ITernarySearchTree<K, V> {

    private _root: TernarySearchTreeNode<K, V> | undefined;
    private _iter: IKeyIterator<K>;

    clear(): void {
        this._root = undefined;
    }

    constructor(keyIter: IKeyIterator<K>) {
        this._iter = keyIter;
    }

    fill(values: readonly [K, V][]): void {
        const arr = values.slice(0);
        Random.shuffle(arr);
        for (const entry of arr) {
            this.set(entry[0], entry[1]);
        }
    }

    set(key: K, value: V): V | undefined {
        const iter = this._iter.reset(key);
        let node: TernarySearchTreeNode<K, V>;

        if (!this._root) {
            this._root = new TernarySearchTreeNode
        }

        const path: [Dir, TernarySearchTreeNode<K, V>][] = [];

        return undefined;
    }

    get(key: K): V | undefined {
        return undefined;
    }

    has(key: K): boolean {
        return false;
    }

    delete(key: K): void {
        
    }

    findSubtr(key: K): V | undefined {
        return undefined;
    }
}