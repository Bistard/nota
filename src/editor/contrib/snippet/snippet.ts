import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { canJoin } from "prosemirror-transform";
import { Dictionary, isString } from "src/base/common/utilities/type";
import { ProseEditorView, ProseNode, ProseResolvedPos, ProseTextSelection } from "src/editor/common/proseMirror";
import { KeyCode } from "src/base/common/keyboard";
import { TokenEnum } from "src/editor/common/markdown";
import { ISnippetRule, SnippetRule } from "src/editor/contrib/snippet/snippetRule";
import { IInstantiationService, IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { ILogService } from "src/base/common/logger";
import { registerDefaultSnippet } from "src/editor/contrib/snippet/snippet.contrib";

/**
 * Defines the replacement behavior for an snippet rule. An snippet rule replacement 
 * can either be:
 *   1. a direct string replacement or 
 *   2. an object that specifies complicated replacement rule.
 */
export type SnippetReplacement = 
    | string 
    | MarkSnippetReplacement 
    | NodeSnippetReplacement;

type SnippetReplacementBase = {
    readonly type: string;

    readonly whenReplace: 'type' | 'enter';

    /** 
     * @description A function that generates node/mark attributes based on the 
     * matched text. The attributes will eventually used for constructing the 
     * node/mark instance ({@link ProseNode}).
     * @param matchedText The matched text.
     * @returns A dictionary of attributes for the new node/mark.
     * 
     * @note If not defined, the attributes of the generated node/mark would be 
     *       `null`.
     */
    readonly getAttribute?: (matchedText: RegExpExecArray, serviceProvider: IServiceProvider) => Dictionary<string, any>;
};

export type MarkSnippetReplacement = SnippetReplacementBase & {
    readonly type: 'mark';
    readonly markType: string;

    /**
     * @description After the mark is applied, should the following typed text
     * inherit this mark.
     */
    readonly preventMarkInheritance: boolean;
};

export type NodeSnippetReplacement = SnippetReplacementBase & {
    readonly type: 'node';
    /** 
     * Specifies the type of node to create when replacing. 
     */
    readonly nodeType: string | TokenEnum;

    /**
     * Determines the wrapping strategy to use when applying the snippet rule.
     * - `WrapBlock`: Wraps the matched content as a block-level element.
     * - `WrapTextBlock`: Wraps the matched content as a text block within a block-level container.
     * - `ReplaceBlock`: Replace the matched block as a new block-level element.
     */
    readonly wrapStrategy: 'WrapBlock' | 'WrapTextBlock' | 'ReplaceBlock';

    /**
     * Determines when should the replacement happens.
     * - `type`: Any keyboard typing will try to match content.
     * - `enter`: Only when pressing the key `enter` will try to match content.
     */
    readonly whenReplace: 'type' | 'enter';

    /** 
     * @description A predicate function that determines if the new node 
     * should join with the preceding node.
     * @param matchedText The matched text.
     * @param prevNode The previous node in the document, used to determine 
     *                 if a join is appropriate.
     * @returns Returns `true` if the new node should join with `prevNode`, 
     *          otherwise `false`.
     * 
     * @note If not defined, as long as {@link canJoin} returns true, the 
     *       node will be joined with previous node.
     */
    readonly shouldJoinWithBefore?: (matchedText: RegExpExecArray, prevNode: ProseNode) => boolean;
};

/**
 * An interface only for {@link EditorSnippetExtension}.
 */
export interface IEditorSnippetExtension extends IEditorExtension {

    readonly id: EditorExtensionIDs.Snippet;

    /**
     * @description Registers a new snippet rule.
     * @param id A unique identifier for the rule.
     * @param pattern The regular expression pattern that triggers this rule.
     * @param replacement The replacement behavior when the pattern is matched. 
     *                    This can be a simple string or a more complex node 
     *                    configuration.
     * @returns Returns `true` if the rule was registered successfully, `false` 
     *          if a rule with the same ID or same {@link RegExp} already exists.
     */
    registerRule(id: string, pattern: RegExp, replacement: SnippetReplacement): boolean;

    /**
     * @description Un-registers an snippet rule by its unique identifier.
     * @param id The identifier of the rule to remove.
     * @returns Returns `true` if the rule was found and removed, otherwise `false`.
     */
    unregisterRule(id: string): boolean;

    /**
     * @description Retrieves a registered snippet rule by its ID.
     * @param id The identifier of the desired rule.
     */
    getRuleByID(id: string): ISnippetRule | undefined;

    /**
     * @description Retrieves all registered snippet rules.
     */
    getAllRules(): ISnippetRule[];
}

export class EditorSnippetExtension extends EditorExtension implements IEditorSnippetExtension {

    // [field]

    public override readonly id = EditorExtensionIDs.Snippet;
    
    private readonly _rules: Map<string, SnippetRule> = new Map();
    private readonly MAX_TEXT_BEFORE = 100;
    
    // [constructor]

    constructor(
        editorWidget: IEditorWidget,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILogService private readonly logService: ILogService,
    ) {
        super(editorWidget);
        
        registerDefaultSnippet(this);

        this.__register(this.onTextInput(e => {
            const handled = this.__handleTextInput(e.view, e.from, e.to, e.text);
            if (handled) {
                e.preventDefault();
                return true;
            }
        }));

        this.__register(this.onKeydown(e => {
            if (e.event.key === KeyCode.Enter) {
                const handled = this.__handleEnter(e.view);
                if (handled) {
                    e.preventDefault();
                    return true;
                }
            }
        }));
    }

    // [public methods]

    public registerRule(id: string, pattern: RegExp, replacement: SnippetReplacement): boolean {
        if (this._rules.has(id)) {
            console.warn(`SnippetRule with id "${id}" already exists.`);
            return false;
        }

        if ([...this._rules.values()].some(rule => rule.pattern.source === pattern.source)) {
            console.warn(`SnippetRule with pattern "${pattern}" already exists.`);
            return false;
        }

        const rule = new SnippetRule(id, pattern, replacement, this.instantiationService);
        this._rules.set(id, rule);
        return true;
    }

    public unregisterRule(id: string): boolean {
        return this._rules.delete(id);
    }

    public getRuleByID(id: string): ISnippetRule | undefined {
        return this._rules.get(id);
    }

    public getAllRules(): ISnippetRule[] {
        return Array.from(this._rules.values());
    }

    // [protected methods]

    protected override onViewStateInit(state: EditorState): void {}

    protected override onViewInit(view: EditorView): void {}
    
    protected override onViewDestroy(view: EditorView): void {}

    // [private methods]

    private __handleTextInput(view: EditorView, from: number, to: number, text: string): boolean {
        const state = view.state;
        const $from = state.doc.resolve(from);
        return this.__matchRules(false, view, $from, text, from, to);
    }

    private __handleEnter(view: EditorView): boolean {
        const state = view.state;
        const { $cursor, empty } = state.selection as ProseTextSelection;
        if (!$cursor || !empty) {
            return false;
        }
        const end = $cursor.end();
        return this.__matchRules(true, view, $cursor, '', end, end);
    }

    private __matchRules(
        onEnter: boolean,
        view: ProseEditorView, 
        currPosition: ProseResolvedPos, 
        additionalText: string, 
        from: number, 
        to: number,
    ): boolean {
        const state = view.state;

        const textBefore = currPosition.parent.textBetween(
            Math.max(0, currPosition.parentOffset - this.MAX_TEXT_BEFORE),
            currPosition.parentOffset,
            null,
            '\ufffc'
        ) + additionalText;
        
        for (const rule of this._rules.values()) {
            const replaceOnEnter = isString(rule.replacement) ? false : rule.replacement.whenReplace === 'enter';
            if (replaceOnEnter !== onEnter) {
                continue;
            }

            const match = rule.pattern.exec(textBefore);
            if (match) {
                const start = from - (match[0].length - additionalText.length);
                const end = to;

                const tr = rule.onMatch(state, match, start, end);
                if (!tr) {
                    this.logService.warn('EditorSnippet', `Unable to achiece replacement for matched snippet rule: ${rule.id}.`);
                    continue;
                }

                view.dispatch(tr.scrollIntoView());
                return true;
            }      
        }
        
        return false;
    }
}