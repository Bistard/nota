import { Mutable } from "src/base/common/util/type";
import { MarkEnum, TokenEnum } from "src/editor/common/markdown";
import { EditorToken } from "src/editor/common/model";
import { ProseMarkSpec, ProseMarkType, ProseNodeSpec, ProseNodeType } from "src/editor/common/prose";
import { IDocumentParseState } from "src/editor/viewModel/parser/parser";
import { EditorSchema, TOP_NODE_NAME } from "src/editor/viewModel/schema";

export interface IDocumentNode<TCtor, TSpec, TToken = EditorToken> {
    
    /**
     * Represents a corresponding markdown token type (original tokens parsed by 
     * Marked). It matchs to {@link TokenEnum}.
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

function initDocumentNode(node: DocumentNode<any>, ctor: ProseNodeType): void {
    (<Mutable<typeof node>>node).ctor = ctor;
}

function initDocumentMark(mark: DocumentMark<any>, ctor: ProseMarkType): void {
    (<Mutable<typeof mark>>mark).ctor = ctor;
}

/**
 * @class A provider that stores all the registered {@link IDocumentNode}. Those
 * nodes represents all the valid document nodes that can be parsed into the 
 * view.
 * 
 * @note All the registered nodes and marks will be used to build a complete
 * {@link EditorSchema} that defines a set of rules how the parsing tree will
 * be look like.
 * 
 * @warn Must invoke {@link DocumentNodeProvider.init} before access any data.
 */
export class DocumentNodeProvider {

    // [field]

    private readonly _nodes = new Map<string, DocumentNode<any>>();
    private readonly _marks = new Map<string, DocumentMark<any>>();

    // [constructor]

    constructor() {}

    // [public methods]

    public isNodeRegistered(name: string): boolean {
        return this._nodes.has(name);
    }

    public isMarkRegistered(name: string): boolean {
        return this._marks.has(name);
    }

    public registerNode(node: DocumentNode<any>): void {
        if (!this.__assertIfValid(node.name)) return;
        this._nodes.set(node.name, node);
    }

    public registerMark(mark: DocumentMark<any>): void {
        if (!this.__assertIfValid(mark.name)) return;
        this._marks.set(mark.name, mark);
    }

    public getNode<TToken>(name: TokenEnum | string): DocumentNode<TToken> | undefined {
        return this._nodes.get(name);
    }

    public getMark<TToken>(name: MarkEnum | string): DocumentMark<TToken> | undefined {
        return this._marks.get(name);
    }

    public getRegisteredNodes(): readonly DocumentNode<any>[] {
        const arr: DocumentNode<any>[] = [];
        for (const [name, node] of this._nodes) { arr.push(node); }
        return arr;
    }

    public getRegisteredMarks(): readonly DocumentMark<any>[] {
        const arr: DocumentMark<any>[] = [];
        for (const [name, mark] of this._marks) { arr.push(mark); }
        return arr;
    }

    public init(schema: EditorSchema): void {
        for (const [name, node] of this._nodes) {
            const nodeCtor = schema.getNodeType(name);
            if (!nodeCtor) {
                throw new Error(`Cannot find prosemirror node constructor for type ${name}`);
            }
            initDocumentNode(node, nodeCtor);
        }

        for (const [name, mark] of this._marks) {
            const markCtor = schema.getMarkType(name);
            if (!markCtor) {
                throw new Error(`Cannot find prosemirror mark constructor for type ${name}`);
            }
            initDocumentMark(mark, markCtor);
        }
    }

    // [private helper methods]

    private __assertIfValid(name: string): boolean {
        if (this._nodes.has(name)) {
            console.warn(`The given document node is already registered with name: ${name}.`);
            return false;
        }

        if (this._marks.has(name)) {
            console.warn(`The given document mark is already registered with name: ${name}.`);
            return false;
        }

        if (name === TOP_NODE_NAME) {
            console.warn(`Cannot register the document node with name '${TOP_NODE_NAME}' since it is already taken by default.`);
            return false;
        }

        return true;
    }
}