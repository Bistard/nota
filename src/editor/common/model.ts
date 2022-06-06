import { IEditorPosition } from "src/editor/common/position";

export const enum EndOfLineType {
    /** 
     * Use line feed (\n) as the end of line character. 
     */
	LF = 1,
	/** 
     * Use carriage return and line feed (\r\n) as the end of line character. 
     */
	CRLF = 2
}

export const enum EndOfLine {
    LF = '\n',
    CRLF = '\r\n'
}

/**
 * For red-black tree usage.
 */
export const enum RBColor {
    BLACK = 1,
    RED = 2
}

/**
 * A data structure used for piece table.
 */
export interface ITextBuffer {
    /** The string buffer. */
    buffer: string;

    /** The array that contains all the linestarts in the buffer. */
    linestart: number[];
}

/**
 * An interface only for {@link TextBufferBuilder}.
 */
export interface ITextBufferBuilder {

    /**
     * @description Receives a string as a chunk inside the builder. It will 
     * read through the whole string to calculate the number of newlines.
     * @param chunk The string chunk.
     * 
     * @throws An exception will be thrown if the builder is either built or 
     * created.
     */
    receive(chunk: string): void;

    /**
     * @description The building process will finish the work of reciving chunks.
     * 
     * @throws An exception will be thrown if the caller builds twice.
     */
    build(): void;

    /**
     * @description Creates a new {@link IPieceTable} upon the received chunks.
     * @param normalizationEOL Replaces all the EOL in the buffers to:
     *                              - the most used EOL (more than half).
     *                              - provided `defaultEOL` if as the above 
     *                                stated.
     * @param defaultEOL Decides what type of {@link EndOfLineType} for either 
     *                   empty file or a file contains precisely one line.
     * @param force If force to replace all the link breaking with the 
     *              defaultEOL.
     * 
     * @default false normalizationEOL
     * @default EndOfLineType.LF defaultEOL
     * @default false force
     * 
     * @throws An exception will be thrown if the caller creates twice or did 
     * not build yet.
     */
    create(normalizationEOL?: boolean, defaultEOL?: EndOfLineType, force?: boolean): IPieceTable;
}

/**
 * Representing a position relatives to a buffer.
 */
export interface IBufferPosition extends IEditorPosition {}

/**
 * Representing a position relatives to a piece.
 */
export interface IPiecePosition extends IEditorPosition {}

/**
 * Internal data structure in {@link IPieceTable}.
 */
export interface IPiece {
    /** 
     * Which buffer the piece is refering in the whole table. 
     */
    readonly bufferIndex: number;

     /**
      * The length of the piece.
      */
    readonly pieceLength: number;
 
     /**
      * The linefeed counts of the corresponding buffer.
      */
    readonly lfCount: number;
 
     /** 
      * The start position of the piece in the corresponding buffer. 
      */
    readonly start: IBufferPosition;
 
     /** 
      * The end position of the piece in the corresponding buffer. 
      */
    readonly end: IBufferPosition;
}

/**
 * Internal red-black tree data structure used in {@link IPieceTable}.
 */
export interface IPieceNode {

    readonly color: RBColor;

    readonly parent: IPieceNode;
    readonly left: IPieceNode;
    readonly right: IPieceNode;

    readonly leftSubtreeBufferLength: number;
    readonly leftSubtreelfCount: number;

    readonly piece: IPiece;
}

/**
 * An interface only for {@link PieceTable}.
 */
export interface IPieceTable {

    /**
     * @description Inserts the given text at the given offset.
     * @param textOffset The character offset relatives to the whole text model.
     * @param text The text to be inserted.
     */
    insertAt(textOffset: number, text: string): void;

    /**
     * @description Deletes the text with given length at the given offset.
     * @param textOffset The character offset relatives to the whole text model.
     * @param length The length of text to be deleted.
     */
    deleteAt(textOffset: number, length: number): void;

    /**
     * @description Returns all the line contents (without line breaking).
     * @returns An array of string, each string represents a line content.
     */
    getContent(): string[];

    /**
     * @description Returns all the line contents in raw string.
     * @returns A string represents the raw text data (include link breaking).
     */
    getRawContent(): string;

    /**
     * @description Returns the line string of the corresponding line number.
     * @param lineNumber (zero-based) line number.
     */
    getLine(lineNumber: number): string;

    /**
     * @description Returns the raw line string of the corresponding line number.
     * @param lineNumber (zero-based) line number.
     */
    getRawLine(lineNumber: number): string;

    /**
     * @description Returns the total text length of all the buffers.
     */
    getBufferLength(): number;

    /**
     * @description Returns the total line counts.
     */
    getLineCount(): number;

    /**
     * @description Returns the character offset.
     * @param lineNumber (zero-based) line number.
     * @param lineOffset The offset relative to the line.
     * @returns The character offset relatives to the whole text model.
     */
    getOffsetAt(lineNumber: number, lineOffset: number): number;

    /**
     * @description Returns the character position.
     * @param textOffset The character offset relatives to the whole text model.
     * @returns A {@link IEditorPosition}.
     */
    getPositionAt(textOffset: number): IEditorPosition;

    /**
     * @description Iterate each tree node in pre-order.
     * @param fn The callback function to apply to each node.
     */
    forEach(fn: (node: IPieceNode) => void): void;

}