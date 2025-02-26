import { EditorDragState } from "src/editor/common/cursorDrop";
import { EditorType } from "src/editor/common/view";
import { CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";

export namespace EditorContextKeys {
    export const editorFocusedContext = CreateContextKeyExpr.Equal('isEditorFocused', true);
    export const isEditorReadonly = CreateContextKeyExpr.Equal('isEditorReadonly', true);
    export const isEditorWritable = CreateContextKeyExpr.Equal('isEditorWritable', true);
    export const isEditorEditable = CreateContextKeyExpr.And(editorFocusedContext, isEditorWritable);
    export const richtextEditorMode = CreateContextKeyExpr.Equal('editorRenderMode', EditorType.Rich);
    export const plaintextEditorMode = CreateContextKeyExpr.Equal('editorRenderMode', EditorType.Plain);
    export const splitViewEditorMode = CreateContextKeyExpr.Equal('editorRenderMode', EditorType.Split);
    export const isEditorDragging = CreateContextKeyExpr.NotEqual('editorDragState', EditorDragState.None);
    export const isEditorBlockDragging = CreateContextKeyExpr.Equal('editorDragState', EditorDragState.Block);
}