const enum Dir {
    Left = -1,
    Mid = 0,
    Right = 1
}

export interface IKeyIterator<K> {

    next(): IKeyIterator<K>;
    hasNext(): boolean;
    
}

export interface ITernarySearchTree<K, V> {
    forStrings<T>(): TernarySearchTree<string, T>;
    
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
    set(value: V, key: K): V | undefined;

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
    public rotateLeft(): TernarySearchTreeNode<K, V> {
        const tmp = this.right!;
        this.right = tmp.left;
        tmp.left = this;
        return tmp;
    }

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

export namespace CreateTernarySearchTree {
    export function forStrings<E>(): TernarySearchTree<string, E> {
        return new TernarySearchTree<string, E>;
    }


}

export class TernarySearchTree<K, V> {


}