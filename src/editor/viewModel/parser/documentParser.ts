import { Stack } from "src/base/common/util/array";
import { EditorToken } from "src/editor/common/model";
import { ProseAttrs, ProseMark, ProseMarkType, ProseNode, ProseNodeType, ProseTextNode } from "src/editor/common/prose";
import { DocumentNodeProvider, IDocumentNode } from "src/editor/viewModel/parser/documentNode";
import { EditorSchema } from "src/editor/viewModel/schema";

export interface IDocumentParser {
    parse(tokens: EditorToken[]): ProseNode | null;
}

/**
 * @class Parsing markdown tokens into document nodes that are used for 
 * rendering purpose in prosemirror view.
 */
export class DocumentParser implements IDocumentParser {
    
    // [field]

    private readonly _state: DocumentParseState;

    // [constructor]

    constructor(
        schema: EditorSchema,
        nodeProvider: DocumentNodeProvider,
    ) {
        this._state = new DocumentParseState(schema, nodeProvider);
    }

    // [public methods]

    public parse(tokens: EditorToken[]): ProseNode | null {        
        
        this._state.parseTokens(tokens);
        const documentRoot = this._state.complete();
        this._state.clean();
        
        return documentRoot;
    }
}

interface ParsingNodeState {
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
    activateNode(ctor: ProseNodeType): void;
    deactivateNode(): ProseNode | null;
    parseTokens(tokens: EditorToken[]): void;
    
    addToActive(ctor: ProseNodeType, attr?: ProseAttrs): ProseNode | null;
    addText(text: string): void;

    activateMark(mark: ProseMark): void;
    deactivateMark(mark: ProseMarkType): void;

    getActiveNode(): ProseNodeType | null;
    getActiveMark(): readonly ProseMark[];
}

/**
 * @internal
 * @class Use to maintain the parsing process for each parse request from the
 * {@link DocumentParser}.
 */
class DocumentParseState implements IDocumentParseState {

    // [field]

    private readonly _defaultNodeType: ProseNodeType;
    private readonly _createTextNode: (text: string, marks?: readonly ProseMark[]) => ProseTextNode;
    private readonly _nodeProvider: DocumentNodeProvider;
    private _actives: Stack<ParsingNodeState>;

    // [constructor]

    constructor(
        schema: EditorSchema,
        provider: DocumentNodeProvider,
    ) {
        this._defaultNodeType = schema.topNodeType;
        this._createTextNode = schema.text.bind(schema);
        this._nodeProvider = provider;

        this._actives = new Stack([{ ctor: this._defaultNodeType, children: [], marks: [], attrs: undefined }]);
    }

    // [public methods]

    public parseTokens(tokens: EditorToken[]): void {
        for (const token of tokens) {
            const name = token.type;
            const node = this._nodeProvider.getNode(name) ?? this._nodeProvider.getMark(name);
            if (!node) {
                throw new Error(`cannot find any registered document nodes that matches the given token with type '${name}'`);
            }
            
            node.parseFromToken(this, token);
        }
    }

    public complete(): ProseNode | null {
        let root: ProseNode | null = null;
        while (!this._actives.empty()) {
            root = this.deactivateNode();
        }
        return root ?? this._defaultNodeType.createAndFill();
    }

    public clean(): void {
        this._actives.clear();
    }

    // [public methods]

    public activateNode(ctor: ProseNodeType): void {
        this._actives.push({
            ctor: ctor,
            children: [],
            marks: [],
            attrs: undefined,
        });
    }

    public addToActive(ctor: ProseNodeType, attr?: ProseAttrs, children?: ProseNode[]): ProseNode | null {
        const active = this.__getActive();
        const proseNode = ctor.createAndFill(attr, children, active.marks);
        if (!proseNode) {
            return null;
        }

        active.children.push(proseNode);
        return proseNode;
    }

    public deactivateNode(): ProseNode | null {
        const active = this.__popActive();
        if (this._actives.empty()) {
            // the root document node
            return active.ctor.createAndFill(active.attrs, active.children, active.marks);
        }

        const node = this.addToActive(active.ctor, active.attrs, active.children);
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

        const mergable = (node1: ProseNode, node2: ProseNode): boolean => {
            if (node1.isText && node2.isText && ProseMark.sameSet(node1.marks, node2.marks)) {
                return true;
            }
            return false;
        };

        if (!mergable(previous, textNode)) {
            active.children.push(textNode);
            return;
        };

        if (!previous.text || !textNode.text) {
            active.children[lastIdx] = (previous.text) ? previous : textNode;
            return;
        }
        
        const newText = previous.text + textNode.text;
        const mergedNode = (<ProseTextNode>previous).withText(newText);
        
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

    // [private helper methods]

    private __getActive(): ParsingNodeState {
        if (this._actives.empty()) {
            throw new Error('Current document parsing state has no active tokens.');
        }
        return this._actives.top();
    }

    private __popActive(): ParsingNodeState {
        if (this._actives.empty()) {
            throw new Error('Current document parsing state has no active tokens.');
        }
        return this._actives.pop();
    }
}