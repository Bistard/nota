import 'src/editor/view/media/editorView.scss';
import type { Mutable } from "src/base/common/utilities/type";
import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogEvent, LogLevel } from "src/base/common/logger";
import { EditorWindow, IEditorView, IEditorViewOptions } from "src/editor/common/view";
import { IEditorViewModel, IRenderRichEvent } from "src/editor/common/viewModel";
import { EditorOptionsType } from "src/editor/common/configuration/editorConfiguration";
import { IOnBeforeRenderEvent, IOnClickEvent, IOnDidClickEvent, IOnDidDoubleClickEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnKeydownEvent, IOnKeypressEvent, IOnPasteEvent, IOnTextInputEvent, IOnTripleClickEvent } from "src/editor/view/viewPart/editor/adapter/proseEventBroadcaster";
import { EditorExtensionInfo } from "src/editor/editorWidget";
import { RichtextEditor } from 'src/editor/view/viewPart/editor/richtextEditor';

export class ViewContext {
    constructor(
        public readonly viewModel: IEditorViewModel,
        public readonly view: IEditorView,
        public readonly options: EditorOptionsType,
        public readonly log: (event: ILogEvent) => void,
    ) {}
}

export class EditorView extends Disposable implements IEditorView {

    // [fields]

    /**
     * The HTML container of the entire editor.
     */
    private readonly _container: HTMLElement;

    /**
     * A wrapper of some frequently used references.
     */
    private readonly _ctx: ViewContext;
    private readonly _view: EditorWindow;

    // [events]
    
    private readonly _onLog = this.__register(new Emitter<ILogEvent>());
    public readonly onLog = this._onLog.registerListener;
    
    public readonly onDidFocusChange!: Register<boolean>;
    public readonly onBeforeRender!: Register<IOnBeforeRenderEvent>;
    public readonly onClick!: Register<IOnClickEvent>;
    public readonly onDidClick!: Register<IOnDidClickEvent>;
    public readonly onDoubleClick!: Register<IOnDoubleClickEvent>;
    public readonly onDidDoubleClick!: Register<IOnDidDoubleClickEvent>;
    public readonly onTripleClick!: Register<IOnTripleClickEvent>;
    public readonly onDidTripleClick!: Register<IOnDidTripleClickEvent>;
    public readonly onKeydown!: Register<IOnKeydownEvent>;
    public readonly onKeypress!: Register<IOnKeypressEvent>;
    public readonly onTextInput!: Register<IOnTextInputEvent>;
    public readonly onPaste!: Register<IOnPasteEvent>;
    public readonly onDrop!: Register<IOnDropEvent>;

    // [constructor]
    
    constructor(
        container: HTMLElement,
        viewModel: IEditorViewModel,
        extensions: EditorExtensionInfo[],
        options: EditorOptionsType,
    ) {
        super();

        const context = new ViewContext(viewModel, this, options, this._onLog.fire.bind(this));
        this._ctx = context;

        // the overall element that contains all the relevant components
        this._container = document.createElement('div');
        this._container.className = 'editor-view-container';
        const editorElement = document.createElement('div');
        editorElement.className = 'editor-container';

        // the centre that integrates the editor-related functionalities
        this._view = new RichtextEditor(editorElement, context, extensions);
        this.__adaptViewListeners(this._view);
        
        // update listener registration from view-model
        this.__registerViewModelListeners();

        // render
        this._container.appendChild(editorElement);
        container.appendChild(this._container);

        // others
        this._onLog.fire({ level: LogLevel.DEBUG, message: 'EditorView constructed.' });
    }

    // [public methods]

    get editor(): EditorWindow {
        return this._view;
    }

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
        this._view.destroy();
    }

    public isDestroyed(): boolean {
        return this._view.isDestroyed();
    }
    
    public updateOptions(options: Partial<IEditorViewOptions>): void {
        
    }

    public override dispose(): void {
        super.dispose();
        this._container.remove();
    }

    // [private helper methods]

    private __registerViewModelListeners(): void {
        const viewModel = this._ctx.viewModel;

        this.__register(viewModel.onRender(event => {
            this._view.render((event as IRenderRichEvent).document);
        }));

        this.__register(viewModel.onDidRenderModeChange(mode => {
            // TODO
        }));
    }

    private __adaptViewListeners(this: Mutable<IEditorView>, view: EditorWindow): void {
        this.onDidFocusChange = view.onDidFocusChange;
        this.onBeforeRender = view.onBeforeRender;
        this.onClick = view.onClick;
        this.onDidClick = view.onDidClick;
        this.onDoubleClick = view.onDoubleClick;
        this.onDidDoubleClick = view.onDidDoubleClick;
        this.onTripleClick = view.onTripleClick;
        this.onDidTripleClick = view.onDidTripleClick;
        this.onKeydown = view.onKeydown;
        this.onKeypress = view.onKeypress;
        this.onTextInput = view.onTextInput;
        this.onPaste = view.onPaste;
        this.onDrop = view.onDrop;
    }
}