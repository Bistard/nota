import { CharCode } from "src/base/common/util/char";
import { BufferPosition, EndOfLine, IPiece, IPieceTable, IPieceTableNode, RBColor } from "src/editor/common/model";
import { TextBuffer } from "src/editor/model/textBuffer";

/**
 * @internal
 * @class Each {@link Piece} only refers to a {@link TextBuffer} (either `added` 
 * or `original`) inside the {@link PieceTable}.
 * 
 * Printing all the {@link Piece}s inside {@link PieceTable} in the in-order way 
 * is the actual text model.
 */
class Piece implements IPiece {

    public readonly bufferIndex: number;
    public readonly bufferLength: number;
    public readonly lfCount: number;
    public readonly start: BufferPosition;
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
 * 
 * 
 * @note Note that the constructor will not point the parent / left / right all 
 * to the {@link NULL_NODE}. Use static method `create()` instead.
 */
class Node implements IPieceTableNode {

    // [field]

    public color: RBColor;

    public parent: Node;
    public left: Node;
    public right: Node;

    public leftSubtreeBufferLength: number;
    public leftSubtreelfCount: number;

    public piece: Piece;

    // [constructor]

    constructor(piece: Piece, color: RBColor) {
        this.parent = this;
        this.left = this;
        this.right = this;
        this.leftSubtreeBufferLength = 0;
        this.leftSubtreelfCount = 0;
        this.color = color;
        this.piece = piece;
    }

    // [public static method]

    public static create(piece: Piece, color: RBColor): Node {
        const newnode = new Node(piece, color);
        newnode.parent = NULL_NODE;
        newnode.left = NULL_NODE;
        newnode.right = NULL_NODE;
        return newnode;
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
 * The null node as the leaf.
 */
const NULL_NODE = new Node(null!, RBColor.BLACK);
NULL_NODE.parent = NULL_NODE;
NULL_NODE.left = NULL_NODE;
NULL_NODE.right = NULL_NODE;

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

    private _bufferLength: number;
    private _lfCount: number;

    private _shouldBeNormalized: boolean;
    private _normalizedEOL: EndOfLine;

    // [constructor]

    constructor(chunks: TextBuffer[], shouldBeNormalized: boolean, normalizedEOF: EndOfLine) {
        this._buffer = [new TextBuffer('', [0])];
        this._root = NULL_NODE;
        this._bufferLength = 0;
        this._lfCount = 1;
        this._shouldBeNormalized = shouldBeNormalized;
        this._normalizedEOL = normalizedEOF;
        
        let bufferIndex = 1;
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
                bufferIndex++, 
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
            node = this.__insertAsSuccessor(node, piece);
        }

        this.__updateTableMetadata();
    }

    // [public methods - node]

    /**
     * @description Iterates each tree node in pre-order.
     * @param fn Function applies to each node.
     * 
     * @note This will not go through each leaf (null node).
     */
    public forEach(fn: (node: Node) => void): void {
        this.__preOrder(this._root, fn);
    }

    // [public methods - piece table]

