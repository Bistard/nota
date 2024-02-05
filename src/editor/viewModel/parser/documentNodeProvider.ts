import { IO } from "src/base/common/utilities/functional";
import { Mutable } from "src/base/common/utilities/type";
import { TokenEnum, MarkEnum } from "src/editor/common/markdown";
import { ProseNodeType, ProseMarkType } from "src/editor/common/proseMirror";
import { DocumentNode, DocumentMark } from "src/editor/viewModel/parser/documentNode";
import { Codespan } from "src/editor/viewModel/parser/mark/codespan";
import { Emphasis } from "src/editor/viewModel/parser/mark/emphasis";
import { Link } from "src/editor/viewModel/parser/mark/link";
import { Strong } from "src/editor/viewModel/parser/mark/strong";
import { Blockquote } from "src/editor/viewModel/parser/node/blockquote";
import { CodeBlock } from "src/editor/viewModel/parser/node/codeBlock";
import { Heading } from "src/editor/viewModel/parser/node/heading";
import { HorizontalRule } from "src/editor/viewModel/parser/node/horizontalRule";
import { HTML } from "src/editor/viewModel/parser/node/html";
import { Image } from "src/editor/viewModel/parser/node/image";
import { LineBreak } from "src/editor/viewModel/parser/node/lineBreak";
import { List, ListItem } from "src/editor/viewModel/parser/node/list";
import { Paragraph } from "src/editor/viewModel/parser/node/paragraph";
import { Space } from "src/editor/viewModel/parser/node/space";
import { Text } from "src/editor/viewModel/parser/node/text";
import { EditorSchema, TOP_NODE_NAME } from "src/editor/viewModel/schema";

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

    private constructor() {}

    // [public static methods]

    public static create(): { register: IO<DocumentNodeProvider> } {
        const provider = new DocumentNodeProvider();

        return {
            
            /**
             * @description Registers all the valid document nodes.
             */
            register: () => {
                // nodes
                provider.registerNode(new Space());
                provider.registerNode(new Text());
                
                provider.registerNode(new Paragraph());
                provider.registerNode(new Blockquote());
                provider.registerNode(new HorizontalRule());
                provider.registerNode(new Heading());
                provider.registerNode(new CodeBlock());
                provider.registerNode(new List());
                provider.registerNode(new ListItem());
                
                provider.registerNode(new LineBreak());
                provider.registerNode(new Image());
                provider.registerNode(new HTML());

                // marks
                provider.registerMark(new Link());
                provider.registerMark(new Emphasis());
                provider.registerMark(new Strong());
                provider.registerMark(new Codespan());

                return provider;
            }
        };
    }

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

function initDocumentNode(node: DocumentNode<any>, ctor: ProseNodeType): void {
    (<Mutable<typeof node>>node).ctor = ctor;
}

function initDocumentMark(mark: DocumentMark<any>, ctor: ProseMarkType): void {
    (<Mutable<typeof mark>>mark).ctor = ctor;
}