import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogEvent, LogLevel } from "src/base/common/logger";
import { Stack } from "src/base/common/structures/stack";
import { assert, panic } from "src/base/common/utilities/panic";
import { Strings } from "src/base/common/utilities/string";
import { isNullable, isNumber, isString, StringDictionary } from "src/base/common/utilities/type";
import { MarkEnum, TokenEnum } from "src/editor/common/markdown";
import { EditorToken } from "src/editor/common/model";
import { ProseAttrs, ProseMark, ProseMarkType, ProseNode, ProseNodeType, IProseTextNode } from "src/editor/common/proseMirror";
import { DocumentMark, DocumentNode, IDocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { DocumentNodeProvider } from "src/editor/model/documentNode/documentNodeProvider";
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
        this._state.parseTokens(0, tokens, null);
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
        } else if (ignore) {
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
    readonly level: number;
    readonly ctor: ProseNodeType;
    
    children: ProseNode[];
    marks: readonly ProseMark[];
    
    readonly attrs?: ProseAttrs;
    readonly isLastToken: boolean;
    readonly isAncestorAllLastToken: boolean;
}

export interface IParseStateActivateOptions {

    /**
     * The attribute that will be passed into {@link ProseNode} for constructing.
     */
    readonly attrs?: ProseAttrs;
}

export interface IParseStateDeactivateOptions {

    /**
     * Each activation has a corresponding deactivation. When we encounter the 
     * deactivation for this specific activation, we expect to deactivate an 
     * `inline_html` node.
     * - If `false` provided, it means we are not expecting a `inline_html` 
     *        node, if met one, this node will be parsed as plain-text.
     * - If a string provided, it represents we are expecting a `inline_html`
     *        node with that tag name (e.g. 'div', 'strong', 'anyHtmlTagName').
     *      - If tag name meets, we are constructing an `inline_html` node.
     *      - If tag name doesn't meet, we are rendering them as plain-text.
     * @default false
     */
    readonly expectInlineHtmlTag?: false | string;
}

function __defaultDeactivateOptions(): IParseStateDeactivateOptions {
    return {
        expectInlineHtmlTag: false
    };
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
     * stack. All the later activated nodes will eventually be added as a child 
     * node into this one.
     * @param ctor The constructor for the newly activated document node.
     * @param status The current parsing status.
     * @param opts The options for activation.
     */
    activateNode(ctor: ProseNodeType, status: IParseTokenStatus, opts?: IParseStateActivateOptions): void;

    /**
     * @description Deactivates the current node and creates the corresponding
     * {@link ProseNode} from the constructor that is provided when it is 
     * activated. The created node will be pops out from the internal stack to 
     * be inserted as a child into the parent document node.
     */
    deactivateNode(opts?: IParseStateDeactivateOptions): ProseNode | null;

    /**
     * @description Given an array of tokens and parses them recursively. All
     * the newly activated nodes will be inserted as the children of the current
     * active ones.
     * @param level The current level of parsing.
     * @param tokens The provided markdown tokens.
     * @param parent The parent token of the given token list.
     */
    parseTokens(level: number, tokens: EditorToken[], parent: EditorToken): void;
    
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

    /**
     * @description Is there any ancestor with the given type name during parsing
     * stage.
     */
    anyAncestor(type: string): boolean;
}

/**
 * @internal
 * @class Use to maintain the parsing process for each parse request from the
 * {@link DocumentParser}.
 */
class DocumentParseState extends Disposable implements IDocumentParseState {

    // [field]

    /**
     * A stack that holds every ongoing parsing nodes (unfinished). The state
     * itself does not control the process, the {@link IDocumentNode} has full
     * control over it.
     */
    private readonly _actives: Stack<IParsingNodeState>;
    private readonly _activesTracker: ActiveNodeTracker;

    private readonly _nodeProvider: DocumentNodeProvider;
    private readonly _parser: DocumentParser;

    private readonly _defaultNodeType: ProseNodeType;
    private readonly _createTextNode: (text: string, marks?: readonly ProseMark[]) => IProseTextNode;

    /** @see https://github.com/Bistard/nota/issues/236 */
    private readonly _markActivationCount = new Map<ProseMarkType, number>();

    /** @see https://github.com/markedjs/marked/issues/3506 */
    private _preserveLastEndOfLine: boolean;

    // [event]

    private readonly _onLog = this.__register(new Emitter<ILogEvent>());
    public readonly onLog = this._onLog.registerListener;

    // [constructor]

