import { Node as ProseNode } from "prosemirror-model";

export { EditorState as ProseEditorState } from "prosemirror-state";
export { Transaction as ProseTransaction, Plugin as ProseExtension, Command as ProseCommand } from "prosemirror-state";
export { EditorView as ProseEditorView, EditorProps as ProseEditorProperty, DirectEditorProps as ProseDirectEditorProperty } from "prosemirror-view";
export { Slice as ProseSlice } from "prosemirror-model";
export { MarkSpec as ProseMarkSpec, NodeSpec as ProseNodeSpec, Node as ProseNode, NodeType as ProseNodeType, MarkType as ProseMarkType, Attrs as ProseAttrs, Mark as ProseMark, Schema as ProseSchema } from "prosemirror-model";

export interface IProseTextNode extends ProseNode {
    withText(text: string): IProseTextNode;
}