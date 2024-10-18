import * as marked from "marked";
import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ILogEvent } from "src/base/common/logger";
import { ProseEditorState } from "src/editor/common/proseMirror";
import { AsyncResult } from "src/base/common/result";
import { IEditorExtension } from "src/editor/common/extension/editorExtension";
import { EditorSchema } from "src/editor/model/schema";

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
     * The source of the model.
     */
    readonly source: URI;

    readonly schema: EditorSchema;

    /**
     * The state of the model.
     */
    readonly state?: ProseEditorState;

    /**
     * Fires when a log is about happen.
     */
    readonly onLog: Register<ILogEvent>;

    /** 
     * Fires when the model is built.
     */
    readonly onDidBuild: Register<ProseEditorState>;

    /**
     * @description Start building the model.
     * @note This will trigger `onDidBuild` event.
     */
    build(extensions: IEditorExtension[]): AsyncResult<ProseEditorState, Error>;

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
    // getLineCount(): number;

    /**
     * @description Returns the content of the line with the given line number.
     * @param lineNumber line number (zero-based).
     */
    // getLine(lineNumber: number): string;

    /**
     * @description Returns the length of the line with the given line number.
     * @param lineNumber line number (zero-based).
     */
    // getLineLength(lineNumber: number): number;
}

/**
 * The option for {@link EditorModel}.
 */
export interface IEditorModelOptions {

    /**
     * A prefix URI for any relative link token.
     */
    baseURI?: string;

    /**
     * Determine if the editor is writable. If false, it means the file is 
     * readonly.
     */
    readonly writable: boolean;
}
