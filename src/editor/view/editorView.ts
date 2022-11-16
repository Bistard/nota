import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { IEditorView, IEditorViewOptions } from "src/editor/common/view";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorViewCore, IEditorViewCore } from "src/editor/view/editorViewCore";

export class EditorView extends Disposable implements IEditorView {

    // [fields]

    private readonly _view: IEditorViewCore;
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
        this._ctx = new ViewContext(viewModel, options);

        const editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container';

        this._view = new EditorViewCore(editorContainer);

        this.onRender = this._view.onRender;
        
        container.appendChild(editorContainer);
        this.__register(this._view);

        this.__registerViewModelListeners();
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

        viewModel.onFlush((contents: string[]) => {
            console.log(contents);
        });
    }
}

class ViewContext {

    constructor(
        public readonly viewModel: IEditorViewModel,
        public readonly options: IEditorViewOptions,
    ) {}
}