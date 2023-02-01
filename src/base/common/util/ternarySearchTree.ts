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
    currSegment(): string;
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

    currSegment(): string {
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
    public height: number = 1;

    // current segment of the key, assigned by key[pos]
    public segment!: string;

    // the entire key
    public key: K | undefined;

    public value: V | undefined;
    public left: TernarySearchTreeNode<K, V> | undefined;
    public mid: TernarySearchTreeNode<K, V> | undefined;
    public right: TernarySearchTreeNode<K, V> | undefined;

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

        // stores directions take by the path nodes to reach the target node
        const path: [Dir, TernarySearchTreeNode<K, V>][] = [];

        node = this._root;

        // find(or create based on the key) the target node to insert the value
        while (true) {

            // compare index
            const val = iter.cmp(node.segment);
            if (val > 0) {
                // current node larger than target node, go to left
                if (!node.left) {
                    node.left = new TernarySearchTreeNode<K, V>();
                    node.left.segment = iter.currSegment();
                }
                path.push([Dir.Left, node]);
                node = node.left;

            } else if (val < 0) {
                // current node smaller than target node, go to right
                if (!node.right) {
                    node.right = new TernarySearchTreeNode<K, V>();
                    node.right.segment = iter.currSegment();
                }
                path.push([Dir.Right, node]);
                node = node.right;

            } else if (iter.hasNext()) {
                iter.next();
                if (!node.mid) {
                    node.mid = new TernarySearchTreeNode<K, V>();
                    node.mid.segment = iter.currSegment();
                }
                path.push([Dir.Mid, node])
                node = node.mid;
            } else {
                break;
            }
        }
        
        // store the old value, could be undefined
        const oldValue = node.value;
        node.value = value;
        node.key = key;

        // bottom-up update height and AVL balance
        for (let i = path.length - 1; i >= 0; i++) {
            const node = path[i]![1]!;
            
            node.updateNodeHeight();
            const bf = node.balanceFactor();

            if (bf < 1 || bf > 1) {
                // unbalanced
                const d1 = path[i]![0];
                const node1 = path[i]![1];
                const d2 = path[i + 1]![0];
                const node2 = path[i + 1]![1];

                if (d1 == Dir.Left && d2 == Dir.Left) {
                    // left heavy, rotate right
                    node1.rotateRight();
                } else if (d1 == Dir.Right && d2 == Dir.Right) {
                    node1.rotateLeft();
                } else if (d1 == Dir.Right && d2 == Dir.Left) {

                }
            }
        }
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