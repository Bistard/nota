import { EditorRenderMode, IEditorWidgetOptions } from "src/editor_new/common/editorConfiguration";
import { EditorWindowInstance } from "src/editor_new/view/editorWindows/editorWindowInstance";

/**
 * // TODO
 */
export class RichtextEditor extends EditorWindowInstance {

    // [fields]

    public readonly renderMode = EditorRenderMode.RichText;

    // [constructor]

    constructor() {
        super();
    }

    // [public methods]

    public async render(container: HTMLElement, options: IEditorWidgetOptions): Promise<void> {
        
    }

    // [private helper methods]
}
