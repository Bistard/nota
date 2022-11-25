import { Mutable } from "src/base/common/util/type";
import { MarkEnum, TokenEnum } from "src/editor/common/markdown";
import { ProseMarkSpec, ProseMarkType, ProseNodeSpec, ProseNodeType } from "src/editor/common/prose";
import { EditorSchema, TOP_NODE_NAME } from "src/editor/viewModel/schema";

export const enum IDocumentNodeType {
    Text,
    Inline,
    Block,
    Mark,
}

export interface IDocumentNode<TCtor = any, TSpec = any> {
    /**
     * Represents a corresponding markdown token type (original tokens parsed
     * by Marked). It matchs to {@link TokenEnum}.
     */
    readonly name: string;

    readonly type: IDocumentNodeType;

    readonly ctor: TCtor;
    
    getSchema(): TSpec;
}

abstract class DocumentNodeBase<TCtor, TSpec> implements IDocumentNode<TCtor, TSpec> {
    constructor(public readonly name: string) {}
    public abstract readonly type: IDocumentNodeType;
    public declare readonly ctor: TCtor;
    public abstract getSchema(): TSpec;
}

export abstract class DocumentNode extends DocumentNodeBase<ProseNodeType, ProseNodeSpec> {}

export abstract class DocumentMark extends DocumentNodeBase<ProseMarkType, ProseMarkSpec> {}

function initDocumentNode(node: DocumentNode, ctor: ProseNodeType): void {
    (<Mutable<DocumentNode>>node).ctor = ctor;
}

function initDocumentMark(mark: DocumentMark, ctor: ProseMarkType): void {
    (<Mutable<DocumentMark>>mark).ctor = ctor;
}

export class DocumentNodeProvider {

    // [field]

    private readonly _nodes = new Map<string, DocumentNode>();
    private readonly _marks = new Map<string, DocumentMark>();

    // [constructor]

    constructor() {}

    // [public methods]

    public isNodeRegistered(name: string): boolean {
        return this._nodes.has(name);
    }

    public isMarkRegistered(name: string): boolean {
        return this._marks.has(name);
    }

    public registerNode(node: DocumentNode): void {
        if (!this.__assertIfValid(node.name)) return;
        this._nodes.set(node.name, node);
    }

    public registerMark(mark: DocumentMark): void {
        if (!this.__assertIfValid(mark.name)) return;
        this._marks.set(mark.name, mark);
    }

    public getNode(name: TokenEnum | string): DocumentNode | undefined {
        return this._nodes.get(name);
    }

    public getMark(name: MarkEnum | string): DocumentMark | undefined {
        return this._marks.get(name);
    }

    public getRegisteredNodes(): readonly DocumentNode[] {
        const arr: DocumentNode[] = [];
        for (const [name, node] of this._nodes) { arr.push(node); }
        return arr;
    }

    public getRegisteredMarks(): readonly DocumentMark[] {
        const arr: DocumentMark[] = [];
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