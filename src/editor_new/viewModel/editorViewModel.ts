import { Disposable } from "src/base/common/dispose";
import { IEditorWidgetOptions } from "src/editor_new/common/editorConfiguration";
import { IEditorModel } from "src/editor_new/common/model";
import { IEditorViewModel } from "src/editor_new/common/viewModel";

export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [fields]

    private readonly _model: IEditorModel;

    /** The options of the entire editor. */
    private readonly _options: IEditorWidgetOptions;

    // [constructor]

    constructor(
        model: IEditorModel,
        options: IEditorWidgetOptions,
    ) { 
        super();
        this._model = model;
        this._options = options;
    }

    // [public methods]


    // [private helper methods]
}