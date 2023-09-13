import { Disposable } from "src/base/common/dispose";
import { IEditorModel } from "src/editor_new/common/model";
import { IEditorViewModel } from "src/editor_new/common/viewModel";

export class EditorViewModel extends Disposable implements IEditorViewModel {

    // [fields]

    private readonly _model: IEditorModel;

    // [constructor]

    constructor(
        model: IEditorModel,
    ) { 
        super();
        this._model = model;
    }

    // [public methods]


    // [private helper methods]
}