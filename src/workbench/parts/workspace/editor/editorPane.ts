import { Disposable } from "src/base/common/dispose";
import { EditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";
import { EditorPaneView } from "src/workbench/services/editorPane/editorPaneView";

export interface IEditorPaneCollection extends Disposable {

    openEditor(model: EditorPaneModel): Promise<void>;
}

/**
 * {@link EditorPaneCollection}
 * 
 * @description // TODO
 * 
 * Structure:
 *             (focused)             (unfocused)
 *               Tab 1                  Tab 2
 *       +==================+    +==================+
 *       |     (Visible)    |    |    (Invisible)   |
 *       |                  |    |                  |
 *       |      View 1      |    |      View 2      |
 *       |                  |    |                  |
 *       +==================+    +==================+
 */
export class EditorPaneCollection extends Disposable implements IEditorPaneCollection {

    // [fields]

    private readonly _editorPanes: EditorPaneView[];

    // [constructor]

    constructor() {
        super();

        this._editorPanes = [];
    }

    // [public methods]

    public async openEditor(model: EditorPaneModel): Promise<void> {
        
    }
}