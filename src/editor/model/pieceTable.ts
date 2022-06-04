import { BufferPosition, IPieceTable } from "src/editor/common/model";
import { TextBuffer } from "src/editor/model/textBuffer";

/**
 * @internal
 * @class Each {@link Piece} only refers to a {@link TextBuffer} (either `added` 
 * or `original`) inside the {@link PieceTable}.
 * 
 * Printing all the {@link Piece}s inside {@link PieceTable} in the in-order way 
 * is the actual text model.
 */
class Piece {

    /** 
     * Which buffer the piece is refering in the whole table. 
     */
    public readonly bufferIndex: number;

    /**
     * The length of the corresponding buffer.
     */
    public readonly bufferLength: number;

    /**
     * The linefeed counts of the corresponding buffer.
     */
    public readonly lfCount: number;

    /** 
     * The start position of the piece in the corresponding buffer. 
     */
    public readonly start: BufferPosition;

    /** 
     * The end position of the piece in the corresponding buffer. 
     */
    public readonly end: BufferPosition;

    constructor(bufferIndex: number, bufferLength: number, lfCount: number, start: BufferPosition, end: BufferPosition) {
        this.bufferIndex = bufferIndex;
        this.bufferLength = bufferLength;
        this.lfCount = lfCount;
        this.start = start;
        this.end = end;
    }
    
}

/**
 * @internal
 * @class A tree node used in {@link PieceTable} which nested with a {@link Piece}.
 * Note that the constructor will point the parent / left / right all to the 
 * {@link NULL_NODE}.
 */
class Node {

    // [field]

    public color: Color;

    public parent: Node;
    public left: Node;
    public right: Node;

    public leftSubtreeBufferLength: number;
    public leftSubtreelfCount: number;

    public piece: Piece;

    // [constructor]

    constructor(piece: Piece, color: Color) {
        this.parent = NULL_NODE;
        this.left = NULL_NODE;
        this.right = NULL_NODE;
        this.leftSubtreeBufferLength = 0;
        this.leftSubtreelfCount = 0;
        this.color = color;
        this.piece = piece;
    }

    // [public methods]

    /**
     * @description Returns the left most tree node of the given node. 
     * @note If the given node is {@link NULL_NODE} or has no left-subtree, a
     * {@link NULL_NODE} will be returned.
     * 
     * @complexity O(h)
     */
    public static leftMost(node: Node): Node {
        if (!node.piece || node.left === NULL_NODE) {
            return NULL_NODE;
        }
        
        while (node.left !== NULL_NODE) {
            node = node.left;
        }
        return node;
    }

    /**
     * @description Returns the right most tree node of the given node. 
     * @note If the given node is {@link NULL_NODE} or has no right-subtree, a
     * {@link NULL_NODE} will be returned.
     * 
     * @complexity O(h)
     */
    public static rightMost(node: Node): Node {
        if (!node.piece || node.right === NULL_NODE) {
            return NULL_NODE;
        }

        while (node.right !== NULL_NODE) {
            node = node.right;
        }
        return node;
    }

    /**
     * @description Calculates the total buffer length of the given node. Includes
     * its left-subtree, right-subtree and its own buffer length.
     * 
     * @complexity O(h)
     */
    public static totalBufferLength(node: Node): number {
        if (node === NULL_NODE) {
            return 0;
        }
        return node.leftSubtreeBufferLength + node.piece.bufferLength + Node.totalBufferLength(node.right);
    }

    /**
     * @description Calculates the total linefeed count of the given node. Includes
     * its left-subtree, right-subtree and its own linefeed count.
     * 
     * @complexity O(h)
     */
    public static totalLinefeedCount(node: Node): number {
        if (node === NULL_NODE) {
            return 0;
        }
        return node.leftSubtreelfCount + node.piece.bufferLength + Node.totalBufferLength(node.right);
    }

}

/**
 * For red-black tree usage.
 */
const enum Color {
    BLACK = 1,
    RED = 2
}

/** 
 * The null node as the leaf.
 */
const NULL_NODE = new Node(null!, Color.BLACK);

