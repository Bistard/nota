
export const enum EditorRenderMode {
    Source = 'source',
    SplitView = 'splitview',
    RichText = 'richtext',
}

export interface IEditorWidgetOptions {

    /**
     * The container that will contain the entire editor view.
     */
    readonly container: HTMLElement;

    /**
     * {@link EditorRenderMode} The type of rendering for the entire editor.
     */
    readonly renderMode: EditorRenderMode;
}