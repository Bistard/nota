import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { IEditorView, IEditorViewOptions } from "src/editor/common/view";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorViewCore } from "src/editor/view/editorViewCore";

export class EditorView extends Disposable implements IEditorView {

    // [fields]

    private readonly _view: EditorViewCore;
    private readonly _ctx: ViewContext;

    // [events]

    public readonly onRender: Register<void>;

    // [constructor]
    
    constructor(
        container: HTMLElement,
        viewModel: IEditorViewModel,
        options: IEditorViewOptions,
    ) {
        super();
        const ctx = new ViewContext(viewModel, options);
        this._ctx = ctx;

        const editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container';

        this._view = new EditorViewCore(editorContainer, ctx);
        this.onRender = this._view.onRender;
        
        // update listener registration from view-model
        this.__registerViewModelListeners();

        // resource registration
        container.appendChild(editorContainer);
        this.__register(this._view);
    }

    // [public methods]

    public isEditable(): boolean {
        return this._view.isEditable();
    }

    public focus(): void {
        this._view.focus();
    }

    public isFocused(): boolean {
        return this._view.isFocused();
    }

    public destroy(): void {
        this.dispose();
    }

    public isDestroyed(): boolean {
        return this.isDisposed();
    }

    public override dispose(): void {
        super.dispose();
    }

    // [private helper methods]

    private __registerViewModelListeners(): void {
        const viewModel = this._ctx.viewModel;

        viewModel.onFlush(doc => {
            this._view.updateContent(doc);
        });
    }
}

export class ViewContext {

    constructor(
        public readonly viewModel: IEditorViewModel,
        public readonly options: IEditorViewOptions,
    ) {}
}