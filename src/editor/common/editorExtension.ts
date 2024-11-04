import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { err, ok, Result } from "src/base/common/result";
import { ProseEditorState, ProseEditorView, ProseExtension, ProseTransaction } from "src/editor/common/proseMirror";
import { IEditorWidget } from "src/editor/editorWidget";
import { IOnBeforeRenderEvent, IOnClickEvent, IOnDidClickEvent, IOnDidDoubleClickEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnKeydownEvent, IOnKeypressEvent, IOnPasteEvent, IOnTextInputEvent, IOnTripleClickEvent, ProseEventBroadcaster } from "src/editor/view/viewPart/editor/adapter/proseEventBroadcaster";
import { EditorSchema } from "src/editor/model/schema";

/**
 * An interface only for {@link EditorExtension}.
 */
export interface IEditorExtension extends Disposable {
    
    // [fields]

    /**
     * Every extension should has a unique identifier binding to itself.
     */
    readonly id: string;

    // [events]
    
    readonly onDidFocusChange: Register<boolean>;
    readonly onBeforeRender: Register<IOnBeforeRenderEvent>;
    readonly onClick: Register<IOnClickEvent>;
    readonly onDidClick: Register<IOnDidClickEvent>;
    readonly onDoubleClick: Register<IOnDoubleClickEvent>;
    readonly onDidDoubleClick: Register<IOnDidDoubleClickEvent>;
    readonly onTripleClick: Register<IOnTripleClickEvent>;
    readonly onDidTripleClick: Register<IOnDidTripleClickEvent>;
    readonly onKeydown: Register<IOnKeydownEvent>;
    readonly onKeypress: Register<IOnKeypressEvent>;
    readonly onTextInput: Register<IOnTextInputEvent>;
    readonly onPaste: Register<IOnPasteEvent>;
    readonly onDrop: Register<IOnDropEvent>;

    // [methods]

    getViewExtension(): ProseExtension;
    getEditorState(): Result<ProseEditorState, Error>;
    getEditorSchema(): Result<EditorSchema, Error>;
}

/**
 * // TODO
 */
export abstract class EditorExtension extends Disposable implements IEditorExtension {
    
    // [fields]

    public abstract readonly id: string;

    private readonly _eventBroadcaster: ProseEventBroadcaster;
    private readonly _viewExtension: ProseExtension;
    
    /**
     * Will be defined when the editor is initialized for the first time.
     */
    private _viewState?: ProseEditorState;

    // [view event]

    get onDidFocusChange(): Register<boolean> { return this._eventBroadcaster.onDidFocusChange; }
    get onBeforeRender(): Register<IOnBeforeRenderEvent> { return this._eventBroadcaster.onBeforeRender; }
    get onClick(): Register<IOnClickEvent> { return this._eventBroadcaster.onClick; }
    get onDidClick(): Register<IOnDidClickEvent> { return this._eventBroadcaster.onDidClick; }
    get onDoubleClick(): Register<IOnDoubleClickEvent> { return this._eventBroadcaster.onDoubleClick; }
    get onDidDoubleClick(): Register<IOnDidDoubleClickEvent> { return this._eventBroadcaster.onDidDoubleClick; }
    get onTripleClick(): Register<IOnTripleClickEvent> { return this._eventBroadcaster.onTripleClick; }
    get onDidTripleClick(): Register<IOnDidTripleClickEvent> { return this._eventBroadcaster.onDidTripleClick; }
    get onKeydown(): Register<IOnKeydownEvent> { return this._eventBroadcaster.onKeydown; }
    get onKeypress(): Register<IOnKeypressEvent> { return this._eventBroadcaster.onKeypress; }
    get onTextInput(): Register<IOnTextInputEvent> { return this._eventBroadcaster.onTextInput; }
    get onPaste(): Register<IOnPasteEvent> { return this._eventBroadcaster.onPaste; }
    get onDrop(): Register<IOnDropEvent> { return this._eventBroadcaster.onDrop; }

    // [constructor]

    constructor(
        editorWidget: IEditorWidget,
    ) {
        super();
        this._viewExtension = new ProseExtension({
            state: {
                // This function will be called once the extension is created by {@link EditorState.create({ plugin: [myPlugin] })}.
                init: (config, state) => {
                    this._viewState = state;
                    this.onViewStateInit?.(state);
                },
                // This function is invoked whenever a transaction in editor.
                apply: (tr, value, oldState, newState) => {
                    this._viewState = newState;
                    this.onStateTransaction?.(tr, oldState, newState);
                },
            },
            // Will be called when the state is associated with an {@link ProseEditorView}.
            view: (view) => {
                this.onViewInit?.(view);

                return {
                    // Called when the view is destroyed
                    destroy: () => {
                        this._viewState = undefined;
                        this.onViewDestroy?.(view);
                    },
                    // Called whenever the view's state is updated.
                    update: (view, prevState) => {
                        this._viewState = view.state;
                        this.onViewUpdate?.(view);
                    },
                };
            },
        });
        this._eventBroadcaster = this.__register(new ProseEventBroadcaster(this._viewExtension.props));
    }

    // [abstract methods]

    /**
     * @description This function will be called once when an editor state is 
     * created by {@link EditorState.create()}.
     */
    protected onViewStateInit?(state: ProseEditorState): void;
    
    /**
     * @description This function is invoked whenever a transaction in editor 
     * occurs, allowing the plugin to update its internal state.
     * @param transaction The transaction object representing the changes made.
     * @param oldState The editor state before the transaction was applied.
     * @param newState The editor state after the transaction has been applied.
     */
    protected onStateTransaction?(transaction: ProseTransaction, oldState: ProseEditorState, newState: ProseEditorState): void;

    /**
     * @description This function triggers when the extension is bounded with
     * the {@link ProseEditorView}.
     */
    protected onViewInit?(view: ProseEditorView): void;
    
    /**
     * @description The function triggers when the view's state is updated.
     */
    protected onViewUpdate?(view: ProseEditorView): void;

    /**
     * @description This function triggers when the {@link ProseEditorView} is
     * destroyed.
     */
    protected onViewDestroy?(view: ProseEditorView): void;

    // [public methods]

    public getViewExtension(): ProseExtension {
        return this._viewExtension;
    }

    public getEditorState(): Result<ProseEditorState, Error> {
        return this._viewState ? ok(this._viewState) : err(new Error(`The editor extension (${this.id}) is not initialized.`));
    }
    
    public getEditorSchema(): Result<EditorSchema, Error> {
        return this._viewState ? ok(<EditorSchema>this._viewState.schema) : err(new Error(`The editor extension (${this.id}) is not initialized.`));
    }
}