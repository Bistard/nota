import { IDisposable } from "src/base/common/dispose";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorViewEventHandler } from "src/editor/view/viewComponent/editorViewEventHandler";


/**
 * @class // TODO
 */
export abstract class EditorViewComponent extends EditorViewEventHandler {

    public readonly viewModel: IEditorViewModel;

    constructor(viewModel: IEditorViewModel) {
        super();
        this.viewModel = viewModel;
    }

    public addViewComponent(id: string, component: EditorViewComponent): IDisposable {
        return this.viewModel.addViewComponent(id, component);
    }

    public abstract render(): void;
}