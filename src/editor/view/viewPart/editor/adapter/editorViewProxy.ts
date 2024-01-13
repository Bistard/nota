import { IProseEventBroadcaster, ProseEventBroadcaster } from "src/editor/view/viewPart/editor/adapter/proseEventBroadcaster";
import { ProseEditorView, ProseEditorState, ProseNode } from "src/editor/common/proseMirror";
import { ViewContext } from "src/editor/view/editorView";

export interface IEditorViewProxy extends IProseEventBroadcaster {

    render(document: ProseNode): void;

    /**
     * @description If the content of the window is directly editable.
     * @note The content may still be modified programatically.
     */
    isEditable(): boolean;

    /**
     * @description Focus the window.
     */
    focus(): void;

    /**
     * @description Is the window focused.
     */
    isFocused(): boolean;
    
    /**
     * @description Removes the editor from the DOM and destroys all the 
     * resources relate to editor. 
     */
    destroy(): void;

    /**
     * @description If the window is destroyed. 
     */
    isDestroyed(): boolean;
}

export class EditorViewProxy extends ProseEventBroadcaster implements IEditorViewProxy {

    // [fields]

    private readonly _ctx: ViewContext;
    private readonly _view: ProseEditorView;

    // [constructor]

    constructor(
        view: ProseEditorView,
        context: ViewContext,
    ) {
        super(view);
        this._view = view;
        this._ctx = context;
    }

    // [public DOM related methods]

    public getDomNodeAt(position: number): Node | null {
        return this._view.nodeDOM(position);
    }
    
    // [public methods]

    public render(document: ProseNode): void {
        const newState = ProseEditorState.create({
            schema: this._ctx.viewModel.getSchema(),
            doc: document,
        });
        this._view.updateState(newState);
    }

    public isEditable(): boolean {
        return this._view.editable;
    }

    public focus(): void {
        this._view.focus();
    }

    public isFocused(): boolean {
        return this._view.hasFocus();
    }

    public destroy(): void {
        this.dispose();
    }

    public isDestroyed(): boolean {
        return this.isDisposed();
    }

    public override dispose(): void {
        super.dispose();
        if (!this._view.isDestroyed) {
            this._view.destroy();
        }
    }
}