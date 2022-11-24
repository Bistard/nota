import { IEditorViewCore } from "src/editor/view/editorViewCore";

export const enum EditorViewDisplayType {
    Plain,
    Split,
    WYSIWYG,
}

export interface IEditorViewOptions {

    readonly display: EditorViewDisplayType;
}

export interface IEditorView extends IEditorViewCore {

}