/**
 * @class A {@link PieceTable} is an efficient data structure for fast text
 * editing which is commonly used in a text editor.
 * 
 * I. Using a single string to represent `original` and `added` may hurts the
 * performance in some circustances:
 *      1. V8 engine did not support string length over 256MB back in time.
 *      2. String concatenation is stupid.
 * Instead, every time when the program reads a chunk, say 256KB per time, it 
 * will be stored directly into a {@link TextBuffer} and create a {@link Node} 
 * points to it.
 * 
 * II. When creating a {@link TextBuffer}, program will read through the buffer
 * and count all the linefeeds for later fast querying by line numbers. Since 
 * each {@link TextBuffer} is readonly, the performance cost is worthy.
 * 
 * III. The whole class is built upon a red-black tree. Unlike the basic ones, 
 * each {@link Node} also maintains the left-subtree total buffer length and the
 * left-subtree total linefeed count. The tree uses these two metadata as the key
 * to compare between nodes. In this case, we can search a {@link Piece} either: 
 *      1. by the offset of the whole text 
 *      2. by the absolute line number 
 * both under the O(logn) situation.
 * 
 * The more detailed idea can be found the blog of VSCode:
 *  - {@link https://code.visualstudio.com/blogs/2018/03/23/text-buffer-reimplementation}
 */
export class PieceTable implements IPieceTable {

    // [field]

    /**
     * APPEND-ONLY BUFFER
     *      - [0]: added buffer
     *      - [i]: original buffer
     */
    private _buffer: TextBuffer[];

    private _root: Node;

    // [constructor]

    constructor(chunks: TextBuffer[]) {
        this._buffer = [new TextBuffer('', [0])];
        this._root = NULL_NODE;
        
        let i = 0;
        let strlen = chunks.length;
        let node = NULL_NODE;
        for (i = 0; i < strlen; i++) {
            const { buffer, linestart } = chunks[i]!;
            
            // since the buffer is empty, no need to store as a node.
            if (buffer.length === 0) {
                continue;
            }

            const piece = new Piece(
                i + 1, 
                buffer.length,
                linestart.length, { 
                    line: 0, 
                    offset: 0 
                }, { 
                    line: linestart.length - 1, 
                    offset: buffer.length - linestart[linestart.length - 1]!
                }
            );

            this._buffer.push(chunks[i]!);
            this.__insertAsSuccessor(node, piece);
        }
    }

    // [public methods]

    // [private helper methods]

    /**
     * @description Given a {@link Piece}, constructs a new {@link Node} and 
     * insert the new node as a successor to the given node.
     * @returns The created node.
     * 
     * @complexity O(h)
     */
    private __insertAsSuccessor(node: Node, piece: Piece): Node {
        const newnode = new Node(piece, Color.RED);
        
        // empty tree
        if (this._root === NULL_NODE) {
            this._root = newnode;
            newnode.color = Color.BLACK;
        }
        // the given node has no right-subtree
        else if (node.right === NULL_NODE) {
            node.right = newnode;
            newnode.parent = node;
        }
        // the given node has right-subtree
        else {
            const successor = Node.leftMost(node.right);
            successor.left = newnode;
            newnode.parent = successor;
        }

        this.__fixAfterInsertion(newnode);
        return newnode;
    }

    /**
     * @description Given a {@link Piece}, constructs a new {@link Node} and 
     * insert the new node as a predecessor to the given node.
     * @returns The created node.
     * 
     * @complexity O(h)
     */
    private __insertAsPredecessor(node: Node, piece: Piece): Node {
        const newnode = new Node(piece, Color.RED);

        // empty tree
        if (this._root === NULL_NODE) {
            this._root = newnode;
            newnode.color = Color.BLACK;
        }
        // the given node has no right-subtree
        else if (node.left === NULL_NODE) {
            node.left = newnode;
            newnode.parent = node;
        }
        // the given node has right-subtree
        else {
            const predecessor = Node.rightMost(node.left);
            predecessor.right = newnode;
            newnode.parent = predecessor;
        }

        this.__fixAfterInsertion(newnode);
        return newnode;
    }