    public getContent(): string[] {
        
        // these lines will not contain any CR / LF / CRLF.
        const lines: string[] = [];
        let currLineBuffer = '';
        let danglingCarriageReturn = false;

        this.forEach(node => {

            const piece = node.piece;
            let pieceLength = piece.bufferLength;
            
            if (pieceLength === 0) {
                return;
            }
            
            const buffer = this._buffer[piece.bufferIndex]!.buffer;
            const linestart = this._buffer[piece.bufferIndex]!.linestart;

            const pieceStartLine = piece.start.line;
            const pieceEndLine = piece.end.line;
            
            // the first character offset of the piece
            let firstCharOffset = linestart[piece.start.line]! + piece.start.offset;

            /**
             * If the previous piece has a CR at the end, we should refresh the 
             * line buffer.
             */
            if (danglingCarriageReturn) {
                /**
                 * The CRLF is splited into two pieces, we pretend LF is at the 
                 * previous one.
                 */
                if (buffer.charCodeAt(firstCharOffset) === CharCode.LineFeed) {
                    firstCharOffset++;
                    pieceLength--;
                }

                /**
                 * We refresh line buffer since we know there is a CRLF before 
                 * this piece.
                 */
                lines.push(currLineBuffer);
                currLineBuffer = '';
                danglingCarriageReturn = false;

                /**
                 * Meaning the current piece only contains a LF, we ignore this 
                 * piece to next one.
                 */
                if (pieceLength === 0) {
                    return;
                }
            }

            /**
             * The piece is just one single line, we stores this line and 
             * iterate next node.
             */
            if (piece.start.line === piece.end.line) {
                
                if (this._shouldBeNormalized === false && 
                    buffer.charCodeAt(firstCharOffset + pieceLength - 1) === CharCode.CarriageReturn
                ) {
                    /**
                     * The end of the piece contains a CR, it is possible that
                     * a CRLF got splited into two pieces, so we mark it as 
                     * dangling and ignore the CR character until next node.
                     */
                    danglingCarriageReturn = true;
                    currLineBuffer += buffer.substring(firstCharOffset, firstCharOffset + pieceLength - 1);
                } else {
                    currLineBuffer += buffer.substring(firstCharOffset, firstCharOffset + pieceLength);
                }
                
                return;
            }

            /**
             * Now the piece will contain mutiple lines. We need to use three
             * different stages to store these lines:
             *      - store the first line (partial)
             *      - store the middle lines (full)
             *      - store the last line (partial)
             */
            
            // save the first partial line
            if (this._shouldBeNormalized) {
                /**
                 * Since it's normalized, it guarantees the length of eol. Use
                 * Math.max() to guarrantee the range is valid.
                 */
                currLineBuffer += buffer.substring(firstCharOffset, Math.max(firstCharOffset, linestart[pieceStartLine + 1]! - this._normalizedEOL.length));
            } else {
                /**
                 * Since it's not normalized, we cannot ensure the length of eol,
                 * we need to manually remove them.
                 */
                currLineBuffer += buffer.substring(firstCharOffset, linestart[pieceStartLine + 1]!).replace(/(\r\n|\r|\n)$/, '');
            }
            lines.push(currLineBuffer);

            // save all the middle lines completely
            for (let line = pieceStartLine + 1; line < pieceEndLine; line++) {
                if (this._shouldBeNormalized) {
                    currLineBuffer = buffer.substring(linestart[line]!, linestart[line + 1]! - this._normalizedEOL.length);
                } else {
                    currLineBuffer = buffer.substring(linestart[line]!, linestart[line + 1]).replace(/(\r\n|\r|\n)$/, '');
                }

                lines.push(currLineBuffer);
            }

            /**
             * Saving the last partial line, we need to handle the possible 
             * dangling CR situation again.
             */
            const lastLineOffset = linestart[pieceEndLine]!;
            if (this._shouldBeNormalized === false &&
                buffer.charCodeAt(linestart[pieceEndLine]! + piece.end.offset - 1) === CharCode.CarriageReturn
            ) {
                danglingCarriageReturn = true;
                if (piece.end.offset === 0) {
                    /**
                     * The last line only has a CR, undo the push until the next
                     * node.
                     */
                    lines.pop();
                } else {
                    // ignore the CR
                    currLineBuffer = buffer.substring(lastLineOffset, lastLineOffset + piece.end.offset - 1);
                }
            } else {
                currLineBuffer = buffer.substring(lastLineOffset, lastLineOffset + piece.end.offset);
            }
            
            return;
        });

        if (danglingCarriageReturn) {
            lines.push(currLineBuffer);
            currLineBuffer = '';
        }

        lines.push(currLineBuffer);

        return lines;
    }

    public getRawContent(): string {
        let raw = '';

		this.forEach(node => {
			raw += this.__getNodeContent(node);
			return true;
		});

		return raw;
    }

    public getLine(): string {
        return '';
    }
    
