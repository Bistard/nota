import { EditorState, Transaction } from "prosemirror-state";
import { canJoin, findWrapping } from "prosemirror-transform";
import { CodeEditorView, minimalSetup } from "src/editor/common/codeMirror";
import { TokenEnum } from "src/editor/common/markdown";
import { IEditorInputRuleExtension, InputRuleReplacement } from "src/editor/contrib/inputRuleExtension/inputRuleExtension";

export function registerDefaultInputRules(extension: IEditorInputRuleExtension): void {
    console.log("Registering default input rules"); // Add this line

    // Heading Rule: Matches "#" followed by a space
    extension.registerRule("headingRule", /^(#{1,6})\s$/, 
        {
            nodeType: TokenEnum.Heading ,
            getNodeAttribute: (match) => {
                return { level: 1 };
            },
            wrapType: 'WrapTextBlock'
        }
    );

    // Blockquote Rule: Matches ">" followed by a space
    extension.registerRule("blockquoteRule", /^>\s$/, 
        { 
            nodeType: TokenEnum.Blockquote,
            wrapType: 'WrapBlock'
        }
    );

    // Code Block Rule: Matches triple backticks
    extension.registerRule("codeBlockRule", /^```$/, 
        { 
            nodeType: TokenEnum.CodeBlock,
            getNodeAttribute: (match) => {
                const view = new CodeEditorView({
                    doc: '',
                    extensions: [minimalSetup],
                });
                return { 
                    view: view,
                    lang: '',
                };
            },
            wrapType: 'WrapTextBlock'
        }
    );
}

/**
 * Represents an individual input rule.
 */
export interface IInputRule {
    /** 
     * Unique identifier for the input rule.
     */
    readonly id: string;

    /** 
     * Regular expression pattern that triggers the rule when matched in the 
     * editor.
     */
    readonly pattern: RegExp;

    /** 
     * Defines the replacement strategy, either as a string or as a configuration 
     * object that specifies the `nodeType` to wrap around the matched text.
     */
    readonly replacement: InputRuleReplacement;
}

/**
 * @internal 
 * Internal representation of an input rule.
 */
export class InputRule implements IInputRule {
    public readonly id: string;
    public readonly pattern: RegExp;
    public readonly replacement: InputRuleReplacement;

    public readonly replacementString?: string;
    public readonly replacementObject?: Exclude<InputRuleReplacement, string>;

    public readonly onMatch: (
        state: EditorState,
        match: RegExpExecArray,
        start: number,
        end: number
    ) => Transaction | null;

    constructor(id: string, pattern: RegExp, replacement: InputRuleReplacement) {
        this.id = id;
        this.pattern = pattern;
        this.replacement = replacement;

        if (typeof this.replacement !== 'string') {
            this.replacementObject = this.replacement;
            if (this.replacement.wrapType === 'WrapTextBlock') {
                this.onMatch = this.__textblockTypeInputRule.bind(this);
            } else {
                this.onMatch = this.__wrappingInputRule.bind(this);
            }
        } else {
            this.replacementString = this.replacement;
            this.onMatch = this.__onSimpleStringMatch.bind(this);
        }
    }

    private __onSimpleStringMatch(
        state: EditorState,
        match: RegExpMatchArray,
        start: number,
        end: number
    ): Transaction | null {
        let insert = this.replacementString!;
        if (match[1]) {
            const offset = match[0].lastIndexOf(match[1]);
            insert += match[0].slice(offset + match[1].length);
            start += offset;
            const cutOff = start - end;
            if (cutOff > 0) {
                insert = match[0].slice(offset - cutOff, offset) + insert;
                start = end;
            }
        }
        return state.tr.insertText(insert, start, end);
    }
    
    private __wrappingInputRule(
        state: EditorState,
        match: RegExpExecArray,
        start: number,
        end: number
    ): Transaction | null {
        const replacement = this.replacementObject!;
        const schemaNodeType = state.schema.nodes[replacement.nodeType];
        if (!schemaNodeType) {
            console.warn(`Node type "${replacement.nodeType}" not found in schema.`);
            return null;
        }
    
        const getAttrs = replacement.getNodeAttribute;
        const shouldJoinWithBefore = replacement.shouldJoinWithBefore;
    
        const attrs = typeof getAttrs === "function" ? getAttrs(match) : null;
        const tr = state.tr.delete(start, end);
        const $start = tr.doc.resolve(start);
        const range = $start.blockRange();
        const wrapping = range && findWrapping(range, schemaNodeType, attrs);
        if (!wrapping) return null;
        tr.wrap(range!, wrapping);
        const before = tr.doc.resolve(start - 1).nodeBefore;
        if (
            before &&
            before.type === schemaNodeType &&
            canJoin(tr.doc, start - 1) &&
            (!shouldJoinWithBefore || shouldJoinWithBefore(match, before))
        ) {
            tr.join(start - 1);
        }
        return tr;
    }
    
    private __textblockTypeInputRule(
        state: EditorState,
        match: RegExpExecArray,
        start: number,
        end: number
    ): Transaction | null {
        const replacement = this.replacementObject!;
        const schemaNodeType = state.schema.nodes[replacement.nodeType];
        if (!schemaNodeType) {
            console.warn(`Node type "${replacement.nodeType}" not found in schema.`);
            return null;
        }
    
        const getAttrs = replacement.getNodeAttribute;
        const attrs = typeof getAttrs === "function" ? getAttrs(match) : null;
        const $start = state.doc.resolve(start);
        if (
            !$start
                .node(-1)
                .canReplaceWith($start.index(-1), $start.indexAfter(-1), schemaNodeType)
        )
            return null;
        return state.tr.delete(start, end).setBlockType(start, start, schemaNodeType, attrs);
    }
}