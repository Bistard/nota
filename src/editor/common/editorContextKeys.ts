import { CreateContextKeyExpr } from "src/code/platform/context/common/contextKeyExpr";

export namespace EditorContextKeys {

    /** Is the editor is focused. */
    export const editorFocusedContext = CreateContextKeyExpr.Equal('isEditorFocused', true);
}