    // [private helper methods - node]

    /**
     * @description Iteration the whole red-black tree in pre-order.
     * @param node The current node for iteration.
     * @param fn The function applies to each node.
     * 
     * @note This will not go through each {@link NULL_NODE}.
     */
    private __preOrder(node: Node, fn: (node: Node) => void): void {
        
        if (node === NULL_NODE) {
            return;
        }

        this.__preOrder(node.left, fn);
        fn(node);
        this.__preOrder(node.right, fn);
    }

    /**
     * @description Returns the absolute offset in the buffer.
     * @param bufferIndex The index of the buffer.
     * @param position The position of points to the location of the buffer.
     */
    private __absoluteOffsetInBuffer(bufferIndex: number, position: BufferPosition): number {
        const buffer = this._buffer[bufferIndex]!;
        return buffer.linestart[position.line]! + position.offset;
    }

    /**
     * @description Given the {@link Node}, returns the string which the node is
     * pointing at.
     */
    private __getNodeContent(node: Node): string {
        if (node === NULL_NODE) {
            return '';
        }
        const piece = node.piece;
        const buffer = this._buffer[piece.bufferIndex]!;

        const startOffset = this.__absoluteOffsetInBuffer(piece.bufferIndex, piece.start);
        const endOffset = this.__absoluteOffsetInBuffer(piece.bufferIndex, piece.end);
        return buffer.buffer.substring(startOffset, endOffset);
    }

    // [private helper methods - piece table]

    /**
     * @description Recalculates all the basic metadata of the whole tree (total 
     *  buffer length / total linefeed count).
     * 
     * @complexity O(h)
     */
    private __updateTableMetadata(): void {
        let node = this._root;

        let bufferLength = 0;
        let lfCount = 1;
        while (node !== NULL_NODE) {
            bufferLength += node.piece.bufferLength;
            lfCount += node.piece.lfCount;
            node = node.right;
        }

        this._bufferLength = bufferLength;
        this._lfCount = lfCount;
    }

    // [private helper methods - red-black tree]

    /**
     * @description Given a {@link Piece}, constructs a new {@link Node} and 
     * insert the new node as a successor to the given node.
     * @returns The created node.
     * 
     * @complexity O(h)
     */
    private __insertAsSuccessor(node: Node, piece: Piece): Node {
        const newnode = Node.create(piece, RBColor.RED);
        
        // empty tree
        if (this._root === NULL_NODE) {
            this._root = newnode;
            newnode.color = RBColor.BLACK;
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
        const newnode = Node.create(piece, RBColor.RED);

        // empty tree
        if (this._root === NULL_NODE) {
            this._root = newnode;
            newnode.color = RBColor.BLACK;
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

        while (node !== this._root && node.parent.color === RBColor.RED) {
            const parent = node.parent;

            if (parent === parent.parent.left) {
                const parentSibling = parent.parent.right;
                
                if (parentSibling.color === RBColor.RED) {
                    parent.color = RBColor.BLACK;
                    parentSibling.color = RBColor.BLACK;
                    parent.parent.color = RBColor.RED;
                    node = parent.parent;
                }  else {
                    if (node === parent.right) {
                        node = parent;
                        this.__leftRotateNode(node);
                    }

                    parent.color = RBColor.BLACK;
                    parent.parent.color = RBColor.RED;
                    this.__rightRotateNode(parent.parent);
                }
            }

            else {
                const parentSibling = parent.parent.left;

                if (parentSibling.color === RBColor.RED) {
                    parent.color = RBColor.BLACK;
                    parentSibling.color = RBColor.BLACK;
                    parent.parent.color = RBColor.RED;
                    node = parent.parent;
                } else {
                    if (node === parent.left) {
                        node = parent;
                        this.__rightRotateNode(node);
                    }

                    parent.color = RBColor.BLACK;
                    parent.parent.color = RBColor.RED;
                    this.__leftRotateNode(parent.parent);
                }
            }

        }
        
        this._root.color = RBColor.BLACK;
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