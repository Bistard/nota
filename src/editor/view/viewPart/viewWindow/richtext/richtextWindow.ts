import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ProseEditorState, ProseEditorView, ProseNode, Slice, Transaction } from "src/editor/common/proseMirror";
import { IRenderRichEvent } from "src/editor/common/viewModel";
import { ViewContext } from "src/editor/view/editorView";
import { IWindowCore, ViewWindow } from "src/editor/view/viewPart/viewWindow/window";

export class RichtextWindow extends ViewWindow {

    // [field]

    private readonly _window: RichtextWindowCore;

    // [event]

    public readonly onRender: Register<void>;

    // [constructor]

    constructor(container: HTMLElement, context: ViewContext, initState?: ProseEditorState) {
        super(container, context, 'rich-text');

        this._window = new RichtextWindowCore(container, context, initState);
        
        this.onRender = this._window.onRender;

        this.__register(this._window);
    }

    // [getter]

    get state(): ProseEditorState {
        return this._window.state;
    }

    // [public methods]

    public updateContent(event: IRenderRichEvent): void {
        this._window.updateContent(event.document);
    }

    public isEditable(): boolean {
        return this._window.isEditable();
    }

    public destroy(): void {
        this._window.destroy();
    }

    public isDestroyed(): boolean {
        return this._window.isDestroyed();
    }

    public isFocused(): boolean {
        return this._window.isFocused();
    }

    public focus(): void {
        this._window.focus();
    }
}

/**
 * An interface only for {@link RichtextWindowCore}.
 */
interface IRichtextWindowCore extends IWindowCore {

}

/**
 * @class Adaptation over {@link ProseEditorView}.
 */
class RichtextWindowCore extends Disposable implements IRichtextWindowCore {

    // [field]

    private readonly _ctx: ViewContext;
    private readonly _view: ProseEditorView;

    // [event]

    private readonly _onRender = this.__register(new Emitter<void>());
    public readonly onRender = this._onRender.registerListener;

    // [constructor]

    constructor(
        container: HTMLElement,
        context: ViewContext,
        initState?: ProseEditorState,
    ) {
        super();
        this._ctx = context;

        initState = initState ?? this.__createDefaultInitState();

        this._view = new ProseEditorView(
            container, 
            {
                state: initState,
                dispatchTransaction: this.__onDispatchTransaction.bind(this),
                handleClickOn: this.__onClick.bind(this),
                handleDoubleClickOn: this.__onDoubleClick.bind(this),
                handleKeyDown: this.__onKeydown.bind(this),
                handleKeyPress: this.__onKeypress.bind(this),
                handleTextInput: this.__onTextinput.bind(this),
                handlePaste: this.__onPaste.bind(this),
                handleDrop: this.__onDrop.bind(this),
            }
        );
    }

    // [getter]

    get state(): ProseEditorState {
        return this._view.state;
    }

    // [public methods]

    public updateContent(doc: ProseNode): void {
        
        const newState = ProseEditorState.create({
            schema: this._ctx.viewModel.getSchema(),
            doc: doc,
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

    // [private helper methods (general)]

    private __createDefaultInitState(): ProseEditorState {
        return ProseEditorState.create({
            schema: this._ctx.viewModel.getSchema(),
            plugins: [],
        });
    }

    // [private helper methods (callback)]

    private __onDispatchTransaction(tr: Transaction): void {
        this._onRender.fire();
        const newState = this._view.state.apply(tr);
        this._view.updateState(newState);
    }

    private __onClick(view: ProseEditorView, pos: number, node: ProseNode, nodePos: number, event: MouseEvent, direct: boolean): void {

    }

    private __onDoubleClick(view: ProseEditorView, pos: number, node: ProseNode, nodePos: number, event: MouseEvent, direct: boolean): void {

    }

    private __onKeydown(view: ProseEditorView, event: KeyboardEvent): void {

    }

    private __onKeypress(view: ProseEditorView, event: KeyboardEvent): void {
        
    }

    private __onTextinput(view: ProseEditorView, from: number, to: number, text: string): void {

    }

    private __onPaste(view: ProseEditorView, event: ClipboardEvent, slice: Slice): void {

    }

    private __onDrop(view: ProseEditorView, event: DragEvent, slice: Slice, moved: boolean): void {

    }
}