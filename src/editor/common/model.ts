import * as marked from "marked";
import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ProseEditorState, ProseTransaction } from "src/editor/common/proseMirror";
import { AsyncResult } from "src/base/common/result";
import { IEditorExtension } from "src/editor/common/editorExtension";
import { EditorSchema } from "src/editor/model/schema";
import { IEditorPosition } from "src/editor/common/position";
import { IOnDidContentChangeEvent } from "src/editor/view/proseEventBroadcaster";

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
    export type InlineHTML = marked.Tokens.HTML;
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
     * The source of the model.
     */
    readonly source: URI;

    /**
     * Indicates if the file has unsaved changes.
     */
    readonly dirty: boolean;

    /**
     * The schema of the editor.
     */
    readonly schema: EditorSchema;

    /**
     * The state of the model. Returns undefined if the model is not ready yet.
     */
    readonly state?: ProseEditorState;

    /** 
     * Fires when the model is built for the first time.
     */
    readonly onDidBuild: Register<ProseEditorState>;

    /**
     * Fires whenever the file is saved back to the disk successfully.
     */
    readonly onDidSave: Register<void>;
    
    /**
     * Fires whenever the process of saving file encounters an error. The 
     * operation fails.
     */
    readonly onDidSaveError: Register<unknown>;

    /**
     * Fires whenever the working file is dirty or not. True means the file is 
     * turning to dirty, false if not.
     */
    readonly onDidDirtyChange: Register<boolean>;

    /**
     * Fires whenever a transaction to the {@link ProseEditorState} is made 
     * programmatically.
     */
    readonly onTransaction: Register<ProseTransaction>;

    /**
     * Fires whenever the state of the view is updated.
     */
    readonly onDidStateChange: Register<void>;

    /**
     * @description Start building the model.
     * @note This will trigger `onDidBuild` event.
     */
    build(extensions: IEditorExtension[]): AsyncResult<ProseEditorState, Error>;

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
     * @description Returns the raw content of the model (include link breaking).
     * @returns A string represents the raw text data.
     */
    getRawContent(): string;

    /**
     * @description Returns the line string of the corresponding line number (
     * not include line breaking).
     * @param lineNumber (zero-based) line number.
     */
    getLine(lineNumber: number): string;

    /**
     * @description Returns the raw line string of the corresponding line number
     * (include line breaking).
     * @param lineNumber (zero-based) line number.
     */
    getRawLine(lineNumber: number): string;

    /**
     * @description Returns the line length of the corresponding line number (
     * include line breaking).
     * @param lineNumber (zero-based) line number.
     */
    getLineLength(lineNumber: number): number;

    /**
     * @description Returns the raw line length of the corresponding line number
     * (include line breaking).
     * @param lineNumber (zero-based) line number.
     */
    getRawLineLength(lineNumber: number): number;

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
     * @description Returns the char-code at the given text offset.
     * @param textOffset The character offset relatives to the whole text model.
     */
    getCharCodeByOffset(textOffset: number): number;

    /**
     * @description Returns the char-code at the given line number and line offset.
     * @param lineNumber (zero-based) line number.
     * @param lineOffset The offset relative to the line.
     */
    getCharCodeByLine(lineNumber: number, lineOffset: number): number;

    /**
     * @description Save the text model into the disk.
     */
    save(): AsyncResult<void, Error>;

    // internal

    __onDidStateChange(event: IOnDidContentChangeEvent): void;
}
