import { Disposable } from "src/base/common/dispose";
import { IEditorWidgetOptions } from "src/editor_new/common/editorConfiguration";
import { IEditorView } from "src/editor_new/common/view";
import { IEditorViewModel } from "src/editor_new/common/viewModel";
import { EditorWindowHub } from "src/editor_new/view/editorWindow";

export class EditorView extends Disposable implements IEditorView {

    // [fields]

    private readonly _viewModel: IEditorViewModel;
    
    /** The options of the entire editor. */
    private readonly _options: IEditorWidgetOptions;

    /**
     * Editor Window Managing Hub
     */
    private readonly _editorWindowHub: EditorWindowHub;

    // [constructor]

    constructor(
        viewModel: IEditorViewModel,
        options: IEditorWidgetOptions,
    ) {
        super();
        this._viewModel = viewModel;
        this._options = options;

        this._editorWindowHub = new EditorWindowHub(options);

        this.render(this._options);
    }

    // [getter / setter]

    get container(): HTMLElement {
        return this._options.container;
    }

    // [public methods]

    public async render(options: IEditorWidgetOptions): Promise<void> {
        await this._editorWindowHub.render(this.container);
    }

    // [private helper methods]

}