import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogEvent, LogLevel } from "src/base/common/logger";
import { Stack } from "src/base/common/util/array";
import { isNullable } from "src/base/common/util/type";
import { MarkEnum, TokenEnum } from "src/editor/common/markdown";
import { EditorToken } from "src/editor/common/model";
import { ProseAttrs, ProseMark, ProseMarkType, ProseNode, ProseNodeType, IProseTextNode } from "src/editor/common/proseMirror";
import { DocumentNodeProvider, IDocumentNode } from "src/editor/viewModel/parser/documentNode";
import { EditorSchema } from "src/editor/viewModel/schema";

/**
 * Interface only for {@link DocumentParser}.
 */
export interface IDocumentParser {
    
    /**
     * Fires when the parser wish to log out a message.
     */
    readonly onLog: Register<ILogEvent<string | Error>>;

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
     *               ignoreness.
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

    public readonly onLog: Register<ILogEvent<string | Error>>;

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
        
        this._state.parseTokens(tokens);
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

interface IParsingNodeState {
    readonly ctor: ProseNodeType;
    children: ProseNode[];
    marks: readonly ProseMark[];
    attrs?: ProseAttrs;
}

/**
 * Interface only for {@link DocumentParseState}.
 * The {@link IDocumentNode} has full accessbility to control the parsing flow.
 * The state provides a series of methods for different tokens so that they can 
 * decide how to parse themselves correctly.
 * 
 * @implements
 * The state will invoke {@link IDocumentNode.parseFromToken} for each token
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
    deactivateNode(): ProseNode | null;

    /**
     * @description Given an array of tokens and parses them recursively. All
     * the newly activated nodes will be inserted as the children of the current
     * active ones.
     * @param tokens The provided markdown tokens.
     */
    parseTokens(tokens: EditorToken[]): void;
    
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
     * @description Deactives the given mark. Stop automatically adding this
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

    private readonly _onLog = new Emitter<ILogEvent<string | Error>>();
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

        this._actives = new Stack([{ ctor: this._defaultNodeType, children: [], marks: [], attrs: undefined }]);
    }

    // [public methods]

    public parseTokens(tokens: EditorToken[]): void {
        for (const token of tokens) {
            
            const name = token.type;
            if (this._parser.isTokenIgnored(name)) {
                continue;
            }

            const node = this._nodeProvider.getNode(name) ?? this._nodeProvider.getMark(name);
            if (!node) {
                this._onLog.fire({
                    data: `cannot find any registered document nodes that matches the given token with type '${name}'`,
                    level: LogLevel.WARN,
                });
                continue;
            }
            
            node.parseFromToken(this, token);
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

    public deactivateNode(): ProseNode | null {
        const current = this.__popActive();
        
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

    public dispose(): void {
        this.clean();
        this._onLog.dispose();
    }

    // [private helper methods]

    private __getActive(): IParsingNodeState {
        if (this._actives.empty()) {
            throw new Error('Current document parsing state has no active tokens.');
        }
        return this._actives.top();
    }

    private __popActive(): IParsingNodeState {
        if (this._actives.empty()) {
            throw new Error('Current document parsing state has no active tokens.');
        }
        return this._actives.pop();
    }
}