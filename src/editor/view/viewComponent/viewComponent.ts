import { IDisposable } from "src/base/common/dispose";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorViewEventHandler } from "src/editor/view/editorViewEventHandler";


/**
 * @class // TODO
 */
export class EditorViewComponent extends EditorViewEventHandler {

    public readonly viewModel: IEditorViewModel;

    constructor(viewModel: IEditorViewModel) {
        super();
        this.viewModel = viewModel;
    }

    public addViewComponent(id: string, component: EditorViewComponent): IDisposable {
        return this.viewModel.addViewComponent(id, component);
    }
}