    /**
     * @description Fix the red-black tree metadata after the insertion.
     * @param node The node which just been inserted.
     * 
     * @complexity O(h)
     */
    private __fixAfterInsertion(node: Node): void {
        
        this.__updatePieceMetadata(node);

        while (node !== this._root && node.parent.color === Color.RED) {
            const parent = node.parent;

            if (parent === parent.parent.left) {
                const parentSibling = parent.parent.right;
                
                if (parentSibling.color === Color.RED) {
                    parent.color = Color.BLACK;
                    parentSibling.color = Color.BLACK;
                    parent.parent.color = Color.RED;
                    node = parent.parent;
                }  else {
                    if (node === parent.right) {
                        node = parent;
                        this.__leftRotateNode(node);
                    }

                    parent.color = Color.BLACK;
                    parent.parent.color = Color.RED;
                    this.__rightRotateNode(parent.parent);
                }
            }

            else {
                const parentSibling = parent.parent.left;

                if (parentSibling.color === Color.RED) {
                    parent.color = Color.BLACK;
                    parentSibling.color = Color.BLACK;
                    parent.parent.color = Color.RED;
                    node = parent.parent;
                } else {
                    if (node === parent.left) {
                        node = parent;
                        this.__rightRotateNode(node);
                    }

                    parent.color = Color.BLACK;
                    parent.parent.color = Color.RED;
                    this.__leftRotateNode(parent.parent);
                }
            }

        }
        
        this._root.color = Color.BLACK;
    }

    /**
     * @description Given the node, recalculates and updates its piece metadata
     * upwards until the root.
     * @param node The node which just been moved.
     * 
     * @complexity O(h)
     */
    private __updatePieceMetadata(node: Node): void {
        if (node === this._root) {
            return;
        }

        /**
         * Since each {@link Node} only maintains its left-subtree metadata, 
         * after each insertion, we need to trace back upwards until we find a 
         * parent node, in whose perspective, its left-subtree is changed.
         */
        while (node !== this._root && node !== node.parent.left) {
            node = node.parent;
        }

        /**
         * This means the new node was moved at the right-most of the whole 
         * tree. We do noting since we do not maintain the right-subtree metadata.
         */
        if (node === this._root) {
            return;
        }

        /**
         * We found the first parent node whose left-subtree's metadata is 
         * changed. We recalculate the updated metadata (buffer length and 
         * linefeed count).
         */
        node = node.parent;
        const lengthDelta = Node.totalBufferLength(node.left) - node.leftSubtreeBufferLength;
        const lfDelta = Node.totalLinefeedCount(node.left) - node.leftSubtreelfCount;
        node.leftSubtreeBufferLength += lengthDelta;
        node.leftSubtreelfCount += lfDelta;

        // no need to update the parents.
        if (lengthDelta === 0 && lfDelta === 0) {
            return;
        }

        /**
         * We still need to trace back upwards to do the same job to the nodes, 
         * in whose perspective, its left-subtree is changed.
         */
        while (node !== this._root) {
            if (node.parent.left === node) {
                node.parent.leftSubtreeBufferLength += lengthDelta;
                node.parent.leftSubtreelfCount += lfDelta;
            }
            node = node.parent;
        }
    }

    /**
     * @description Left rotates the given node to balance the red-black tree.
     * @param node The given node.
     * 
     * @note Rotation will automatically updates piece metadata as well.
     * @complexity O(1)
     */
    private __leftRotateNode(node: Node): void {
        
        const rightNode = node.right;
        node.right = rightNode.left;

        if (rightNode.left !== NULL_NODE) {
            rightNode.left.parent = node;
        }

        rightNode.parent = node.parent;

        if (node.parent === NULL_NODE) {
            this._root = rightNode;
        } else if (node.parent.left === node) {
            node.parent.left = rightNode;
        } else {
            node.parent.right = rightNode;
        }

        rightNode.left = node;
        node.parent = rightNode;

        // update metadata
        rightNode.leftSubtreeBufferLength += node.leftSubtreeBufferLength + node.piece.bufferLength;
        rightNode.leftSubtreelfCount += node.leftSubtreelfCount + node.piece.lfCount;
    }

    /**
     * @description Right rotates the given node to balance the red-black tree.
     * @param node The given node.
     * 
     * @note Rotation will automatically updates piece metadata as well.
     * @complexity O(1)
     */
    private __rightRotateNode(node: Node): void {
        
        const leftNode = node.left;
        node.left = leftNode.right;

        if (leftNode.left !== NULL_NODE) {
            leftNode.left.parent = node;
        }

        leftNode.parent = node.parent;

        if (node.parent === NULL_NODE) {
            this._root = leftNode;
        } else if (node.parent.right === node) {
            node.parent.right = leftNode;
        } else {
            node.parent.left = leftNode;
        }

        leftNode.right = node;
        node.parent = leftNode;

        // update metadata
        leftNode.leftSubtreeBufferLength -= node.leftSubtreeBufferLength + node.piece.bufferLength;
        leftNode.leftSubtreelfCount -= node.leftSubtreelfCount + node.piece.lfCount;
    }

}