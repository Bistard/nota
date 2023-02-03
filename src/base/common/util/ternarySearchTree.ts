import { IIterable } from "src/base/common/util/iterable";
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

export interface ITernarySearchTree<K, V> extends IIterable<[K, V]> {
    
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
export class TernarySearchTree<K, V extends NonNullable<any>> implements ITernarySearchTree<K, V> {

    private _root: TernarySearchTreeNode<K, V> | undefined;
    private _iter: IKeyIterator<K>;

    public clear(): void {
        this._root = undefined;
    }

    constructor(keyIter: IKeyIterator<K>) {
        this._iter = keyIter;
    }

    public fill(values: readonly [K, V][]): void {
        const arr = values.slice(0);
        Random.shuffle(arr);
        for (const entry of arr) {
            this.set(entry[0], entry[1]);
        }
    }

    public set(key: K, value: V): V | undefined {
        const iter = this._iter.reset(key);
        let node: TernarySearchTreeNode<K, V>;

        if (!this._root) {
            this._root = new TernarySearchTreeNode<K, V>;
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
        const oldVal = node.value;
        node.value = value;
        node.key = key;

        // AVL balance
        this._avlBalance(path);

        return oldVal;
    }

    private _findNode(key: K, path?: [Dir, TernarySearchTreeNode<K, V>][]): TernarySearchTreeNode<K, V> | undefined {
        const iter = this._iter;
        let node =  this._root;

        while (node) {
            const val = iter.cmp(node.segment);
            if (val > 0) {
                node = node.left;
            } else if (val < 0) {
                node = node.right;
            } else if (iter.hasNext()) {
                iter.next();
                node = node.mid;
            } else {
                break;
            }
        }
        return node;
    }

    public get(key: K): V | undefined {
        const node = this._findNode(key);
        return node?.value;
    }

    public has(key: K): boolean {
        const node = this._findNode(key);
        return (node?.value === undefined);
    }

    private _delete(key: K, superStr: boolean): void {
        const path: [Dir, TernarySearchTreeNode<K, V>][] = [];
        const iter = this._iter.reset(key);
        let node = this._root;

        while (node) {
            const val = iter.cmp(node.segment);
            if (val > 0) {
                path.push([Dir.Left, node]);
                node = node.left;
            } else if (val < 0) {
                path.push([Dir.Right, node]);
                node = node.right;
            } else if (iter.hasNext()) {
                path.push([Dir.Mid, node]);
                node = node.mid;
                iter.next();
            } else {
                break;
            }
        }

        if (!node) {
            // node is not found
            return;
        }

        // delete all super string
        if (superStr) {
            node.mid = undefined;
            node.left =  undefined;
            node.right = undefined;
            node.height = 1;
        } else {
            node.value = undefined;
            node.key = undefined;
        }

        // if node segment is not a part of any string
        if (!node.mid && !node.value) {
            this._bstRemoveNode(node, path);
        }

        // AVL balance
        this._avlBalance(path);
    }
    
    private _avlBalance(path: [Dir, TernarySearchTreeNode<K, V>][]): void {
        // bottom-up update height and AVL balance
        for (let i = path.length - 1; i >= 0; i++) {
            const node = path[i]![1]!;
            
            node.updateNodeHeight();
            const bf = node.balanceFactor();

                if (bf < 1 || bf > 1) {
                // unbalanced
                const d1 = path[i]![0];
                let node1 = path[i]![1];
                const d2 = path[i + 1]![0];
                let node2 = path[i + 1]![1];

                if (d1 == Dir.Left && d2 == Dir.Left) {
                    // left heavy, rotate right
                    node1 = path[i]![1] = node1.rotateRight();
                } else if (d1 == Dir.Right && d2 == Dir.Right) {
                    // right heavy, rotate left
                    node1 = path[i]![1] = node1.rotateLeft();
                } else if (d1 == Dir.Right && d2 == Dir.Left) {
                    node1.right = node2.rotateRight();
                    node1 = path[i]![1] = node1.rotateLeft();
                } else if (d1 == Dir.Left && d2 == Dir.Right) {
                    node1.left = node2.rotateLeft();
                    node1 = path[i]![1] = node1.rotateRight();
                } else {
                    throw new Error("TST wrong path");
                }

                // correct the parent of node1
                if (i > 0) {
                    switch(path[i]![0]) {
                        case Dir.Left:
                            path[i - 1]![1].left = node1;
                            break;
                        case Dir.Right:
                            path[i - 1]![1].right = node1;
                            break;
                        case Dir.Mid:
                            path[i - 1]![1].mid = node1;
                            break;
                    }
                } else {
                    this._root = node1;
                }
            }
        }
    }

    private _leftest(node: TernarySearchTreeNode<K, V>): TernarySearchTreeNode<K, V> {
        while (node.left) {
            node = node.left;
        }
        return node;
    }

    private _bstRemoveNode(node: TernarySearchTreeNode<K, V>, path: [Dir, TernarySearchTreeNode<K, V>][]): void {
        if (node.left && node.right) {
            const leftest = this._leftest(node.right);
            if (leftest) {
                const { key, value, segment } = leftest;
                this._delete(leftest.key!, false);
                node.key = key;
                node.value = value;
                node.segment = segment;
            }
        } else {
            // empty or only left\right
            const child = node.left ?? node.right;
            if (path.length > 0) {
                const [dir, parent] =  path[path.length - 1]!;
                switch(dir) {
                    case Dir.Left:
                        parent.left = child;
                        break;
                    case Dir.Mid:
                        parent.mid = child;
                        break;
                    case Dir.Right:
                        parent.right = child;
                        break;
                }
            } else {
                // no node is left
                this._root = child;
            }
        }
    }

    public delete(key: K): void {
       this._delete(key, false);
    }

    // delete any superStr that has key as a substring
    public deleteSuperStr(key: K): void {
        this._delete(key, true);
    }

    public findSubtr(key: K): V | undefined {
        const iter = this._iter;
        let node =  this._root;
        let candidate: V | undefined = undefined;

        while (node) {
            const val = iter.cmp(node.segment);
            if (val > 0) {
                node = node.left;
            } else if (val < 0) {
                node = node.right;
            } else if (iter.hasNext()) {
                iter.next();
                candidate = node.value ?? candidate;
                node = node.mid;
            } else {
                break;
            }
        }
        if (node?.value) {
            return node.value;
        }
        return candidate;
    }

    forEach(callback: (key: K, value: V) => any): void {
        for (const [key, value] of this) {
            callback(key, value);
        }
    }

    *[Symbol.iterator](): IterableIterator<[K, V]> {
        yield* this._nodeIter(this._root);
    }

    private _nodeIter(node: TernarySearchTreeNode<K, V> | undefined): IterableIterator<[K, V]> {
        const nodeArr: [K, V][] = [];
        this._dfsNodes(node, nodeArr);
        return nodeArr[Symbol.iterator]();
    }

    private _dfsNodes(node: TernarySearchTreeNode<K, V> | undefined, nodeArr: [K, V][]): void {
        if (!node) {
            return
        }

        if (node.left) {
            this._dfsNodes(node.left, nodeArr);
        }

        if (node.value) {
            nodeArr.push([node.key!, node.value]);
        }

        if (node.mid) {
            this._dfsNodes(node.mid, nodeArr);
        }

        if (node.right) {
            this._dfsNodes(node.right, nodeArr);
        }
    }

}