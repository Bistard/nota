import { CharCode } from "src/base/common/util/char";
import { EndOfLine, IBufferPosition, IPiece, IPiecePosition, IPieceTable, IPieceNode, RBColor } from "src/editor/common/model";
import { EditorPosition, IEditorPosition } from "src/editor/common/position";
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
    public readonly pieceLength: number;
    public readonly lfCount: number;
    public readonly start: IBufferPosition;
    public readonly end: IBufferPosition;

    constructor(bufferIndex: number, pieceLength: number, lfCount: number, start: IBufferPosition, end: IBufferPosition) {
        this.bufferIndex = bufferIndex;
        this.pieceLength = pieceLength;
        this.lfCount = lfCount;
        this.start = start;
        this.end = end;
    }
}

/**
 * @internal
 * @class A tree node used in {@link PieceTable}.
 * 
 * @note Note that the constructor will not point the parent / left / right all 
 * to the {@link NULL_NODE}. Use static method `create()` instead.
 */
class PieceNode implements IPieceNode {

    // [field]

    public color: RBColor;

    public parent: PieceNode;
    public left: PieceNode;
    public right: PieceNode;

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

    public static create(piece: Piece, color: RBColor): PieceNode {
        const newnode = new PieceNode(piece, color);
        newnode.parent = NULL_NODE;
        newnode.left = NULL_NODE;
        newnode.right = NULL_NODE;
        return newnode;
    }

    // [public methods]

    /**
     * @description Returns the next node of the current node (pre-order). If not
     * found, {@link NULL_NODE} will be returned.
     */
    public static next(node: PieceNode): PieceNode {
        if (node.right !== NULL_NODE) {
			const leftMost = PieceNode.leftMost(node.right);
            return leftMost === NULL_NODE ? node.right : leftMost;
		}

		while (node.parent !== NULL_NODE) {
			if (node.parent.left === node) {
				break;
			}
			node = node.parent;
		}

		if (node.parent === NULL_NODE) {
			return NULL_NODE;
		}
        return node.parent;
    }

