import { panic } from "src/base/common/utilities/panic";
import { Dictionary } from "src/base/common/utilities/type";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorToken } from "src/editor/common/model";
import { ProseDOMOutputSpec, ProseMarkSpec, ProseMarkType, ProseNodeSpec, ProseNodeType } from "src/editor/common/proseMirror";
import { IDocumentParseState } from "src/editor/viewModel/parser/parser";
import { EditorSchema } from "src/editor/viewModel/schema";

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

// #region `createDomOutputFromOptions`

/**
 * Type representing different options for DOM output specification when 
 * ProseMirror is parsing from a {@link ProseNode} to the real DOM.
 * It can be either:
 *  - a text node, 
 *  - a DOM node, 
 *  - or a nested node.
 */
export type DomOutputOptions = 
    DomOutputTextNode | 
    DomOutputDomNode | 
    DomOutputNode;

/**
 * Type representing a node which is interpreted as a text node.
 */
export type DomOutputTextNode = {
    readonly type: 'text';
    readonly text: string;
};

/**
 * Type representing a node which is interpreted as the DOM node itself. 
 */
export type DomOutputDomNode = {
    readonly type: 'dom';
    readonly dom: HTMLElement;
    readonly contentDom?: HTMLElement;
};

/**
 * Type representing a node which is interpreted as nested nodes.
 */
export type DomOutputNode = {
    readonly type: 'node';
    readonly tagName: string;
    readonly attributes?: Dictionary<string, string>;
} & (
    /**
     * Either the node is editable 
     */
    {
        /**
         * @note When this sets to `true`, the will ONLY be a placeholder, a `0`, 
         *       a.k.a the 'hole', appended to the parent. Because the placeholder
         *       must be the only child of the parent.
         * @note The 'hole' is used to indicate the place where a node's child 
         *       nodes should be inserted.
         */
        readonly editable: true;
    } |
    // or the parent contains children
    {
        readonly editable: false;
        readonly children?: DomOutputOptions[];
    } 
);

/**
 * @description A helper function that uses our own defined interface to create 
 * a ProseMirror {@link ProseDOMOutputSpec}.
 * @param option The DOM output option to be converted.
 * @returns The ProseMirror DOM output specification.
 * 
 * @panic If the type of {@link DomOutputOptions} is unknown.
 */
export function createDomOutputFromOptions(option: DomOutputOptions): ProseDOMOutputSpec {
    switch (option.type) {
        case 'text':
            return option.text;
        case 'dom':
            if (!option.contentDom) {
                return option.dom;
            }
            return { dom: option.dom, contentDOM: option.contentDom };
        case 'node': {
            const { tagName, attributes, editable } = option;
            const output: [string, ...any[]] = [tagName];
            
            if (attributes) {
                output.push(attributes);
            }
            
            // the placeholder can only be the only child of the parent
            if (editable === true) {
                output.push(0);
            } 
            // if children is provided
            else {
                const { children } = option;
                for (const child of children ?? []) {
                    output.push(createDomOutputFromOptions(child));
                }
            }

            return output;
        }
        default:
            panic(`[createDomOutputFromOptions] Unknown DomOutputOptions type: '${option['type']}'`);
    }
}

// #endregion