import { Disposable, IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { IEditorPosition } from "src/editor/common/position";
import { IEditorRange } from "src/editor/common/range";
import { marked } from "src/editor/model/markdown/marked/marked";

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
     * @description Creates a new {@link IPieceTableModel} upon the received chunks.
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
    create(normalizationEOL?: boolean, defaultEOL?: EndOfLineType, force?: boolean): IPieceTableModel;
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
      * The end position of the piece in the corresponding buffer (not included).
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
 * Describing a position of a {@link IPieceNode} in the {@link IPieceTable}.
 */
export interface IPieceNodePosition {

    /**
     * Corresponding piece.
     */
    readonly node: IPieceNode;

    /**
     * The start offset of the piece relatives to the whole text model.
     */
    readonly textOffset: number;
}

/**
 * An interface only for {@link PieceTable}.
 */
export interface IPieceTable {

    /**
     * The root of the piece table.
     */
    readonly root: IPieceNode;

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
     * @complexity O(n), length of the text model.
     */
    getContent(): string[];

    /**
     * @description Returns all the line contents in raw string.
     * @returns A string represents the raw text data (include link breaking).
     * @complexity O(n), length of the text model.
     */
    getRawContent(): string;

    /**
     * @description Returns the line string of the corresponding line number (
     * not include line breaking).
     * @param lineNumber (zero-based) line number.
     * @complexity O(h)
     */
    getLine(lineNumber: number): string;

    /**
     * @description Returns the raw line string of the corresponding line number
     * (include line breaking).
     * @param lineNumber (zero-based) line number.
     * @complexity O(h)
     */
    getRawLine(lineNumber: number): string;

    /**
     * @description Returns the line length of the corresponding line number (
     * include line breaking).
     * @param lineNumber (zero-based) line number.
     * @complexity O(h)
     */
    getLineLength(lineNumber: number): number;

    /**
     * @description Returns the raw line length of the corresponding line number
     * (include line breaking).
     * @param lineNumber (zero-based) line number.
     * @complexity O(h)
     */
    getRawLineLength(lineNumber: number): number;

    /**
     * @description Returns the total text length of all the buffers.
     * @complexity O(1)
     */
    getBufferLength(): number;

    /**
     * @description Returns the total line counts.
     * @complexity O(1)
     */
    getLineCount(): number;

    /**
     * @description Returns the character offset.
     * @param lineNumber (zero-based) line number.
     * @param lineOffset The offset relative to the line.
     * @returns The character offset relatives to the whole text model.
     * @complexity O(h)
     */
    getOffsetAt(lineNumber: number, lineOffset: number): number;

    /**
     * @description Returns the character position.
     * @param textOffset The character offset relatives to the whole text model.
     * @returns A {@link IEditorPosition}.
     * @complexity O(h)
     */
    getPositionAt(textOffset: number): IEditorPosition;

    /**
     * @description Returns the charcode at the given text offset.
     * @param textOffset The character offset relatives to the whole text model.
     * @complexity O(h)
     */
    getCharcodeByOffset(textOffset: number): number;

    /**
     * @description Returns the charcode at the given line number and line offset.
     * @param lineNumber (zero-based) line number.
     * @param lineOffset The offset relative to the line.
     * @complexity O(h)
     */
    getCharcodeByLine(lineNumber: number, lineOffset: number): number;

    /**
     * @description Iterate each tree node in pre-order.
     * @param fn The callback function to apply to each node.
     * @complexity O(n), n - number of pieces in the table.
     */
    forEach(fn: (node: IPieceNode) => void): void;

}

/**
 * An interface only for {@link PieceTableModel}.
 */
export interface IPieceTableModel extends Omit<IPieceTable, 'root'>, Disposable {

    /**
     * Fires when the content is changed.
     */
    onDidChangeContent: Register<void>;

    /**
     * @description Returns the a instance of {@link IPieceTable}.
     */
    getPieceTable(): IPieceTable;

    /**
     * @description Apply edit operations to the piece table model.
     * @param operations The raw edit operations.
     */
    // edit(operations: IEditOperation[]): IApplyEditResult;
}

export interface IEditOperation {

    /**
     * The range to replace. This can be empty to emulate a simple insert.
     */
    readonly range: IEditorRange;

    /**
     * The text to be replaced with. This can be empty to emulate a simple delete.
     */
    readonly text: string;
}


export type EditorToken = marked.Token;
export type EditorTokenGeneric = marked.Tokens.Generic;
export namespace EditorTokens {
    export type Space = marked.Tokens.Space;
    export type CodeBlock = marked.Tokens.Code;
    export type Heading = marked.Tokens.Heading;
    export type Table = marked.Tokens.Table;
    export type TableCell = marked.Tokens.TableCell;
    export type Hr = marked.Tokens.Hr;
    export type Blockquote = marked.Tokens.Blockquote;
    export type List = marked.Tokens.List;
    export type ListItem = marked.Tokens.ListItem;
    export type Paragraph = marked.Tokens.Paragraph;
    export type HTML = marked.Tokens.HTML;
    export type Text = marked.Tokens.Text;
    export type Def = marked.Tokens.Def;
    export type Escape = marked.Tokens.Escape;
    export type Tag = marked.Tokens.Tag;
    export type Link = marked.Tokens.Link;
    export type Image = marked.Tokens.Image;
    export type Strong = marked.Tokens.Strong;
    export type Em = marked.Tokens.Em;
    export type Codespan = marked.Tokens.Codespan;
    export type Br = marked.Tokens.Br;
    export type Del = marked.Tokens.Del;
    export type Generic = marked.Tokens.Generic;
}

/**
 * An interface only for {@link EditorModel}.
 */
export interface IEditorModel extends IDisposable {

    /**
     * The source of the text model.
     */
    readonly source: URI;

    /** 
     * Fires when the model is built or rebuilt whether successed or failed.
     */
    readonly onDidBuild: Register<boolean>;

    /**
     * @description Start building the model.
     * @note This will trigger `onDidBuild` event.
     */
    build(): Promise<void>;

    /**
     * @description Replace the entire model with the new provided URI.
     * @param source The new source in URI form.
     * @note This will trigger `onDidBuild` event.
     */
    replaceWith(source: URI): Promise<void>;

    /**
     * @description Returns all the lines of the model.
     */
    getContent(): string[];

    /**
     * @description Returns the raw content of the model.
     */
    getRawContent(): string;

    /**
     * @description Returns the number of lines in the model.
     */
    getLineCount(): number;

    /**
     * @description Returns the content of the line with the given line number.
     * @param lineNumber line number (zero-based).
     */
    getLine(lineNumber: number): string;

    /**
     * @description Returns the length of the line with the given line number.
     * @param lineNumber line number (zero-based).
     */
    getLineLength(lineNumber: number): number;

    /**
     * @description Inspect the current markdown tokens that is parsed by the
     * lexer.
     */
    getTokens(): EditorToken[];

    /**
     * @description Invokes only when the applicaion is about to quit. Should
     * invoked and decided by the eidtor itself.
     */
    onQuit(): void;
}

export namespace IModelEvent {

    export interface ContentChange {

    }

}