    /**
     * @description Returns the left most tree node of the given node. 
     * @note If the given node is {@link NULL_NODE} or has no left-subtree, a
     * {@link NULL_NODE} will be returned.
     * 
     * @complexity O(h)
     */
    public static leftMost(node: PieceNode): PieceNode {
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
    public static rightMost(node: PieceNode): PieceNode {
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
    public static totalBufferLength(node: PieceNode): number {
        if (node === NULL_NODE) {
            return 0;
        }
        return node.leftSubtreeBufferLength + node.piece.pieceLength + PieceNode.totalBufferLength(node.right);
    }

    /**
     * @description Calculates the total linefeed count of the given node. Includes
     * its left-subtree, right-subtree and its own linefeed count.
     * 
     * @complexity O(h)
     */
    public static totalLinefeedCount(node: PieceNode): number {
        if (node === NULL_NODE) {
            return 0;
        }
        return node.leftSubtreelfCount + node.piece.pieceLength + PieceNode.totalLinefeedCount(node.right);
    }

}

/** 
 * @internal
 * The null node as a leaf.
 */
const NULL_NODE = new PieceNode(null!, RBColor.BLACK);
NULL_NODE.parent = NULL_NODE;
NULL_NODE.left = NULL_NODE;
NULL_NODE.right = NULL_NODE;

/**
 * @class A {@link PieceTable} is an efficient data structure for fast text
 * editing which is commonly used in a text editor.
 * 
 * I. Insertion and deletion are extremly fast in this data structure.
 * 
 * II. Using a single string to represent `original` and `added` may hurts the
 * performance in some circustances:
 *      1. V8 engine did not support string length over 256MB back in time.
 *      2. String concatenation is stupid.
 * Instead, every time when the program reads a chunk, say 256KB per time, it 
 * will be stored directly into a {@link TextBuffer} and create a {@link PieceNode} 
 * points to it.
 * 
 * III. When creating a {@link TextBuffer}, program will read through the buffer
 * and count all the linefeeds for later fast querying by line numbers. Since 
 * each {@link TextBuffer} is readonly, the performance cost is worthy.
 * 
 * IV. The whole class is built upon a red-black tree. Unlike the basic ones, 
 * each {@link PieceNode} also maintains the left-subtree total buffer length and the
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

    private _root: PieceNode;

    private _bufferLength: number;
    private _lineFeedCount: number;

    private _shouldBeNormalized: boolean;
    private _normalizedEOL: EndOfLine;

    // [constructor]

    constructor(chunks: TextBuffer[], shouldBeNormalized: boolean, normalizedEOL: EndOfLine) {
        this._buffer = [new TextBuffer('', [0])];
        this._root = NULL_NODE;
        this._bufferLength = 0;
        this._lineFeedCount = 1;
        this._shouldBeNormalized = shouldBeNormalized;
        this._normalizedEOL = normalizedEOL;
        
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
                linestart.length - 1, { 
                    lineNumber: 0, 
                    lineOffset: 0 
                }, { 
                    lineNumber: linestart.length - 1, 
                    lineOffset: buffer.length - linestart[linestart.length - 1]!
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
    public forEach(fn: (node: PieceNode) => void): void {
        this.__preOrder(this._root, fn);
    }

    // [public methods - piece table]

    // TODO
    public insertAt(textOffset: number, text: string): void {
        
    }

    // TODO
    public deleteAt(textOffset: number, length: number): void {
        
    }

    public getContent(): string[] {
        
        // these lines will not contain any CR / LF / CRLF.
        const lines: string[] = [];
        let currLineBuffer = '';
        let danglingCarriageReturn = false;

        this.forEach(node => {

            const piece = node.piece;
            let pieceLength = piece.pieceLength;
            
            if (pieceLength === 0) {
                return;
            }
            
            const buffer = this._buffer[piece.bufferIndex]!.buffer;
            const linestart = this._buffer[piece.bufferIndex]!.linestart;

            const pieceStartLine = piece.start.lineNumber;
            const pieceEndLine = piece.end.lineNumber;
            
            // the first character offset of the piece
            let firstCharOffset = linestart[piece.start.lineNumber]! + piece.start.lineOffset;

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
            if (piece.start.lineNumber === piece.end.lineNumber) {
                
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
                buffer.charCodeAt(linestart[pieceEndLine]! + piece.end.lineOffset - 1) === CharCode.CarriageReturn
            ) {
                danglingCarriageReturn = true;
                if (piece.end.lineOffset === 0) {
                    /**
                     * The last line only has a CR, undo the push until the next
                     * node.
                     */
                    lines.pop();
                } else {
                    // ignore the CR
                    currLineBuffer = buffer.substring(lastLineOffset, lastLineOffset + piece.end.lineOffset - 1);
                }
            } else {
                currLineBuffer = buffer.substring(lastLineOffset, lastLineOffset + piece.end.lineOffset);
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
		});

		return raw;
    }

    public getLine(lineNumber: number): string {
        let line: string;
        if (this._shouldBeNormalized) {
            line = this.__getRawLine(lineNumber, this._normalizedEOL.length);
        } else {
            line = this.__getRawLine(lineNumber).replace(/(\r\n|\r|\n)$/, '');
        }
        return line;
    }

    public getRawLine(lineNumber: number): string {
        return this.__getRawLine(lineNumber, 0);
    }

    public getBufferLength(): number {
        return this._bufferLength;
    }

    public getLineCount(): number {
        return this._lineFeedCount;
    }

    public getOffsetAt(lineNumber: number, lineOffset: number): number {

        let offset = 0;
        let node = this._root;
        
        while (node !== NULL_NODE) {
            // left piece may has partial content of the required line
            if (node.left !== NULL_NODE && node.leftSubtreelfCount >= lineNumber) {
                node = node.left;
            } 
            // current piece has the required line
            else if (node.piece.lfCount >= lineNumber - node.leftSubtreelfCount) {
                lineNumber -= node.leftSubtreelfCount;
                const piece = node.piece;
                const linestart = this._buffer[piece.bufferIndex]!.linestart;
                const desiredLineStartOffset = linestart[lineNumber]!;
                const pieceStartOffset = this.__getOffsetInBufferAt(piece.bufferIndex, piece.start);
                const desiredBufferOffset = pieceStartOffset + desiredLineStartOffset;
                offset += node.leftSubtreeBufferLength + desiredBufferOffset + lineOffset;
                return offset;
            } 
            // go right
            else {
                lineNumber -= (node.leftSubtreelfCount + node.piece.lfCount);
                offset += (node.leftSubtreeBufferLength + node.piece.pieceLength);
                node = node.right;
            }
        }

        return offset;
    }

    public getPositionAt(textOffset: number): IEditorPosition {
        
        let node = this._root;
        let lineNumber = 0;
        const initTextOffset = textOffset;

        while (node !== NULL_NODE) {
            // left piece has enough buffer length for the required text offset.
            if (node.leftSubtreeBufferLength >= textOffset) {
                node = node.left;
            }
            // current piece has enough buffer length for the required text offset.
            else if (node.piece.pieceLength >= textOffset - node.leftSubtreeBufferLength) {
                const pieceOffset = textOffset - node.leftSubtreeBufferLength;
                const position = this.__getPositionInPieceAt(node.piece, pieceOffset);
                lineNumber += node.leftSubtreelfCount + position.lineNumber;
                
                if (position.lineNumber === 0) {
                    const lineStartOffset = this.getOffsetAt(lineNumber, 0);
                    const lineOffset = initTextOffset - lineStartOffset;
                    return new EditorPosition(lineNumber, lineOffset);
                }
                
                return new EditorPosition(lineNumber, position.lineOffset);
            }
            // go right
            else {
                textOffset -= node.leftSubtreeBufferLength + node.piece.pieceLength;
                lineNumber += node.leftSubtreelfCount + node.piece.lfCount;

                /**
                 * The provided offset exceeds the total buffer length, we 
                 * return the maximum offset for robustness.
                 */
                if (node.right === NULL_NODE) {
                    const lineStartOffset = this.getOffsetAt(lineNumber, 1);
                    const lineOffset = initTextOffset - textOffset - lineStartOffset;
                    return new EditorPosition(lineNumber, lineOffset);
                }

                node = node.right;
            }
        }
        
        // reach the left-most node
        return new EditorPosition(0, 0);
    }
    
    // [private helper methods - node]

    /**
     * @description Iteration the whole red-black tree in pre-order.
     * @param node The current node for iteration.
     * @param fn The function applies to each node.
     * 
     * @note This will not go through each {@link NULL_NODE}.
     */
    private __preOrder(node: PieceNode, fn: (node: PieceNode) => void): void {
        
        if (node === NULL_NODE) {
            return;
        }

        this.__preOrder(node.left, fn);
        fn(node);
        this.__preOrder(node.right, fn);
    }

    /**
     * @description Returns the relative offset in the buffer.
     * @param bufferIndex The index of the buffer.
     * @param position The position of points to the location of the buffer.
     */
    private __getOffsetInBufferAt(bufferIndex: number, position: IBufferPosition): number {
        const buffer = this._buffer[bufferIndex]!;
        return buffer.linestart[position.lineNumber]! + position.lineOffset;
    }

    /**
     * @description Given the {@link PieceNode}, returns the string which the node is
     * pointing at.
     */
    private __getNodeContent(node: PieceNode): string {
        if (node === NULL_NODE) {
            return '';
        }
        const piece = node.piece;
        const buffer = this._buffer[piece.bufferIndex]!;

        const startOffset = this.__getOffsetInBufferAt(piece.bufferIndex, piece.start);
        const endOffset = this.__getOffsetInBufferAt(piece.bufferIndex, piece.end);
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

        let pieceLength = 0;
        let lfCount = 1;
        while (node !== NULL_NODE) {
            pieceLength += node.leftSubtreeBufferLength + node.piece.pieceLength;
            lfCount += node.leftSubtreelfCount + node.piece.lfCount;
            node = node.right;
        }

        this._bufferLength = pieceLength;
        this._lineFeedCount = lfCount;
    }

    // [private helper methods - red-black tree]

    /**
     * @description Given a {@link Piece}, constructs a new {@link PieceNode} and 
     * insert the new node as a successor to the given node.
     * @returns The created node.
     * 
     * @complexity O(h)
     */
    private __insertAsSuccessor(node: PieceNode, piece: Piece): PieceNode {
        const newnode = PieceNode.create(piece, RBColor.RED);
        
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
            const successor = PieceNode.leftMost(node.right);
            successor.left = newnode;
            newnode.parent = successor;
        }

        this.__fixAfterInsertion(newnode);
        return newnode;
    }

    /**
     * @description Given a {@link Piece}, constructs a new {@link PieceNode} and 
     * insert the new node as a predecessor to the given node.
     * @returns The created node.
     * 
     * @complexity O(h)
     */
    private __insertAsPredecessor(node: PieceNode, piece: Piece): PieceNode {
        const newnode = PieceNode.create(piece, RBColor.RED);

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
            const predecessor = PieceNode.rightMost(node.left);
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
    private __fixAfterInsertion(node: PieceNode): void {
        
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
    private __updatePieceMetadata(node: PieceNode): void {
        if (node === this._root) {
            return;
        }

        /**
         * Since each {@link PieceNode} only maintains its left-subtree metadata, 
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
        const lengthDelta = PieceNode.totalBufferLength(node.left) - node.leftSubtreeBufferLength;
        const lfDelta = PieceNode.totalLinefeedCount(node.left) - node.leftSubtreelfCount;
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
    private __leftRotateNode(node: PieceNode): void {
        
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
        rightNode.leftSubtreeBufferLength += node.leftSubtreeBufferLength + node.piece.pieceLength;
        rightNode.leftSubtreelfCount += node.leftSubtreelfCount + node.piece.lfCount;
    }

    /**
     * @description Right rotates the given node to balance the red-black tree.
     * @param node The given node.
     * 
     * @note Rotation will automatically updates piece metadata as well.
     * @complexity O(1)
     */
    private __rightRotateNode(node: PieceNode): void {
        
        const leftNode = node.left;
        node.left = leftNode.right;

        if (leftNode.right !== NULL_NODE) {
            leftNode.right.parent = node;
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
        node.leftSubtreeBufferLength -= leftNode.leftSubtreeBufferLength + leftNode.piece.pieceLength;
        node.leftSubtreelfCount -= leftNode.leftSubtreelfCount + leftNode.piece.lfCount;
    }

    /**
     * @description A auxliary function for `getRawLine`.
     * @param lineNumber The line number (zero-based).
     * @param eolLength The length of the linefeed.
     */
    private __getRawLine(lineNumber: number, eolLength: number = 0): string {
        if (lineNumber < 0 || lineNumber >= this._lineFeedCount) {
            return '';
        }

        let node = this._root;
        let lineBuffer = '';
        
        while (node !== NULL_NODE) {

            /**
             * desired line is either: 
             *      - entirely before the current piece
             *      - OR has partial content before the current peice
             */
            if (node.left !== NULL_NODE && node.leftSubtreelfCount >= lineNumber) {
                node = node.left;
            }
            // desired line is within the current piece
            else if (node.piece.lfCount > lineNumber - node.leftSubtreelfCount) {
                const piece = node.piece;
                const { buffer, linestart } = this._buffer[piece.bufferIndex]!;
                const pieceStartOffset = this.__getOffsetInBufferAt(piece.bufferIndex, piece.start);

                lineNumber -= node.leftSubtreelfCount;

                const desiredLineStartOffset = linestart[lineNumber]!;
                const desiredBufferOffset = pieceStartOffset + desiredLineStartOffset;
                const lineLength = linestart[lineNumber + 1]! - desiredLineStartOffset;
                
                return buffer.substring(
                    desiredBufferOffset, 
                    desiredBufferOffset + lineLength - eolLength
                );
            }
            // desired line has parital content at the end of the current piece (could be empty)
            else if (node.piece.lfCount === lineNumber - node.leftSubtreelfCount) {
                const piece = node.piece;
                const { buffer, linestart } = this._buffer[piece.bufferIndex]!;
                const pieceStartOffset = this.__getOffsetInBufferAt(piece.bufferIndex, piece.start);
                
                lineNumber -= node.leftSubtreelfCount;

                const desiredLineStartOffset = linestart[lineNumber]!;
                const desiredBufferOffset = pieceStartOffset + desiredLineStartOffset;
                
                lineBuffer = buffer.substring(
                    desiredBufferOffset,
                    desiredBufferOffset + node.piece.pieceLength
                );
                break;
            } 
            // desired line is after the current piece
            else {
                lineNumber -= (node.leftSubtreelfCount + node.piece.lfCount);
                node = node.right;
            }
        }

        /**
         * Reaching here means the required line is at the end of a piece. To
         * get a complete line, We need to find the next piece which has at 
         * least one linefeed.
         */

        node = PieceNode.next(node);
        while (node !== NULL_NODE) {
            const piece = node.piece;
            const { buffer, linestart } = this._buffer[node.piece.bufferIndex]!;
            const pieceStartOffset = this.__getOffsetInBufferAt(piece.bufferIndex, piece.start);

            if (piece.lfCount) {
                const lineLength = linestart[1]! - linestart[0]!;
                lineBuffer += buffer.substring(
                    pieceStartOffset, 
                    pieceStartOffset + lineLength - eolLength
                );
                return lineBuffer;
            } else {    
                lineBuffer += buffer.substring(
                    pieceStartOffset, 
                    pieceStartOffset + piece.pieceLength
                );
            }

            node = PieceNode.next(node);
        }

        return lineBuffer;
    }

    /**
     * @description Given a piece, returns a {@link IBufferPosition} describes
     * the given piece offset where the location is relatives to the buffer.
     * @param piece The given piece.
     * @param pieceOffset The offset relatives to the piece.
     */
    private __getPositionInBufferAt(piece: IPiece, pieceOffset: number): IBufferPosition {
        const linestart = this._buffer[piece.bufferIndex]!.linestart;
        
        const pieceStartOffsetInBuffer = linestart[piece.start.lineNumber]! + piece.start.lineOffset;
        const desiredOffset = pieceStartOffsetInBuffer + pieceOffset;

        /**
         * Using binary search to search for the line that contains the current 
         * offset in the current piece.
         */

        let low = piece.start.lineNumber;
        let high = piece.end.lineNumber;
        let mid = 0;

        let midStartLineOffset = 0;
        let midEndLineOffset = 0;

        while (low <= high) {
            mid = Math.floor((low + high) / 2);

            midStartLineOffset = linestart[mid]!;
            
            // reaching the end of the current piece
            if (mid === high) {
                break;
            }

            midEndLineOffset = linestart[mid + 1]!;

            if (desiredOffset < midStartLineOffset) {
                high = mid - 1;
            } else if (desiredOffset >= midEndLineOffset) {
                low = mid + 1;
            } else {
                // found it
                break;
            }
        }

        return {
            lineNumber: mid,
            lineOffset: desiredOffset - midStartLineOffset
        };
    }

    /**
     * @description Given a piece, returns a {@link IPiecePosition} describes
     * the given piece offset where the location is relatives to the piece.
     * @param piece The given {@link IPiece}.
     * @param pieceOffset The offset relatives to the piece.
     */
    private __getPositionInPieceAt(piece: IPiece, pieceOffset: number): IPiecePosition {
        
        const { 
            lineNumber: lineNumberInPiece, 
            lineOffset: lineOffsetInPiece 
        } = this.__getPositionInBufferAt(piece, pieceOffset);

        const lineIndexInPiece = lineNumberInPiece - piece.start.lineNumber;

        return {
            lineNumber: lineIndexInPiece,
            lineOffset: lineOffsetInPiece
        };
    }
}