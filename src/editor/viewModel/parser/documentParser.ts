import { EditorToken } from "src/editor/common/model";
import { ProseAttrs, ProseMark, ProseMarkType, ProseNode, ProseNodeType } from "src/editor/common/prose";
import { DocumentNodeType } from "src/editor/common/viewModel";
import { EditorSchema } from "src/editor/viewModel/schema";

interface DocumentNode {
    readonly type: ProseNodeType;
    readonly children: DocumentNode[];
    readonly marks: ProseMark[];
    readonly attrs?: ProseAttrs;
}

/**
 * @class Parsing markdown tokens into document nodes that are used for 
 * rendering purpose in prosemirror view.
 */
export class DocumentParser {
    
    // [field]

    private readonly _schema: EditorSchema;
    private readonly _tokens: EditorToken[];
    private readonly _tokenToNodeTypes: Map<string, DocumentNodeType>;

    private readonly _stack: DocumentNode[];
    private readonly _parseTokensToNode: Map<string, Function>;

    // [private constructor]

    /**
     * The reason to make the constructor private is to avoid accidently holding 
     * the data references. To release the references properly, this is where
     * the static method {@link DocumentParser.parse} comes in.
     */
    private constructor(
        schema: EditorSchema,
        tokens: EditorToken[],
        tokenToNodeTypes: Map<string, DocumentNodeType>,
    ) {
        this._schema = schema;
        this._tokens = tokens;
        
        this._tokenToNodeTypes = tokenToNodeTypes;
        this._parseTokensToNode = new Map();
        this.__buildParseFunctions();

        this._stack = [];
        this._stack.push({ type: schema.topNodeType, children: [], marks: [], attrs: undefined });
    }

    // [public static methods]

    public static parse(
        schema: EditorSchema,
        tokens: EditorToken[],
        tokenToNodeTypes: Map<string, DocumentNodeType>,
    ): ProseNode | null 
    {
        const parser = new DocumentParser(schema, tokens, tokenToNodeTypes);
        return parser.parse();
    }

    // [public methods]

    public parse(): ProseNode | null {
        for (const token of this._tokens) {
            
            const parseToNode = this._parseTokensToNode.get(token.type);
            if (!parseToNode) {
                console.warn(`cannot find parse function with given token with type ${token.type}`);
                continue;
            }

            parseToNode(token);
        }

        return this._schema.topNodeType.createAndFill();
    }

    // [private helper methods]

    private __buildParseFunctions(): void {
        for (const [tokenName, nodeType] of this._tokenToNodeTypes) {
            
            if (nodeType === DocumentNodeType.Block) {
                this._parseTokensToNode.set(tokenName, this.__tokenToBlockNode);
            } 
            
            else if (nodeType === DocumentNodeType.Mark) {
                this._parseTokensToNode.set(tokenName, this.__tokenToMarkNode);
            }

            else {
                throw new Error(`cannot identify the given document node type ${nodeType}`);
            }
        }
    }

    private __tokenToBlockNode(nodeType: ProseNodeType, token: EditorToken): void {
        // TODO
    }

    private __tokenToMarkNode(markType: ProseMarkType, token: EditorToken): void {
        // TODO
    }
}