    constructor(
        parser: DocumentParser,
        schema: EditorSchema,
        provider: DocumentNodeProvider,
    ) {
        super();
        this._parser = parser;
        this._nodeProvider = provider;
        this._defaultNodeType = schema.topNodeType;
        this._createTextNode = schema.text.bind(schema);

        this._activesTracker = new ActiveNodeTracker(provider);
        const root = this.__initRootNode();
        this._actives = new Stack([root]);

        this._preserveLastEndOfLine = false;
    }

    // [public methods]

    public parseTokens(level: number, tokens: EditorToken[], parent: EditorToken | null): void {
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
            
            const isFirstToken = i === 0;
            const isLastToken = i === tokens.length - 1;
            const prevToken = tokens[i - 1];
            const nextToken = tokens[i + 1];
            node.parseFromToken(this, { level: level + 1, token, parent, isFirstToken, isLastToken, prev: prevToken, next: nextToken });
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
        const root = this.__initRootNode();
        this._actives.push(root);

        this._markActivationCount.clear();
        this._activesTracker.clean();
        this._preserveLastEndOfLine = false;
    }

    public activateNode(ctor: ProseNodeType, status: IParseTokenStatus, opts?: IParseStateActivateOptions): void {
        const { token, isLastToken, level } = status;
        const parent = this.__getActive();

        if (level === 1 && isLastToken && token.raw.at(-1) === '\n' && __requirePreserveLastNewLineCheck(token)) {
            this._preserveLastEndOfLine = true;
        }
        
        this._activesTracker.track(ctor);
        this._actives.push({
            ctor: ctor,
            children: [],
            marks: [],
            attrs: opts?.attrs,
            level: status.level,
            isLastToken: isLastToken,
            isAncestorAllLastToken: parent.isAncestorAllLastToken && isLastToken,
        });
    }

    public deactivateNode(opts: IParseStateDeactivateOptions = __defaultDeactivateOptions()): ProseNode | null {
        
        // pre deactivation check
        
        let activeNode = this.__getActive();
        this._activesTracker.untrack(activeNode.ctor);

        if (this._preserveLastEndOfLine && activeNode.isAncestorAllLastToken) {
            this._preserveLastEndOfLine = false;
            this.addText('\n');
        }

        // post deactivation check
        
        activeNode = this.__popActive();
        
        if (opts.expectInlineHtmlTag === false && activeNode.ctor.name === TokenEnum.InlineHTML) {
            return this.__onUnexpectedInlineHtml(activeNode);
        }
        else if (isString(opts.expectInlineHtmlTag)) {
            const handled = this.__onUnmatchedInlineHtml(activeNode, opts.expectInlineHtmlTag);
            if (handled) {
                return null;
            }
        }
        
        // happens when deactivating the root document node

        if (this._actives.empty()) {
            return activeNode.ctor.createAndFill(activeNode.attrs, activeNode.children, activeNode.marks);
        }

        // normal deactivating

        const parent = this.__getActive();
        const node = activeNode.ctor.createAndFill(activeNode.attrs, activeNode.children, parent.marks);
        if (!node) {
            this._onLog.fire({ level: LogLevel.WARN, message: __getCreateAndFillErrorMessage(activeNode), });
            return null;
        }

        parent.children.push(node);
        return node;
    }

