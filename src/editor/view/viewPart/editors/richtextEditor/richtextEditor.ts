import { Register } from "src/base/common/event";
import { EditorEventBroadcaster, IOnBeforeRenderEvent, IOnClickEvent, IOnDidClickEvent, IOnDidDoubleClickEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnKeydownEvent, IOnKeypressEvent, IOnPasteEvent, IOnTextInputEvent, IOnTripleClickEvent } from "src/editor/common/eventBroadcaster";
import { ProseEditorState, ProseEditorView, ProseNode } from "src/editor/common/proseMirror";
import { EditorInstance } from "src/editor/common/view";
import { EditorType, IRenderRichEvent } from "src/editor/common/viewModel";
import { ViewContext } from "src/editor/view/editorView";
import { IEditorCore, BaseEditor, IBaseEditor } from "src/editor/view/viewPart/editors/baseEditor";

function createRichtextDefaultState(context: ViewContext): ProseEditorState {
    return ProseEditorState.create({
        schema: context.viewModel.getSchema(),
        plugins: [],
    });
}

/**
 * An interface only for {@link RichtextEditor}.
 */
export interface IRichtextEditor extends IBaseEditor<EditorType.Rich> {

}

/**
 * @class An editor that renders the content as rich-text (a.k.a What-You-See-Is
 * -What-You-Get). The user will not be able to see the source content directly. 
 * Instead, all the user operations will be applied on the virtual nodes and 
 * modify the source content indirectly.
 */
export class RichtextEditor extends BaseEditor<EditorType.Rich, RichtextEditorCore> implements IRichtextEditor {

    // [field]

    // [event]

    public readonly onDidFocusChange: Register<boolean>;
    public readonly onBeforeRender: Register<IOnBeforeRenderEvent>;
    public readonly onClick: Register<IOnClickEvent>;
    public readonly onDidClick: Register<IOnDidClickEvent>;
    public readonly onDoubleClick: Register<IOnDoubleClickEvent>;
    public readonly onDidDoubleClick: Register<IOnDidDoubleClickEvent>;
    public readonly onTripleClick: Register<IOnTripleClickEvent>;
    public readonly onDidTripleClick: Register<IOnDidTripleClickEvent>;
    public readonly onKeydown: Register<IOnKeydownEvent>;
    public readonly onKeypress: Register<IOnKeypressEvent>;
    public readonly onTextInput: Register<IOnTextInputEvent>;
    public readonly onPaste: Register<IOnPasteEvent>;
    public readonly onDrop: Register<IOnDropEvent>;

    // [private constructor]

    private constructor(
        container: HTMLElement, 
        context: ViewContext, 
        initState?: ProseEditorState,
    ) {
        const coreArguments: any[] = [];
        coreArguments.push(initState ?? createRichtextDefaultState(context));

        super(EditorType.Rich, container, context, coreArguments);

        // event bindings
        {
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
        }
    }

    // [static methods]

    public static create(container: HTMLElement, context: ViewContext, oldEdtior?: EditorInstance): RichtextEditor {
        if (oldEdtior?.type === EditorType.Rich) {
            return new RichtextEditor(container, context, oldEdtior._core.view.state);
        }
        return new RichtextEditor(container, context);
    }

    // [protected methods]

    protected createEditorCore(container: HTMLElement, context: ViewContext, initState: ProseEditorState): RichtextEditorCore {
        return new RichtextEditorCore(container, context, initState);
    }

    // [private getter]

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

    // [private helper methods]
}

/**
 * An interface only for {@link RichtextEditorCore}.
 */
interface IRichtextEditorCore extends IEditorCore {

}

/**
 * @class Adaptation over {@link ProseEditorView}.
 */
class RichtextEditorCore extends EditorEventBroadcaster implements IRichtextEditorCore {

    // [field]

    private readonly _ctx: ViewContext;
    private readonly _view: ProseEditorView;

    // [constructor]

    constructor(
        container: HTMLElement,
        context: ViewContext,
        initState: ProseEditorState,
    ) {
        const view = new ProseEditorView(
            container, 
            {
                state: initState,
                plugins: context.viewModel.getExtensions(),
            }
        );
        super(view);
        this._view = view;
        this._ctx = context;
    }

    // [getter]

    /**
     * asd
     */
    get view(): ProseEditorView {
        return this._view;
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
}