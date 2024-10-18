import { TokenEnum } from "src/editor/common/markdown";
import { EditorToken } from "src/editor/common/model";
import { ProseMarkSpec, ProseMarkType, ProseNodeSpec, ProseNodeType } from "src/editor/common/proseMirror";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { EditorSchema } from "src/editor/model/schema";

export interface IDocumentNode<TCtor, TSpec, TToken = EditorToken> {
    
    /**
     * Represents a corresponding markdown token type (original tokens parsed by 
     * Marked). It matches to {@link TokenEnum}.
     */
    readonly name: string;

    /**
     * The constructor to create a document node that represents this one. This
     * will be used during thr parsing state.
     * @warn The ctor will be valid only after the {@link EditorSchema} is 
     * created.
     */
    readonly ctor: TCtor;
    
    /**
     * Gets the schema of this document node. A schema likes a syntax for 
     * documents. It sets down which structures are valid for a document node.
     * 
     * @note The schema will be passed as arguments into {@link EditorSchema}.
     * @note The specific definition is by prosemirror. To see more details 
     * you may check {@link https://prosemirror.net/examples/schema/}.
     */
    getSchema(): TSpec;

    /**
     * @description Defines a function that decide how to parse the given token
     * during the parsing process. Each {@link IDocumentNode} will has its own
     * parsing rule.
     * @param state The parsing state, used to have full control over the 
     * parsing process.
     * @param token A markdown token that matches this document node type.
     */
    parseFromToken(state: IDocumentParseState, token: TToken): void;
}

abstract class DocumentNodeBase<TCtor, TSpec, TToken> implements IDocumentNode<TCtor, TSpec, TToken> {
    constructor(public readonly name: string) {}
    public declare readonly ctor: TCtor;
    public abstract getSchema(): TSpec;
    public abstract parseFromToken(state: IDocumentParseState, token: TToken): void;
}

/**
 * @class A document node that represents an actual node in the DOM.
 */
export abstract class DocumentNode<TToken> extends DocumentNodeBase<ProseNodeType, ProseNodeSpec, TToken> {}

/**
 * @class A document mark that represents a mark. Such as 'strong', 'emphasis',
 * 'link' and so on.
 */
export abstract class DocumentMark<TToken> extends DocumentNodeBase<ProseMarkType, ProseMarkSpec, TToken> {}
