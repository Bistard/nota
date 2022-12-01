import { Node as ProseNode } from "prosemirror-model";

export { EditorState as ProseEditorState } from "prosemirror-state";
export { Transaction, Plugin as ProsePlugin } from "prosemirror-state";
export { EditorView as ProseEditorView } from "prosemirror-view";
export { Slice } from "prosemirror-model";
export { MarkSpec as ProseMarkSpec, NodeSpec as ProseNodeSpec, Node as ProseNode, NodeType as ProseNodeType, MarkType as ProseMarkType, Attrs as ProseAttrs, Mark as ProseMark, Schema as ProseSchema } from "prosemirror-model";

export interface ProseTextNode extends ProseNode {
    withText(text: string): ProseTextNode;
}