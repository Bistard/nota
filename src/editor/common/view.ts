import { IEditorViewCore } from "src/editor/view/editorViewCore";

export const enum EditorViewDisplayType {
    Plain,
    Split,
    WYSIWYG,
}

export interface IEditorView extends IEditorViewCore {

    /**
     * @description Updates the options of the editor view.
     * @param options The options.
     */
    updateOptions(options: Partial<IEditorViewOptions>): void;
}

export interface IEditorViewOptions {

    readonly display: EditorViewDisplayType;
}