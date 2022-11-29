import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogEvent, LogLevel } from "src/base/common/logger";
import { IEditorView, IEditorViewOptions } from "src/editor/common/view";
import { IEditorViewModel, IRenderPlainEvent, IRenderRichEvent, IRenderSplitEvent, isRenderPlainEvent, isRenderRichEvent, isRenderSplitEvent } from "src/editor/common/viewModel";
import { EditorViewCore } from "src/editor/view/viewPart/viewWindow/editorViewCore";

export class ViewContext {

    constructor(
        public readonly viewModel: IEditorViewModel,
        public readonly options: IEditorViewOptions,
    ) {}
}

export class EditorView extends Disposable implements IEditorView {

    // [fields]

    private readonly _view: EditorViewCore;
    private readonly _ctx: ViewContext;

    // [events]

    private readonly _onLog = this.__register(new Emitter<ILogEvent<string | Error>>());
    public readonly onLog = this._onLog.registerListener;

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
    
    public updateOptions(options: Partial<IEditorViewOptions>): void {
        
    }

    public override dispose(): void {
        super.dispose();
    }

    // [private helper methods]

    private __registerViewModelListeners(): void {
        const viewModel = this._ctx.viewModel;

        viewModel.onRender(event => {
            console.log('[view] on render event', event);

            if (isRenderPlainEvent(event)) {
                this.__renderAsPlaintext(event);
            } 
            else if (isRenderSplitEvent(event)) {
                this.__renderAsSplit(event);
            } 
            else if (isRenderRichEvent(event)) {
                this.__renderAsRich(event);
            } 
            else {
                // unknown render event
                this._onLog.fire({ level: LogLevel.ERROR, data: new Error('unknown view render type.') });
            }
        });
    }

    private __renderAsPlaintext(event: IRenderPlainEvent): void {

    }

    private __renderAsSplit(event: IRenderSplitEvent): void {

    }

    private __renderAsRich(event: IRenderRichEvent): void {
        this._view.updateContent(event.document);
    }
}
