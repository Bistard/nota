import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ProseEditorState, ProseEditorView, ProseNode, Slice, Transaction } from "src/editor/common/proseMirror";
import { IRenderRichEvent } from "src/editor/common/viewModel";
import { ViewContext } from "src/editor/view/editorView";
import { IEditorCore, BaseEditor } from "src/editor/view/viewPart/editors/baseEditor";

/**
 * @class An editor that renders the content as rich-text (a.k.a What-You-See-Is
 * -What-You-Get). The user will not be able to see the source content directly. 
 * Instead, all the user operations will be applied on the virtual nodes and 
 * modify the source content indirectly.
 */
export class RichtextEditor extends BaseEditor {

    // [field]

    private readonly _core: RichtextEditorCore;

    // [event]

    public readonly onDidFocusChange: Register<boolean>;
    public readonly onBeforeRender: Register<void>;
    public readonly onClick: Register<unknown>;
    public readonly onDidClick: Register<unknown>;
    public readonly onDoubleClick: Register<unknown>;
    public readonly onDidDoubleClick: Register<unknown>;
    public readonly onTripleClick: Register<unknown>;
    public readonly onDidTripleClick: Register<unknown>;
    public readonly onKeydown: Register<unknown>;
    public readonly onKeypress: Register<unknown>;
    public readonly onTextInput: Register<unknown>;
    public readonly onPaste: Register<unknown>;
    public readonly onDrop: Register<unknown>;

    // [constructor]

    constructor(
        container: HTMLElement, 
        context: ViewContext, 
        initState?: ProseEditorState,
    ) {
        super(container, context, 'rich-text');

        this._core = new RichtextEditorCore(container, context, initState);
        
        this.onDidFocusChange = this._core.onDidFocusChange;
        this.onBeforeRender = this._core.onBeforeRender;
        this.onClick = this._core.onClick;
        this.onDidClick = this._core.onDidClick;
        this.onDoubleClick = this._core.onDoubleClick;
        this.onDidDoubleClick = this._core.onDidDoubleClick;
        this.onTripleClick = this._core.onTripleClick;
        this.onDidTripleClick = this._core.onDidTripleClick;
        this.onKeydown = this._core.onKeydown;
        this.onKeypress = this._core.onKeypress;
        this.onTextInput = this._core.onTextInput;
        this.onPaste = this._core.onPaste;
        this.onDrop = this._core.onDrop;

        this.__register(this._core);
    }

    // [getter]

    get state(): ProseEditorState {
        return this._core.state;
    }

    // [public methods]

    public updateContent(event: IRenderRichEvent): void {
        this._core.updateContent(event.document);
    }

    public isEditable(): boolean {
        return this._core.isEditable();
    }

    public destroy(): void {
        this._core.destroy();
    }

    public isDestroyed(): boolean {
        return this._core.isDestroyed();
    }

    public isFocused(): boolean {
        return this._core.isFocused();
    }

    public focus(): void {
        this._core.focus();
    }
}

/**
 * An interface only for {@link RichtextEditorCore}.
 */
interface IRichtextEditorCore extends IEditorCore {

}

/**
 * @class Adaptation over {@link ProseEditorView}.
 */
class RichtextEditorCore extends Disposable implements IRichtextEditorCore {

    // [field]

    private readonly _ctx: ViewContext;
    private readonly _view: ProseEditorView;

    // [event]

    private readonly _onDidFocusChange = this.__register(new Emitter<boolean>());
    public readonly onDidFocusChange = this._onDidFocusChange.registerListener;

    private readonly _onBeforeRender = this.__register(new Emitter<void>());
    public readonly onBeforeRender = this._onBeforeRender.registerListener;

    private readonly _onClick = this.__register(new Emitter<unknown>());
    public readonly onClick = this._onClick.registerListener;

    private readonly _onDidClick = this.__register(new Emitter<unknown>());
    public readonly onDidClick = this._onDidClick.registerListener;

    private readonly _onDoubleClick = this.__register(new Emitter<unknown>());
    public readonly onDoubleClick = this._onDoubleClick.registerListener;

    private readonly _onDidDoubleClick = this.__register(new Emitter<unknown>());
    public readonly onDidDoubleClick = this._onDidDoubleClick.registerListener;

    private readonly _onTripleClick = this.__register(new Emitter<unknown>());
    public readonly onTripleClick = this._onTripleClick.registerListener;

    private readonly _onDidTripleClick = this.__register(new Emitter<unknown>());
    public readonly onDidTripleClick = this._onDidTripleClick.registerListener;

    private readonly _onKeydown = this.__register(new Emitter<unknown>());
    public readonly onKeydown = this._onKeydown.registerListener;

    private readonly _onKeypress = this.__register(new Emitter<unknown>());
    public readonly onKeypress = this._onKeypress.registerListener;
    
    private readonly _onTextInput = this.__register(new Emitter<unknown>());
    public readonly onTextInput = this._onTextInput.registerListener;

    private readonly _onPaste = this.__register(new Emitter<unknown>());
    public readonly onPaste = this._onPaste.registerListener;

    private readonly _onDrop = this.__register(new Emitter<unknown>());
    public readonly onDrop = this._onDrop.registerListener;

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
                handleDOMEvents: {
                    focus: () => this._onDidFocusChange.fire(true),
                    blur: () => this._onDidFocusChange.fire(false),
                },
                dispatchTransaction: this.__onDispatchTransaction.bind(this),
                handleClickOn: this.__onClick.bind(this),
                handleClick: () => {},
                handleDoubleClickOn: this.__onDoubleClick.bind(this),
                handleDoubleClick: () => {},
                handleTripleClickOn: () => {},
                handleTripleClick: () => {},
                handleKeyDown: this.__onKeydown.bind(this),
                handleKeyPress: this.__onKeypress.bind(this),
                handleTextInput: this.__onTextinput.bind(this),
                handlePaste: this.__onPaste.bind(this),
                handleDrop: this.__onDrop.bind(this),
                plugins: [],
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
        this._onBeforeRender.fire();
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