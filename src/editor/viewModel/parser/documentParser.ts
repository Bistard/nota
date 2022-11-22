import { EditorToken } from "src/editor/common/model";
import { ProseAttrs, ProseMark, ProseNode, ProseNodeType } from "src/editor/common/prose";
import { DocumentNodeProvider, IDocumentNodeType } from "src/editor/viewModel/parser/documentNode";
import { EditorSchema } from "src/editor/viewModel/schema";

interface DocumentNodeState {
    readonly type: ProseNodeType;
    readonly children?: DocumentNodeState[];
    readonly marks?: ProseMark[];
    readonly attrs?: ProseAttrs;
}

type DocumentParseFunction = (token: EditorToken) => void;

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

    // [constructor]

    constructor(
        schema: EditorSchema,
        nodeProvider: DocumentNodeProvider,
    ) {
        this._schema = schema;
        this._nodeProvider = nodeProvider;
    }

    // [public methods]

    public parse(tokens: EditorToken[]): ProseNode | null {        
        const state = new DocumentParseState(this._schema.topNodeType, this._nodeProvider, tokens);
        return state.parse();
    }
}

/**
 * @internal
 * @class Use to maintain the parsing process for each parse request from the
 * {@link DocumentParser}.
 */
class DocumentParseState {

    // [field]

    private readonly _defaultNodeType: ProseNodeType;
    private readonly _tokens: EditorToken[];
    private readonly _nodeProvider: DocumentNodeProvider;
    private readonly _parseMap = new Map<IDocumentNodeType, DocumentParseFunction>();
    
    private readonly _unfinishedToken: DocumentNodeState[] = [];

    // [constructor]

    constructor(
        defaultNodeType: ProseNodeType, 
        provider: DocumentNodeProvider, 
        tokens: EditorToken[],
    ) {
        this._defaultNodeType = defaultNodeType;
        this._tokens = tokens;
        this._nodeProvider = provider;
        this._unfinishedToken.push({ type: defaultNodeType, children: [], marks: [], attrs: undefined });
        this.__registerParseFunction();
    }

    // [public methods]

    public parse(): ProseNode | null {

        for (const token of this._tokens) {
            const name = token.type;
            const node = this._nodeProvider.getNode(name) ?? this._nodeProvider.getMark(name);
            if (!node) {
                console.warn(`cannot find any registered document nodes that matches the given token with type ${name}`);
                return null;
            }
            
            const type = node.type;
            const parseToNode = this._parseMap.get(type);
            if (!parseToNode) {
                console.warn(`cannot parse the given token with type ${name}`);
                return null;
            }

            parseToNode(token);
        }

        return this._defaultNodeType.createAndFill();
    }

    // [private helper methods]

    // TODO
    private __registerParseFunction(): void {
        
        const parseToText = (token: EditorToken) => {

        };

        const parseToInline = (token: EditorToken) => {

        };

        const parseToBlock = (token: EditorToken) => {
            this.__pushUnfinishedToken(token);
        };

        const parseToMark = (token: EditorToken) => {

        };


        this._parseMap.set(IDocumentNodeType.Text, parseToText);
        this._parseMap.set(IDocumentNodeType.Inline, parseToInline);
        this._parseMap.set(IDocumentNodeType.Block, parseToBlock);
        this._parseMap.set(IDocumentNodeType.Mark, parseToMark);
    }

    // TODO
    private __pushUnfinishedToken(token: EditorToken): void {
        
    }

    // TODO
    private __insertToCurrentToken(token: EditorToken): void {

    }

    // TODO
    private __popUnfinishedToken(token: EditorToken): void {

    }
}