import { Disposable } from "src/base/common/dispose";
import { IEditorWidgetOptions } from "src/editor_new/common/editorConfiguration";
import { IEditorView } from "src/editor_new/common/view";
import { IEditorViewModel } from "src/editor_new/common/viewModel";

export class EditorView extends Disposable {

    // [fields]

    private readonly _viewModel: IEditorViewModel;
    
    /** The options of the entire editor. */
    private readonly _options: IEditorWidgetOptions;

    // [constructor]

    constructor(
        viewModel: IEditorViewModel,
        options: IEditorWidgetOptions,
    ) {
        super();
        this._viewModel = viewModel;
        this._options = options;
    }

    // [getter / setter]

    get container(): HTMLElement {
        return this._options.container;
    }

    // [public methods]

    
    // [private helper methods]

}