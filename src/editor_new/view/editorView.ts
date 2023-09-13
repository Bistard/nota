import { Disposable } from "src/base/common/dispose";
import { IEditorViewModel } from "src/editor_new/common/viewModel";

export class EditorView extends Disposable {

    // [fields]

    private readonly _viewModel: IEditorViewModel;
    
    /**
     * The container that contains the whole editor view.
     */
    private readonly _container: HTMLElement;

    // [constructor]

    constructor(
        viewModel: IEditorViewModel,
        container: HTMLElement,
    ) {
        super();
        this._viewModel = viewModel;
        this._container = container;
    }

    // [public methods]

    
    // [private helper methods]

}