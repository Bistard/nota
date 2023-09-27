import { Disposable } from "src/base/common/dispose";
import { EditorRenderMode, IEditorWidgetOptions } from "src/editor_new/common/editorConfiguration";
import { RichtextEditor } from "src/editor_new/view/editorWindows/richTextEditor/richTextEditor";

export type EditorWindowType = RichtextEditor /** | SourceCodeEditor | SplitViewEditor */;

/**
 * // TODO
 */
export class EditorWindowHub extends Disposable {

    // [fields]

    private _editor?: EditorWindowType;
    private readonly _options: IEditorWidgetOptions;

    // [constructor]

    constructor(options: IEditorWidgetOptions) {
        super();
        this._editor = undefined;
        this._options = options;
    }

    // [public methods]

    public async render(container: HTMLElement): Promise<void> {
        
        this.__destroyCurrentWindow();

        const editor = this.__createNewWindow(this._options.renderMode);
        this._editor = editor;
        

        await editor.render(container, this._options);
    }

    // [private helper methods]

    private __createNewWindow(renderMode: EditorRenderMode): EditorWindowType {
        let editor: EditorWindowType;

        // rich-text
        if (renderMode === EditorRenderMode.RichText) {
            editor = new RichtextEditor();
        } 
        // ...
        // else if (0) {
        //     // ...
        // }
        // error
        else {
            throw new Error(`Currently does not support editor rendering mode other than 'richtext' yet: '${renderMode}'`);
        }

        return editor;
    }

    private __destroyCurrentWindow(): void {
        this._editor?.dispose();
        this._editor = undefined;
    }
}

