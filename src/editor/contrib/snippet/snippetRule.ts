import { EditorState, Transaction } from "prosemirror-state";
import { canJoin, findWrapping } from "prosemirror-transform";
import { panic } from "src/base/common/utilities/panic";
import { ProseNodeSelection } from "src/editor/common/proseMirror";
import { SnippetReplacement, MarkSnippetReplacement, NodeSnippetReplacement } from "src/editor/contrib/snippet/snippet";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

/**
 * Represents an individual snippet rule.
 */
export interface ISnippetRule {
    /** 
     * Unique identifier for the snippet rule.
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
    readonly replacement: SnippetReplacement;
}

/**
 * @internal 
 * Internal representation of an snippet rule.
 */
export class SnippetRule implements ISnippetRule {

    // [fields]

    public readonly id: string;
    public readonly pattern: RegExp;
    public readonly replacement: SnippetReplacement;

    private readonly _replacementString?: string;
    private readonly _replacementObject?: Exclude<SnippetReplacement, string>;

    public readonly onMatch: (
        state: EditorState,
        match: RegExpExecArray,
        start: number,
        end: number
    ) => Transaction | null;

    // [constructor]

    constructor(id: string, pattern: RegExp, replacement: SnippetReplacement, private readonly instantiationService: IInstantiationService) {
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
                this.onMatch = this.__textblockTypeSnippetRule;
            } 
            else if (this.replacement.wrapStrategy === 'ReplaceBlock') {
                this.onMatch = this.__replaceBlockSnippetRule;
            }
            else {
                this.onMatch = this.__wrappingSnippetRule;
            }
        }
        else if (this.replacement.type === 'mark') {
            this._replacementObject = this.replacement;
            this.onMatch = this.__markSnippetRule;
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

    private __markSnippetRule(
        state: EditorState,
        match: RegExpExecArray,
        start: number,
        end: number
    ): Transaction | null {
        const replacement = this.replacement as MarkSnippetReplacement;
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
    
    private __wrappingSnippetRule(
        state: EditorState,
        match: RegExpExecArray,
        start: number,
        end: number
    ): Transaction | null {
        const replacement = this._replacementObject as NodeSnippetReplacement;
        const nodeType = state.schema.nodes[replacement.nodeType];
        if (!nodeType) {
            console.warn(`[EditorSnippetExtension] Node type "${replacement.nodeType}" not found in schema.`);
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
    
    private __textblockTypeSnippetRule(
        state: EditorState,
        match: RegExpExecArray,
        start: number,
        end: number
    ): Transaction | null {
        const replacement = this._replacementObject as NodeSnippetReplacement;
        const nodeType = state.schema.nodes[replacement.nodeType];
        if (!nodeType) {
            console.warn(`[EditorSnippetExtension] Node type "${replacement.nodeType}" not found in schema.`);
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

    private __replaceBlockSnippetRule(
        state: EditorState,
        match: RegExpExecArray,
        start: number,
        end: number
    ): Transaction | null {
        const replacement = this.replacement as NodeSnippetReplacement;
        const nodeType = state.schema.nodes[replacement.nodeType];
        if (!nodeType) {
            console.warn(`Node type "${replacement.nodeType}" not found`);
            return null;
        }
    
        if (nodeType.isInline) {
            const attrs = replacement.getAttribute?.(match, this.instantiationService);
            const newNode = nodeType.create(attrs);
            const tr = state.tr
                .delete(start, end)
                .insert(start, newNode);
            return tr;
        }

        const $pos = state.doc.resolve(start);
        const blockRange = $pos.blockRange();
        if (!blockRange) {
            return null;
        }
    
        const attrs = replacement.getAttribute?.(match, this.instantiationService);
        const newNode = nodeType.create(attrs);
        const tr = state.tr.replaceWith(blockRange.start, blockRange.end, newNode);
    
        // select it
        const newPos = tr.doc.resolve(blockRange.start);
        const selection = ProseNodeSelection.near(newPos);
        tr.setSelection(selection);
    
        return tr;
    }
}