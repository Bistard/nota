import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogEvent, LogLevel } from "src/base/common/logger";
import { Stack } from "src/base/common/structures/stack";
import { panic } from "src/base/common/utilities/panic";
import { isNullable } from "src/base/common/utilities/type";
import { MarkEnum, TokenEnum } from "src/editor/common/markdown";
import { EditorToken } from "src/editor/common/model";
import { ProseAttrs, ProseMark, ProseMarkType, ProseNode, ProseNodeType, IProseTextNode } from "src/editor/common/proseMirror";
import { DocumentMark, DocumentNode, IDocumentNode } from "src/editor/model/parser/documentNode";
import { DocumentNodeProvider } from "src/editor/model/parser/documentNodeProvider";
import { EditorSchema } from "src/editor/model/schema";

/**
 * Interface only for {@link DocumentParser}.
 */
export interface IDocumentParser {
    
    /**
     * Fires when the parser wish to log out a message.
     */
    readonly onLog: Register<ILogEvent>;

    /**
     * @description Parsing the given tokens into document nodes used for 
     * rendering in prosemirror view.
     * @param tokens The markdown tokens that are parsed from the model.
     */
    parse(tokens: EditorToken[]): ProseNode;

    /**
     * @description Ignores the given type of token when parsing (the token will
     * be ignored and will not log an error message).
     * @param type The token type.
     * @param ignore When the value is given, the parser will force to either 
     *               ignore or NOT ignore the token by the given boolean. If not 
     *               given, the parser to toggle the value of the current 
     *               ignobleness.
     */
    ignoreToken(type: TokenEnum | MarkEnum | string, ignore?: boolean): void;

    /**
     * @description Check is the token ignored.
     * @param type The token type.
     */
    isTokenIgnored(type: TokenEnum | MarkEnum | string): boolean;
}

/**
 * @class Parsing markdown tokens into document nodes that are used for 
 * rendering purpose in prosemirror view.
 */
export class DocumentParser extends Disposable implements IDocumentParser {
    
    // [field]

    private readonly _state: DocumentParseState;
    private readonly _ignored: Set<string>;

    // [event]

    public readonly onLog: Register<ILogEvent>;

    // [constructor]

    constructor(
        schema: EditorSchema,
        nodeProvider: DocumentNodeProvider,
    ) {
        super();
        this._ignored = new Set();
        this._state = this.__register(new DocumentParseState(this, schema, nodeProvider));
        this.onLog = this._state.onLog;
    }

    // [public methods]

    public parse(tokens: EditorToken[]): ProseNode {        
        this._state.parseTokens(tokens, null);
        const documentRoot = this._state.complete();
        this._state.clean();
        return documentRoot;
    }

    public ignoreToken(type: TokenEnum | MarkEnum | string, ignore?: boolean): void {
        
        // toggling
        if (isNullable(ignore)) {
            const has = this._ignored.has(type);
            if (has) {
                this._ignored.delete(type);
            } else {
                this._ignored.add(type);
            }
        }
        else if (ignore) {
            this._ignored.add(type);
        } else {
            this._ignored.delete(type);
        }
    }

    public isTokenIgnored(type: TokenEnum | MarkEnum | string): boolean {
        return this._ignored.has(type);
    }

    public override dispose(): void {
        super.dispose();
        this._ignored.clear();
    }
}

/**
 * @internal
 */
interface IParsingNodeState {
    readonly ctor: ProseNodeType;
    children: ProseNode[];
    marks: readonly ProseMark[];
    attrs?: ProseAttrs;
}

/**
 * Interface only for {@link DocumentParseState}.
 * 
 * The {@link IDocumentNode} has full accessability to control the parsing flow.
 * The state provides a series of methods for different tokens so that they can 
 * decide how to parse themselves correctly.
 * 
 * @implements
 * The state will invoke `IDocumentNode.parseFromToken` for each token
 * internally.
 */
export interface IDocumentParseState {
    
    /**
     * @description Activates a new document node and pushes into the internal 
     * stack. All the newly deactivated nodes will be added as a child node into 
     * this one.
     * @param ctor The constructor for the newly activated document node.
     * @param attrs The attributes for the newly activated document node.
     */
    activateNode(ctor: ProseNodeType, attrs?: ProseAttrs): void;

