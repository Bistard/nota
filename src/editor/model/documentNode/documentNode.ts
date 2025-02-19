import { TokenEnum } from "src/editor/common/markdown";
import { EditorToken } from "src/editor/common/model";
import { ProseMark, ProseMarkSpec, ProseMarkType, ProseNode, ProseNodeSpec, ProseNodeType } from "src/editor/common/proseMirror";
import { IDocumentParseState } from "src/editor/model/parser";
import { EditorSchema } from "src/editor/model/schema";
import { IDocumentMarkSerializationOptions, Serializer } from "src/editor/model/serializer";

export interface IParseTokenStatus<TToken = EditorToken> {
    
    /**
     * The current level of parsing.
     */
    readonly level: number;

    /** 
     * The markdown token that matches this document node type. 
     */
    readonly token: TToken;
    
    /** 
     * The parent token of the current token. `Null` means there is no parents. 
     */
    readonly parent: EditorToken | null;
    
    /** 
     * Is the current token the first token in its parent token 
     */
    readonly isFirstToken: boolean;
    
    /** 
     * Is the current token the last token in its parent token. 
     */
    readonly isLastToken: boolean;

    /**
     * The previous parsed token. (only refers to the same level token)
     */
    readonly prev?: EditorToken;

    /**
     * The next token that is about to parse. (only refers to the same level token)
     */
    readonly next?: EditorToken;
}

export interface IDocumentNode<TCtor, TSpec, TToken = EditorToken, TNode extends ProseNode | ProseMark = ProseNode | ProseMark> {
    
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
     * 
     */
    parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<TToken>): void;

    /**
     * An option that defines how the serialization behavior of {@link DocumentMark}.
     */
    readonly serializer: TNode extends ProseMark ? IDocumentMarkSerializationOptions : Serializer<TNode, void>;
}

abstract class DocumentNodeBase<TCtor, TSpec, TToken, TNode extends ProseNode | ProseMark> implements IDocumentNode<TCtor, TSpec, TToken, TNode> {
    constructor(public readonly name: string) {}
    public declare readonly ctor: TCtor;
    public abstract getSchema(): TSpec;
    
    // parser
    public abstract parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<TToken>): void;

    // serializer
    public abstract readonly serializer: TNode extends ProseMark ? IDocumentMarkSerializationOptions : Serializer<TNode, void>;
}

/**
 * @class A document node that represents an actual node in the DOM.
 */
export abstract class DocumentNode<TToken = EditorToken> extends DocumentNodeBase<ProseNodeType, ProseNodeSpec, TToken, ProseNode> {}

/**
 * @class A document mark that represents a mark. Such as 'strong', 'emphasis',
 * 'link' and so on.
 */
export abstract class DocumentMark<TToken = EditorToken> extends DocumentNodeBase<ProseMarkType, ProseMarkSpec, TToken, ProseMark> {}