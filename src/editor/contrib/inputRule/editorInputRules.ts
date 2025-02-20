import { EditorState, Transaction } from "prosemirror-state";
import { canJoin, findWrapping } from "prosemirror-transform";
import { panic } from "src/base/common/utilities/panic";
import { MarkEnum, TokenEnum } from "src/editor/common/markdown";
import { IEditorInputRuleExtension, InputRuleReplacement, MarkInputRuleReplacement, NodeInputRuleReplacement } from "src/editor/contrib/inputRule/inputRule";
import { CodeBlockAttrs } from "src/editor/model/documentNode/node/codeBlock/codeBlock";
import { HeadingAttrs } from "src/editor/model/documentNode/node/heading";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

export function registerDefaultInputRules(extension: IEditorInputRuleExtension): void {

    extension.registerRule("emDashRule", /--$/, "—");
    extension.registerRule("ellipsisRule", /\.\.\.$/, "…");
    extension.registerRule("openDoubleQuoteRule", /(?:^|[\s{[(<'"\u2018\u201C])(")$/, "“");
    extension.registerRule("closeDoubleQuoteRule", /"$/, "”");
    extension.registerRule("openSingleQuoteRule", /(?:^|[\s{[(<'"\u2018\u201C])(')$/, "‘");
    extension.registerRule("closeSingleQuoteRule", /'$/, "’");

    // Heading Rule: Matches "#" followed by a space
    extension.registerRule("headingRule", /^(#{1,6})\s$/, 
        {
            type: 'node',
            nodeType: TokenEnum.Heading,
            whenReplace: 'type',
            getAttribute: (match): HeadingAttrs => {
                return { 
                    level: match[1]?.length,
                };
            },
            wrapStrategy: 'WrapTextBlock'
        }
    );

    // Blockquote Rule: Matches ">" followed by a space
    extension.registerRule("blockquoteRule", /^>\s$/, 
        { 
            type: 'node',
            nodeType: TokenEnum.Blockquote,
            whenReplace: 'type',
            wrapStrategy: 'WrapBlock'
        }
    );

    // Code Block Rule: Matches triple backticks
    extension.registerRule("codeBlockRule", /^```(.*)\s*$/, 
        { 
            type: 'node',
            nodeType: TokenEnum.CodeBlock,
            whenReplace: 'enter',
            getAttribute: (match): CodeBlockAttrs => {
                const lang = match[1];
                return {
                    lang: lang ?? 'Unknown',
                };
            },
            wrapStrategy: 'WrapTextBlock'
        }
    );

    extension.registerRule("orderedListRule", /^(\d+)\.\s$/,
         {
            type: 'node',
            nodeType: TokenEnum.List,
            whenReplace: 'type',
            getAttribute: (match) => {
                if (match && match[1]) {
                    return { ordered: true, start: parseInt(match[1]) };
                }
                return { ordered: true, start: 1, };
            },
            shouldJoinWithBefore: (match, prevNode) => {
                if (match && match[1]) {
                    return prevNode.type.name === TokenEnum.List && prevNode.attrs["order"] + 1 === +match[1];
                }
                return false;
            }, 
            wrapStrategy: 'WrapBlock'
         }
    );

    extension.registerRule("bulletListRule", /^\s*([-+*])\s$/,
        {
            type: 'node',
            nodeType: TokenEnum.List,
            whenReplace: 'type',
            wrapStrategy: 'WrapBlock'
        }
    );

    extension.registerRule("strongRule", /\*\*(.+?)\*\*$/, {
        type: 'mark',
        markType: MarkEnum.Strong,
        whenReplace: 'type',
        preventMarkInheritance: true,
    });
    
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

    // [fields]

    public readonly id: string;
    public readonly pattern: RegExp;
    public readonly replacement: InputRuleReplacement;

    private readonly _replacementString?: string;
    private readonly _replacementObject?: Exclude<InputRuleReplacement, string>;

    public readonly onMatch: (
        state: EditorState,
        match: RegExpExecArray,
        start: number,
        end: number
    ) => Transaction | null;

    // [constructor]

    constructor(id: string, pattern: RegExp, replacement: InputRuleReplacement, private readonly instantiationService: IInstantiationService) {
        this.id = id;
        this.pattern = pattern;
        this.replacement = replacement;

        if (typeof this.replacement === 'string') {
            this._replacementString = this.replacement;
            this.onMatch = this.__onSimpleStringMatch;
        } 
        else if (this.replacement.type === 'node') {
            this._replacementObject = this.replacement;
            if (this.replacement.wrapStrategy === 'WrapTextBlock') {
                this.onMatch = this.__textblockTypeInputRule;
            } else {
                this.onMatch = this.__wrappingInputRule;
            }
        }
        else if (this.replacement.type === 'mark') {
            this._replacementObject = this.replacement;
            this.onMatch = this.__markInputRule;
        } else {
            panic(`Invalid replacement type: ${this.replacement['type']}`);
        }
    }

    // [private methods]

    private __onSimpleStringMatch(
        state: EditorState,
        match: RegExpMatchArray,
        start: number,
        end: number
    ): Transaction | null {
        let insert = this._replacementString!;
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

    private __markInputRule(
        state: EditorState,
        match: RegExpExecArray,
        start: number,
        end: number
    ): Transaction | null {
        const replacement = this.replacement as MarkInputRuleReplacement;
        const markType = state.schema.marks[replacement.markType];
        if (!markType) {
            console.warn(`Mark type "${replacement.markType}" not found`);
            return null;
        }

        const text = match[1]!;
        const tr = state.tr
            .delete(start, end)
            .insertText(text, start);
        
        const attrs = replacement.getAttribute?.(match, this.instantiationService);
        const mark = markType.create(attrs);
        tr.addMark(start, start + text.length, mark);
        
        if (replacement.preventMarkInheritance) {
            tr.setStoredMarks([]);
        }
        
        return tr;
    }
    
    private __wrappingInputRule(
        state: EditorState,
        match: RegExpExecArray,
        start: number,
        end: number
    ): Transaction | null {
        const replacement = this._replacementObject as NodeInputRuleReplacement;
        const nodeType = state.schema.nodes[replacement.nodeType];
        if (!nodeType) {
            console.warn(`[EditorInputRuleExtension] Node type "${replacement.nodeType}" not found in schema.`);
            return null;
        }
    
        const attrs = replacement.getAttribute?.(match, this.instantiationService);
        const tr = state.tr.delete(start, end);
        const $start = tr.doc.resolve(start);
        const range = $start.blockRange();
        
        const wrapping = range && findWrapping(range, nodeType, attrs);
        if (!wrapping) {
            return null;
        }
        tr.wrap(range!, wrapping);

        const before = tr.doc.resolve(start - 1).nodeBefore;
        if (
            before &&
            before.type === nodeType &&
            canJoin(tr.doc, start - 1) &&
            (!replacement.shouldJoinWithBefore || replacement.shouldJoinWithBefore(match, before))
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
        const replacement = this._replacementObject as NodeInputRuleReplacement;
        const nodeType = state.schema.nodes[replacement.nodeType];
        if (!nodeType) {
            console.warn(`[EditorInputRuleExtension] Node type "${replacement.nodeType}" not found in schema.`);
            return null;
        }
    
        const attrs = replacement.getAttribute?.(match, this.instantiationService);
        const $start = state.doc.resolve(start);
        if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)) {
            return null;
        }

        return state.tr
            .delete(start, end)
            .setBlockType(start, start, nodeType, attrs);
    }
}