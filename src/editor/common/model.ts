
export const enum EndOfLineType {
    /** Use line feed (\n) as the end of line character. */
	LF = 1,
	/** Use carriage return and line feed (\r\n) as the end of line character. */
	CRLF = 2
}

export const enum EndOfLine {
    LF = `\n`,
    CRLF = `\r\n`
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
     * @description Receives a string as a chunk inside the builder. It will read
     * through the whole string to calculate the number of newlines.
     * @param chunk The string chunk.
     * 
     * @throws An exception will be thrown if the builder is either built or created.
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
     * @param defaultEOL Decides what type of {@link EndOfLineType} for either 
     *                   empty file or a file contains precisely one line.
     * @param normalizationEOL Replaces all the EOL in the buffers to:
     *                              - the most used EOL (more than half).
     *                              - provided `defaultEOL` if as the above stated.
     * 
     * @throws An exception will be thrown if the caller creates twice or not 
     * built yet.
     */
    create(defaultEOL: EndOfLineType, normalizationEOL: boolean): IPieceTable;
}

/**
 * Representing a contiguous section inside a buffer.
 */
export interface BufferPosition {
    
    /**
     * The line number in the current buffer.
     */
    line: number;

    /**
     * The character offset in the current line.
     */
    offset: number;
}

export interface IPiece {
    /** 
     * Which buffer the piece is refering in the whole table. 
     */
    readonly bufferIndex: number;

     /**
      * The length of the corresponding buffer.
      */
    readonly bufferLength: number;
 
     /**
      * The linefeed counts of the corresponding buffer.
      */
    readonly lfCount: number;
 
     /** 
      * The start position of the piece in the corresponding buffer. 
      */
    readonly start: BufferPosition;
 
     /** 
      * The end position of the piece in the corresponding buffer. 
      */
    readonly end: BufferPosition;
}

export interface IPieceTableNode {

    readonly color: RBColor;

    readonly parent: IPieceTableNode;
    readonly left: IPieceTableNode;
    readonly right: IPieceTableNode;

    readonly leftSubtreeBufferLength: number;
    readonly leftSubtreelfCount: number;

    readonly piece: IPiece;
}

/**
 * An interface only for {@link PieceTable}.
 */
export interface IPieceTable {

    getLines(): string[];

    getLine(): string;

    // forEach(fn: (node: Node) => void): void

}