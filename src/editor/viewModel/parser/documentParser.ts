import { EditorToken } from "src/editor/common/model";
import { ProseAttrs, ProseMark, ProseNode, ProseNodeType, ProseTextNode } from "src/editor/common/prose";
import { DocumentMark, DocumentNode, DocumentNodeProvider, IDocumentNode, IDocumentNodeType } from "src/editor/viewModel/parser/documentNode";
import { EditorSchema } from "src/editor/viewModel/schema";

type TokenParseFn<TNode> = (token: EditorToken, node: TNode) => void;

export interface IDocumentParser {
    parse(tokens: EditorToken[]): ProseNode | null;
}

/**
 * @class Parsing markdown tokens into document nodes that are used for 
 * rendering purpose in prosemirror view.
 */
export class DocumentParser implements IDocumentParser {
    
    // [field]

    private readonly _schema: EditorSchema;
    private readonly _nodeProvider: DocumentNodeProvider;
    private readonly _state: DocumentParseState;

    // [constructor]

    constructor(
        schema: EditorSchema,
        nodeProvider: DocumentNodeProvider,
    ) {
        this._schema = schema;
        this._nodeProvider = nodeProvider;
        this._state = new DocumentParseState(schema, nodeProvider);
    }

    // [public methods]

    public parse(tokens: EditorToken[]): ProseNode | null {        
        const documentTree = this._state.parse(tokens);
        this._state.clean();
        return documentTree;
    }
}

interface ParsingNodeState {
    readonly ctor: ProseNodeType;
    readonly children: ProseNode[];
    readonly marks: ProseMark[];
    readonly attrs?: ProseAttrs;
}

/**
 * @internal
 * @class Use to maintain the parsing process for each parse request from the
 * {@link DocumentParser}.
 */
class DocumentParseState {

    // [field]

    private readonly _defaultNodeType: ProseNodeType;
    private readonly _createTextNode: (text: string, marks?: readonly ProseMark[]) => ProseTextNode;
    private readonly _nodeProvider: DocumentNodeProvider;
    private readonly _parseMap: Map<IDocumentNode, TokenParseFn<IDocumentNode>>;
    
    private _ongoingTokens: ParsingNodeState[] = [];

    // [constructor]

    constructor(
        schema: EditorSchema,
        provider: DocumentNodeProvider,
    ) {
        this._defaultNodeType = schema.topNodeType;
        this._createTextNode = schema.text;
        this._nodeProvider = provider;
        this._parseMap = new Map();

        this._ongoingTokens.push({ ctor: this._defaultNodeType, children: [], marks: [], attrs: undefined });
        this.__registerParseFunction(provider);
    }

    // [public methods]

    public parse(tokens: EditorToken[]): ProseNode | null {
        
        
        this.__parseTokens(tokens);

        return this._defaultNodeType.createAndFill();
    }
    
    public clean(): void {
        this._ongoingTokens = [];
    }

    // [private helper methods]

    // TODO
    private __registerParseFunction(provider: DocumentNodeProvider): void {
        
        const parseToText = (token: EditorToken) => {
            this.__insertTextToOngoing(token.raw);
        };

        const parseToInline = (token: EditorToken) => {
            this.__parseTokens(token.tokens ?? []);
        };

        const parseToBlock = (token: EditorToken, node: DocumentNode) => {
            
        };

        const parseToMark = (token: EditorToken) => {

        };

        const nodes = provider.getRegisteredNodes();
        for (const node of nodes) {
            switch (node.type) {
                case IDocumentNodeType.Block: {
                    this._parseMap.set(node, parseToBlock);
                    break;
                }
                case IDocumentNodeType.Mark: {
                    this._parseMap.set(node, parseToMark);
                    break;
                }
                case IDocumentNodeType.Inline: {
                    this._parseMap.set(node, parseToInline);
                    break;
                }
                case IDocumentNodeType.Text: {
                    this._parseMap.set(node, parseToText);
                    break;
                }
                default: {
                    console.warn(`Cannot identify the given document node type: ${node.type}`);
                }
            }
        }
    }

    private __parseTokens(tokens: EditorToken[]): void {

        for (const token of tokens) {
            const name = token.type;
            const node = this._nodeProvider.getNode(name) ?? this._nodeProvider.getMark(name);
            if (!node) {
                throw new Error(`cannot find any registered document nodes that matches the given token with type ${name}`);
            }
            
            const parseToNode = this._parseMap.get(node);
            if (!parseToNode) {
                throw new Error(`cannot parse the given token with type ${name}`);
            }

            parseToNode(token, node);
        }
    }

    private __getOngoingToken(): ParsingNodeState | undefined {
        return this._ongoingTokens[this._ongoingTokens.length - 1];
    }

    private __pushOngoingToken(ctor: ProseNodeType): void {
        this._ongoingTokens.push({
            ctor: ctor,
            children: [],
            marks: [],
            attrs: undefined,
        });
    }

    private __popOngoingToken(): ProseNode | undefined {
        const ongoing = this.__getOngoingToken();
        if (!ongoing) {
            return undefined;
        }
        
        const proseNode = ongoing.ctor.createAndFill(null, ongoing.children, ongoing.marks);
        if (!proseNode) {
            return undefined;
        }

        ongoing.children.push(proseNode);
        return proseNode;
    }

    private __insertTextToOngoing(text: string): void {
        if (!text) {
            return;
        }

        const ongoing = this.__getOngoingToken();
        if (!ongoing) {
            return;
        }

        const textNode = this._createTextNode(text, ongoing.marks);
        
        const lastIdx = ongoing.children.length - 1;
        const previous = ongoing.children[lastIdx];
        if (!previous) {
            ongoing.children.push(textNode);
            return;
        }

        const mergable = (node1: ProseNode, node2: ProseNode): boolean => {
            if (node1.isText && node2.isText && ProseMark.sameSet(node1.marks, node2.marks)) {
                return true;
            }
            return false;
        };

        if (!mergable(previous, textNode)) {
            ongoing.children.push(textNode);
            return;
        };

        if (!previous.text || !textNode.text) {
            ongoing.children[lastIdx] = (previous.text) ? previous : textNode;
            return;
        }
        
        const newText = previous.text + textNode.text;
        const mergedNode = (<ProseTextNode>previous).withText(newText);
        
        ongoing.children[lastIdx] = mergedNode;
    }
}