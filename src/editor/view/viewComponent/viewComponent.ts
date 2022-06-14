import { IEditorViewModel } from "src/editor/common/viewModel";

/**
 * @class // TODO
 */
 export class EditorViewComponent {

    public readonly viewModel: IEditorViewModel;

    constructor(viewModel: IEditorViewModel) {
        this.viewModel = viewModel;
    }

}