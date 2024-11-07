import type { IEditorWidget } from "src/editor/editorWidget";
import type { IEditorMouseEvent, IOnClickEvent, IOnDidClickEvent, IOnDidDoubleClickEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnKeydownEvent, IOnKeypressEvent, IOnPasteEvent, IOnTextInputEvent, IOnTripleClickEvent } from "src/editor/view/proseEventBroadcaster";
import type { EditorSchema } from "src/editor/model/schema";
import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ProseEditorState, ProseEditorView, ProseExtension, ProseTransaction } from "src/editor/common/proseMirror";
import { err, ok, Result } from "src/base/common/result";

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
    
    readonly onMouseOver: Register<IEditorMouseEvent>;
    readonly onMouseOut: Register<IEditorMouseEvent>;
    readonly onMouseEnter: Register<IEditorMouseEvent>;
    readonly onMouseLeave: Register<IEditorMouseEvent>;
    readonly onMouseDown: Register<IEditorMouseEvent>;
    readonly onMouseUp: Register<IEditorMouseEvent>;
    readonly onMouseMove: Register<IEditorMouseEvent>;

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

    protected readonly _editorWidget: IEditorWidget;
    private readonly _viewExtension: ProseExtension;
    
    /**
     * Will be defined when the editor is initialized for the first time.
     */
    private _viewState?: ProseEditorState;

    // [view event]

    get onDidFocusChange(): Register<boolean> { return this._editorWidget.onDidFocusChange; }
    
    get onClick() { return this._editorWidget.onClick; }
    get onDidClick() { return this._editorWidget.onDidClick; }
    get onDoubleClick() { return this._editorWidget.onDoubleClick; }
    get onDidDoubleClick() { return this._editorWidget.onDidDoubleClick; }
    get onTripleClick() { return this._editorWidget.onTripleClick; }
    get onDidTripleClick() { return this._editorWidget.onDidTripleClick; }

    get onKeydown() { return this._editorWidget.onKeydown; }
    get onKeypress() { return this._editorWidget.onKeypress; }
    get onTextInput() { return this._editorWidget.onTextInput; }
    
    get onPaste() { return this._editorWidget.onPaste; }
    get onDrop() { return this._editorWidget.onDrop; }
    
    get onMouseOver() { return this._editorWidget.onMouseOver; }
    get onMouseOut() { return this._editorWidget.onMouseOut; }
    get onMouseEnter() { return this._editorWidget.onMouseEnter; }
    get onMouseLeave() { return this._editorWidget.onMouseLeave; }
    get onMouseDown() { return this._editorWidget.onMouseDown; }
    get onMouseUp() { return this._editorWidget.onMouseUp; }
    get onMouseMove() { return this._editorWidget.onMouseMove; }

    // [constructor]

    constructor(
        editorWidget: IEditorWidget,
    ) {
        super();
        this._editorWidget = editorWidget;
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
                        this.onViewUpdate?.(view, prevState);
                    },
                };
            },
        });
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
    protected onViewUpdate?(view: ProseEditorView, prevState: ProseEditorState): void;

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