    /**
     * @description Deactivates the current node and creates the corresponding
     * {@link ProseNode} from the constructor that is provided when it is 
     * activated. The created node will be pops out from the internal stack to 
     * be inserted as a child into the parent document node.
     */
    deactivateNode(opts?: IDeactivateNodeOptions): ProseNode | null;

    /**
     * @description Given an array of tokens and parses them recursively. All
     * the newly activated nodes will be inserted as the children of the current
     * active ones.
     * @param tokens The provided markdown tokens.
     * @param parent The parent token of the given token list.
     */
    parseTokens(tokens: EditorToken[], parent: EditorToken): void;
    
    /**
     * @description Insert the text of the current active document node.
     * @param text 
     */
    addText(text: string): void;

    /**
     * @description Active the provided document mark. All the newly activated
     * document nodes will automatically having this mark.
     * @param mark The provided mark.
     */
    activateMark(mark: ProseMark): void;

    /**
     * @description Deactivates the given mark. Stop automatically adding this
     * mark to the newly activated document nodes.
     * @param mark 
     */
    deactivateMark(mark: ProseMarkType): void;

    /**
     * @description Check out what is the current active document node. Might be
     * used for debugging.
     */
    getActiveNode(): ProseNodeType | null;

    /**
     * @description Check out what is the current active document marks. Might 
     * be used for debugging.
     */
    getActiveMark(): readonly ProseMark[];

    getDocumentNode<TToken = EditorToken>(name: string): DocumentNode<TToken> | null;
    getDocumentMark<TToken = EditorToken>(name: string): DocumentMark<TToken> | null;
}

export interface IDeactivateNodeOptions {
    
    /**
     * If expecting deactivating the `inline_html` node. If `true`, we construct 
     * a `inline_html` node as expected. If `false` and unexpectedly 
     * encountering a `inline_html` node, the node will be parsed as plain-text.
     * @default false
     */
    readonly expectInlineHtml?: boolean;
}

/**
 * @internal
 * @class Use to maintain the parsing process for each parse request from the
 * {@link DocumentParser}.
 */
class DocumentParseState implements IDocumentParseState, IDisposable {

    // [field]

    /**
     * A stack that holds every ongoing parsing nodes (unfinished). The state
     * itself does not control the process, the {@link IDocumentNode} has full
     * control over it.
     */
    private readonly _actives: Stack<IParsingNodeState>;
    private readonly _nodeProvider: DocumentNodeProvider;
    private readonly _parser: DocumentParser;

    private readonly _defaultNodeType: ProseNodeType;
    private readonly _createTextNode: (text: string, marks?: readonly ProseMark[]) => IProseTextNode;

    // [event]

    private readonly _onLog = new Emitter<ILogEvent>();
    public readonly onLog = this._onLog.registerListener;

    // [constructor]

    constructor(
        parser: DocumentParser,
        schema: EditorSchema,
        provider: DocumentNodeProvider,
    ) {
        this._parser = parser;
        this._nodeProvider = provider;
        this._defaultNodeType = schema.topNodeType;
        this._createTextNode = schema.text.bind(schema);

        const root = { ctor: this._defaultNodeType, children: [], marks: [], attrs: undefined };
        this._actives = new Stack([root]);
    }

    // [public methods]

    public parseTokens(tokens: EditorToken[], parent: EditorToken | null): void {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i]!;
            
            const name = token.type;
            if (this._parser.isTokenIgnored(name)) {
                continue;
            }

            // Finds the corresponding Node which defines the parsing behavior.
            const node = this._nodeProvider.getNode(name) ?? this._nodeProvider.getMark(name);
            if (!node) {
                this._onLog.fire({
                    level: LogLevel.WARN,
                    message: `Cannot find any registered document nodes that matches the given token with type: '${name}'.`,
                });
                continue;
            }
            