    public addText(text: string): void {
        if (!text) {
            return;
        }

        const active = this.__getActive();
        const textNode = this._createTextNode(text, active.marks);

        const lastIdx = active.children.length - 1;
        const prevNode = active.children[lastIdx];
        if (!prevNode) {
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

        if (!mergable(prevNode, textNode)) {
            active.children.push(textNode);
            return;
        }

        if (!prevNode.text || !textNode.text) {
            active.children[lastIdx] = (prevNode.text) ? prevNode : textNode;
            return;
        }
        
        const newText = prevNode.text + textNode.text;
        const mergedNode = (<IProseTextNode>prevNode).withText(newText);
        
        active.children[lastIdx] = mergedNode;
    }

    public activateMark(mark: ProseMark): void {
        const active = this.__getActive();
        const markType = mark.type;
        
        // Only activate the mark if it's not already in the markSet
        const count = this._markActivationCount.get(markType) ?? 0;
        if (count === 0) {
            active.marks = mark.addToSet(active.marks);
        }
        
        // increase the counter
        this._markActivationCount.set(markType, count + 1);
    }

    public deactivateMark(mark: ProseMarkType): void {
        const active = this.__getActive();
        const count = assert(this._markActivationCount.get(mark));

        // Only remove the mark when the counter reaches 1 (outermost level)
        if (count === 1) {
            active.marks = mark.removeFromSet(active.marks);
        }

        // Otherwise just decrease the activation counter
        this._markActivationCount.set(mark, count - 1);
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

    public anyAncestor(type: string): boolean {
        return this._activesTracker.anyAncestor(type);
    }

    public override dispose(): void {
        super.dispose();
        this.clean();
    }

    // [private helper methods]

    private __initRootNode(): IParsingNodeState {
        const root: IParsingNodeState = { 
            ctor: this._defaultNodeType, 
            children: [], 
            marks: [], 
            attrs: undefined, 
            level: 0,
            isLastToken: true,
            isAncestorAllLastToken: true,
        };
        return root;
    }

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

    /**
     * Unexpectedly encountering a `inline_html` node, it means it is 
     * incomplete, only found 1 open tag but not a close tag. Thus we need 
     * to render it as plain-text.
     */
    private __onUnexpectedInlineHtml(node: IParsingNodeState): ProseNode | null {
        const plainText = node.attrs!['text'] as string;
        this.addText(plainText);
        for (const child of node.children) {
            this.addText(child.textContent);
        }
        return this.deactivateNode();
    }

    /**
     * We are expecting a `inline_html` node with the given tag name. We 
     * check if the tag name from the current node is matched with the 
     * expecting tag name. If not, we render them as plain-text.
     */
    private __onUnmatchedInlineHtml(prevNode: IParsingNodeState, expectCloseTag: string): boolean {
        const openTagName = prevNode.attrs!['tagName'] as string;
        const closeTagName = expectCloseTag;
        
        if (openTagName !== closeTagName) {
            const openText = prevNode.attrs!['text'] as string; // e.g. <div>, <em>, <strong>
            const closeTag = `</${closeTagName}>`;              // e.g. </div>, </em>, </strong>
            
            this.addText(openText);
            for (const child of prevNode.children) {
                this.addText(child.textContent);
            }
            this.addText(closeTag);
            return true;
        }

        return false;
    }
}

function __requirePreserveLastNewLineCheck(token: EditorToken): boolean {
    switch (token.type) {
        case TokenEnum.Paragraph:
        case TokenEnum.Heading:
        case TokenEnum.Blockquote:
        case TokenEnum.CodeBlock:
        case TokenEnum.List:
            return true;
        default:
            return false;
    }
}

/** @internal */
class ActiveNodeTracker {

    // [fields]

    private _counters: StringDictionary<number>;

    // [constructor]

    constructor(provider: DocumentNodeProvider) {
        this._counters = {};
        for (const node of provider.getRegisteredNodes()) {
            this._counters[node.name] = 0;
        }
    }

    // [public methods]

    public anyAncestor(type: string): boolean {
        const count = this._counters[type];
        if (isNumber(count)) {
            return count > 0;
        }
        return false;
    }

    public track(nodeType: ProseNodeType): void {
        const count = this._counters[nodeType.name] ?? 0;
        this._counters[nodeType.name] = count + 1;
    }

    public untrack(nodeType: ProseNodeType): void {
        const count = this._counters[nodeType.name] ?? 0;
        this._counters[nodeType.name] = Math.max(count - 1, 0);
    }

    public clean(): void {
        this._counters = {};
    }
}

function __getCreateAndFillErrorMessage(activeNode: IParsingNodeState): string {
    const { ctor, level, attrs, children, marks } = activeNode;

    const attrsInfo = attrs ? Strings.stringify(attrs) : 'No attributes';
    const childrenInfo = children.map((node, index) => {
        return `    Child ${index + 1}: ${node.toString()}`;
    }).join('\n');
    const marksInfo = marks.map((mark) => {
        const markAttrs = Strings.stringify(mark.attrs);
        return `    Mark Type = ${mark.type.name}, Attributes = ${markAttrs}`;
    }).join('\n');

    return `[Parsing Error] Deactivation during 'createAndFill()' operation:\n` +
           `- [Depth] ${level}\n` + 
           `- [Target Name] ${ctor.name}\n` +
           `- [Target Spec] ${Strings.stringify(ctor.spec)}\n` +
           `- [Target Attributes] ${attrsInfo}\n` +
           `- [Target Children]\n${children.length > 0 ? childrenInfo : '    No children'}\n` +
           `- [Target Marks]\n${marks.length > 0 ? marksInfo : '    No marks'}\n`;
}