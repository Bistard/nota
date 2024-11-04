import { EditorState, Transaction, TextSelection, Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { canJoin, findWrapping } from "prosemirror-transform";
import { NodeType } from "prosemirror-model";
import { Dictionary } from "src/base/common/utilities/type";
import { ProseNode } from "src/editor/common/proseMirror";
import { panic } from "src/base/common/utilities/panic";
import { TokenEnum } from "src/editor/common/markdown";
import { registerDefaultInputRules } from "src/editor/contrib/inputRuleExtension/editorInputRules";

/**
 * Defines the replacement behavior for an input rule.
 */
/**
 * Defines the replacement behavior for an input rule.
 * An input rule replacement can either be a direct string replacement or an 
 * object that specifies a node type, node attributes, and optional join conditions.
 */
export type InputRuleReplacement = 
    | string
    | {
        /** 
         * Specifies the type of node to create. 
         * Can be a string identifier or a `TokenEnum` enum.
         */
        readonly nodeType: string | TokenEnum;

        /** 
         * @description A function that generates node attributes based on the 
         * matched text. The attributes will eventually used for constructing 
         * the node instance ({@link ProseNode}).
         * @param matchedText The matched text.
         * @returns A dictionary of attributes for the new node.
         * 
         * @note If not defined, the attributes of the generated node would be `null`.
         */
        readonly getNodeAttribute?: (matchedText: RegExpExecArray) => Dictionary<string, any>;

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
class InputRule implements IInputRule {
    public readonly id: string;
    public readonly pattern: RegExp;
    public readonly replacement: InputRuleReplacement;

    constructor(id: string, pattern: RegExp, replacement: InputRuleReplacement) {
        this.id = id;
        this.pattern = pattern;
        this.replacement = replacement;

        // if (typeof replacement === 'string') {
        //     this.replacement = replacement;
        // } else {
        //     this.replacement = { nodeType: replacement.nodeType };
        // }
    }
}


/**
 * Represents an editor extension that allows for managing input rules,
 * enabling text patterns to be automatically replaced or formatted in the 
 * editor.
 */
export interface IEditorInputRuleExtension extends IEditorExtension {

    readonly id: EditorExtensionIDs.InputRule;

    /**
     * @description Registers a new input rule.
     * @param id A unique identifier for the rule.
     * @param pattern The regular expression pattern that triggers this rule.
     * @param replacement The replacement behavior when the pattern is matched. 
     *                    This can be a simple string or a more complex node 
     *                    configuration.
     * @returns Returns `true` if the rule was registered successfully, `false` 
     *          if a rule with the same ID or same {@link RegExp} already exists.
     */
    registerRule(id: string, pattern: RegExp, replacement: InputRuleReplacement): boolean;

    /**
     * @description Un-registers an input rule by its unique identifier.
     * @param id The identifier of the rule to remove.
     * @returns Returns `true` if the rule was found and removed, otherwise `false`.
     */
    unregisterRule(id: string): boolean;

    /**
     * @description Retrieves a registered input rule by its ID.
     * @param id The identifier of the desired rule.
     */
    getRuleByID(id: string): IInputRule | undefined;

    /**
     * @description Retrieves all registered input rules.
     */
    getAllRules(): IInputRule[];
}

/**
 * Implementation of the EditorInputRuleExtension.
 */
export class EditorInputRuleExtension extends EditorExtension implements IEditorInputRuleExtension {

    // [field]

    public override readonly id = EditorExtensionIDs.InputRule;
    public readonly _rules: Map<string, InputRule> = new Map();
    private _pluginAdded: boolean = false;
    
    // [constructor]

    constructor(editorWidget: IEditorWidget) {
        super(editorWidget);
        console.log("Initializing EditorInputRuleExtension");
        registerDefaultInputRules(this);
    }

    // [public methods]

    public registerRule(id: string, pattern: RegExp, replacement: InputRuleReplacement): boolean {
        if (this._rules.has(id)) {
            console.warn(`InputRule with id "${id}" already exists.`);
            return false;
        }

        if ([...this._rules.values()].some(rule => rule.pattern.source === pattern.source)) {
            console.warn(`InputRule with pattern "${pattern}" already exists.`);
            return false;
        }

        const rule = new InputRule(id, pattern, replacement);
        this._rules.set(id, rule);
        return true;
    }

    public unregisterRule(id: string): boolean {
        return this._rules.delete(id);
    }

    public getRuleByID(id: string): IInputRule | undefined {
        return this._rules.get(id);
    }

    public getAllRules(): IInputRule[] {
        return Array.from(this._rules.values());
    }

    // [protected methods]

    protected override onViewStateInit(state: EditorState): void {}

    protected override onViewInit(view: EditorView): void {
        if (!this._pluginAdded) {
            const plugins = this.getPlugins();
    
            const existingPluginKeys = view.state.plugins
                .map(plugin => plugin.spec.key)
                .filter((key): key is PluginKey => key instanceof PluginKey);
    
            const newPlugins = plugins.filter(plugin => {
                const pluginKey = plugin.spec.key;
                return !(pluginKey instanceof PluginKey) || !existingPluginKeys.includes(pluginKey);
            });
    
            if (newPlugins.length > 0) {
                // Move this line before updating the state
                this._pluginAdded = true;
                const newState = view.state.reconfigure({
                    plugins: view.state.plugins.concat(newPlugins),
                });
                view.updateState(newState);
            }
        }
    }
    

    protected override onViewDestroy(view: EditorView): void {
    }

    protected getPlugins(): Plugin[] {
        console.log("getPlugins called in EditorInputRuleExtension");
        const plugin = new Plugin({
            key: new PluginKey('inputRules'),
            props: {
                handleTextInput: (view, from, to, text) => {
                    return this.__handleTextInput(view, from, to, text);
                },
                handleDOMEvents: {
                    compositionend: (view) => {
                        // const { $cursor } = view.state.selection as TextSelection;
                        //     if ($cursor) {
                        //         this.__handleTextInput(view, $cursor.pos, $cursor.pos, '');
                        //     }
                        return false;
                    }
                }
            }
        });
        return [plugin];
    }

    // [private methods]

    private __handleTextInput(view: EditorView, from: number, to: number, text: string): boolean {
        const state = view.state;
        const $from = state.doc.resolve(from);
        const maxMatch = 500;
        const textBefore = $from.parent.textBetween(
            Math.max(0, $from.parentOffset - maxMatch),
            $from.parentOffset,
            undefined,
            '\ufffc'
        ) + text;
    
        console.log(`Text before cursor: "${textBefore}"`);
        let ruleMatched = false;
    
        for (const rule of this._rules.values()) {
            console.log(`Checking rule: ${rule.id} with pattern: ${rule.pattern}`);
            const match = rule.pattern.exec(textBefore);
            if (match) {
                console.log(`InputRule matched: ${rule.id}, Match: "${match[0]}"`);
                ruleMatched = true;
                const start = from - (match[0].length - text.length);
                const end = to;
                let tr: Transaction | null = null;
    
                if (typeof rule.replacement === 'string') {
                    tr = state.tr.insertText(rule.replacement, start, end);
                } 
                else {
                    const schemaNodeType = state.schema.nodes[rule.replacement.nodeType];
                    if (!schemaNodeType) {
                        console.warn(`Node type "${rule.replacement.nodeType}" not found in schema.`);
                        continue;
                    }
                    
                    tr = state.tr.delete(start, end);
                    const $start = tr.doc.resolve(start);
                    const range = $start.blockRange();
                    if (!range) {
                        continue;
                    }

                    const attr = rule.replacement.getNodeAttribute?.(match);        
                    const wrapping = findWrapping(range, schemaNodeType, attr);
                    if (!wrapping) {
                        continue;
                    }

                    tr.wrap(range, wrapping);
    
                    const before = tr.doc.resolve(start - 1).nodeBefore;
                    if (before && before.type === schemaNodeType && canJoin(tr.doc, start - 1)) {
                        tr.join(start - 1);
                    }
                }

                if (!tr) {
                    continue;
                }
    
                view.dispatch(tr);
                return true;
            }      
        }
    
        if (!ruleMatched) {
            console.log("No input rules matched.");
        }
        return false;
    }  
}