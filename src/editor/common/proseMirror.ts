import { Node as ProseNode } from "prosemirror-model";

export { 
    EditorState as ProseEditorState,
    NodeSelection as ProseNodeSelection,
    Transaction as ProseTransaction,
    Plugin as ProseExtension,
    Command as ProseCommand,
    AllSelection as ProseAllSelection,
    TextSelection as ProseTextSelection,
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
    Schema as ProseSchema,
    ResolvedPos as ProseResolvedPos,
} from "prosemirror-model";

export interface IProseTextNode extends ProseNode {
    withText(text: string): IProseTextNode;
}
