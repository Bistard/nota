import { Node as ProseNode } from "prosemirror-model";

export {
    ReplaceStep as ProseReplaceStep
} from "prosemirror-transform";

export { 
    EditorState as ProseEditorState,
    NodeSelection as ProseNodeSelection,
    Transaction as ProseTransaction,
    Plugin as ProseExtension,
    Command as ProseCommand,
    Selection as ProseSelection,
    AllSelection as ProseAllSelection,
    TextSelection as ProseTextSelection,
    SelectionRange as ProseSelectionRange,
} from "prosemirror-state";

export { 
    EditorView as ProseEditorView, 
    EditorProps as ProseEditorProperty, 
    DirectEditorProps as ProseDirectEditorProperty,
    EditorProps as ProseEditorProps,
} from "prosemirror-view";

export { 
    Slice as ProseSlice,
    ContentMatch as ProseContentMatch,
    MarkSpec as ProseMarkSpec, 
    NodeSpec as ProseNodeSpec, 
    Node as ProseNode, 
    NodeType as ProseNodeType, 
    MarkType as ProseMarkType, 
    Attrs as ProseAttrs, 
    Mark as ProseMark, 
    Fragment as ProseFragment,
    Schema as ProseSchema,
    ResolvedPos as ProseResolvedPos,
    DOMOutputSpec as ProseDOMOutputSpec,
} from "prosemirror-model";

export interface IProseTextNode extends ProseNode {
    withText(text: string): IProseTextNode;
}
