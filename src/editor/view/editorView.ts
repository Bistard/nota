import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { IEditorView, IEditorViewOptions } from "src/editor/common/view";
import { EditorViewCore, IEditorViewCore } from "src/editor/view/editorViewCore";

export class EditorView extends Disposable implements IEditorView {

    // [fields]

    private readonly _view: IEditorViewCore;

    // [events]

    public readonly onRender: Register<void>;

    // [constructor]
    
    constructor(
        container: HTMLElement,
        options: IEditorViewOptions,
    ) {
        super();

        const editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container';

        this._view = new EditorViewCore(editorContainer);

        this.onRender = this._view.onRender;
        
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
}