            node.parseFromToken(this, token, parent, tokens[i - 1], tokens[i + 1]);
        }
    }

    public complete(): ProseNode {
        let root: ProseNode | null = null;
        while (!this._actives.empty()) {
            root = this.deactivateNode();
        }
        return root ?? this._defaultNodeType.create();
    }

    public clean(): void {
        this._actives.clear();

        // ready for next parsing
        const root = { ctor: this._defaultNodeType, children: [], marks: [], attrs: undefined };
        this._actives.push(root);
    }

    // [public methods]

    public activateNode(ctor: ProseNodeType, attrs?: ProseAttrs): void {
        this._actives.push({
            ctor: ctor,
            children: [],
            marks: [],
            attrs: attrs,
        });
    }

    public deactivateNode(opt?: IDeactivateNodeOptions): ProseNode | null {
        const current = this.__popActive();

        /**
         * Unexpectedly encountering a `inline_html` node, it means it is 
         * incomplete, only found 1 open tag but not a close tag. Thus we need 
         * to render it as plain-text.
         */
        if (!opt?.expectInlineHtml && current.ctor.name === TokenEnum.InlineHTML) {
            return this.__onUnexpectedInlineHtml(current);
        }
        
        // happens when deactivating the root document node
        if (this._actives.empty()) {
            return current.ctor.createAndFill(current.attrs, current.children, current.marks);
        }

        const active = this.__getActive();
        const node = current.ctor.createAndFill(current.attrs, current.children, active.marks);
        if (!node) {
            return null;
        }

        active.children.push(node);
        return node;
    }

    public addText(text: string): void {
        if (!text) {
            return;
        }

        const active = this.__getActive();
        const textNode = this._createTextNode(text, active.marks);

        const lastIdx = active.children.length - 1;
        const previous = active.children[lastIdx];
        if (!previous) {
            active.children.push(textNode);
            return;
        }

        // try to merge two nodes into one if they are both text nodes
        const mergable = (node1: ProseNode, node2: ProseNode): boolean => {
            if (node1.isText && node2.isText && ProseMark.sameSet(node1.marks, node2.marks)) {
                return true;
            }
            return false;
        };

        if (!mergable(previous, textNode)) {
            active.children.push(textNode);
            return;
        }

        if (!previous.text || !textNode.text) {
            active.children[lastIdx] = (previous.text) ? previous : textNode;
            return;
        }
        
        const newText = previous.text + textNode.text;
        const mergedNode = (<IProseTextNode>previous).withText(newText);
        
        active.children[lastIdx] = mergedNode;
    }

    public activateMark(mark: ProseMark): void {
        const active = this.__getActive();
        active.marks = mark.addToSet(active.marks);
    }

    public deactivateMark(mark: ProseMarkType): void {
        const active = this.__getActive();
        active.marks = mark.removeFromSet(active.marks);
    }

    public getActiveNode(): ProseNodeType | null {
        if (this._actives.empty()) {
            return null;
        }
        return this._actives.top().ctor;
    }

    public getActiveMark(): readonly ProseMark[] {
        if (this._actives.empty()) {
            return [];
        }
        return this._actives.top().marks;
    }

    public getDocumentNode<TToken = EditorToken>(name: string): DocumentNode<TToken> | null {
        return this._nodeProvider.getNode(name) ?? null;
    }

    public getDocumentMark<TToken = EditorToken>(name: string): DocumentMark<TToken> | null {
        return this._nodeProvider.getMark(name) ?? null;
    }

    public dispose(): void {
        this.clean();
        this._onLog.dispose();
    }

    // [private helper methods]

    private __getActive(): IParsingNodeState {
        if (this._actives.empty()) {
            panic('Current document parsing state has no active tokens.');
        }
        return this._actives.top();
    }

    private __popActive(): IParsingNodeState {
        if (this._actives.empty()) {
            panic('Current document parsing state has no active tokens.');
        }
        return this._actives.pop();
    }

    private __onUnexpectedInlineHtml(node: IParsingNodeState): ProseNode | null {
        const plainText = node.attrs!['text'] as string;
        this.addText(plainText);
        for (const child of node.children) {
            this.addText(child.textContent);
        }
        return this.deactivateNode();
    }
}