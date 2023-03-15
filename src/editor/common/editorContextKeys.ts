import { CreateContextKeyExpr } from "src/code/platform/context/common/contextKeyExpr";
import { EditorType } from "src/editor/common/viewModel";

export namespace EditorContextKeys {

    /** Is the editor is focused. */
    export const editorFocusedContext = CreateContextKeyExpr.Equal('isEditorFocused', true);

    /** Is the editor is rendered as rich text. */
    export const richtextEditorMode = CreateContextKeyExpr.Equal('editorRenderMode', EditorType.Rich);

    /** Is the editor is rendered as plain text. */
    export const plaintextEditorMode = CreateContextKeyExpr.Equal('editorRenderMode', EditorType.Plain);

    /** Is the editor is rendered as split view. */
    export const splitviewEditorMode = CreateContextKeyExpr.Equal('editorRenderMode', EditorType.Split);
}