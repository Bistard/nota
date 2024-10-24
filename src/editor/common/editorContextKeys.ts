import { EditorType } from "src/editor/common/view";
import { CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";

export namespace EditorContextKeys {

    /** Is the editor is focused. */
    export const editorFocusedContext = CreateContextKeyExpr.Equal('isEditorFocused', true);

    /** Is the editor is currently readonly. */
    export const isEditorReadonly = CreateContextKeyExpr.Equal('isEditorReadonly', true);

    /** Is the editor is currently writable. */
    export const isEditorWritable = CreateContextKeyExpr.Equal('isEditorWritable', true);

    /** Is the editor is rendered as rich text. */
    export const richtextEditorMode = CreateContextKeyExpr.Equal('editorRenderMode', EditorType.Rich);

    /** Is the editor is rendered as plain text. */
    export const plaintextEditorMode = CreateContextKeyExpr.Equal('editorRenderMode', EditorType.Plain);

    /** Is the editor is rendered as split view. */
    export const splitViewEditorMode = CreateContextKeyExpr.Equal('editorRenderMode', EditorType.Split);
}