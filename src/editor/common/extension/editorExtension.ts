import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { err, ok, Result } from "src/base/common/result";
import { ProseEditorState, ProseExtension } from "src/editor/common/proseMirror";
import { IOnBeforeRenderEvent, IOnClickEvent, IOnDidClickEvent, IOnDidDoubleClickEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnKeydownEvent, IOnKeypressEvent, IOnPasteEvent, IOnTextInputEvent, IOnTripleClickEvent, ProseEventBroadcaster } from "src/editor/view/viewPart/editor/adapter/proseEventBroadcaster";
import { EditorSchema } from "src/editor/viewModel/schema";

/**
 * An interface only for {@link EditorExtension}.
 */
export interface IEditorExtension extends Disposable {
    
    // [fields]

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
 * // REVIEW: maybe support optional construction to either enable or disable the internal view extension. Maybe not every editor extension require views.
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

    // [constructor]

    constructor(
        @ILogService protected readonly logService: ILogService,
    ) {
        super();
        this._viewExtension = new ProseExtension({
            state: {
                /**
                 * This function is called once when the editor is loaded and 
                 * sets up the initial state.
                 */
                init: (config, state) => {
                    this._viewState = state;

                    this.logService.trace(this.id, `Extension initializing...`);
                    this.init(state);
                    this.logService.trace(this.id, `Extension initialized.`);

                    return;
                },
                /**
                 * This function is invoked whenever a transaction in editor 
                 * occurs, allowing the plugin to update its internal state.
                 *
                 * @param tr The transaction object representing the changes made to the editor state.
                 * @param value The current plugin state before applying the transaction.
                 * @param oldState The editor state before the transaction was applied.
                 * @param newState The editor state after the transaction has been applied.
                 * @returns The updated plugin state after applying the transaction.
                 */
                apply: (tr, value, oldState, newState) => {
                    return value;
                },
            }
        });
        this._eventBroadcaster = this.__register(new ProseEventBroadcaster(this._viewExtension.props));

        // event binding
        {
            this.onDidFocusChange = this._eventBroadcaster.onDidFocusChange;
            this.onBeforeRender = this._eventBroadcaster.onBeforeRender;
            this.onClick = this._eventBroadcaster.onClick;
            this.onDidClick = this._eventBroadcaster.onDidClick;
            this.onDoubleClick = this._eventBroadcaster.onDoubleClick;
            this.onDidDoubleClick = this._eventBroadcaster.onDidDoubleClick;
            this.onTripleClick = this._eventBroadcaster.onTripleClick;
            this.onDidTripleClick = this._eventBroadcaster.onDidTripleClick;
            this.onKeydown = this._eventBroadcaster.onKeydown;
            this.onKeypress = this._eventBroadcaster.onKeypress;
            this.onTextInput = this._eventBroadcaster.onTextInput;
            this.onPaste = this._eventBroadcaster.onPaste;
            this.onDrop = this._eventBroadcaster.onDrop;
        }
    }

    // [abstract methods]

    protected abstract init(state: ProseEditorState): void;

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