import 'src/editor/view/media/editorView.scss';
import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogEvent, LogLevel } from "src/base/common/logger";
import { EditorWindow, IEditorView, IEditorViewOptions } from "src/editor/common/view";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { EditorOptionsType } from "src/editor/common/configuration/editorConfiguration";
import { IOnBeforeRenderEvent, IOnClickEvent, IOnDidClickEvent, IOnDidDoubleClickEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnKeydownEvent, IOnKeypressEvent, IOnPasteEvent, IOnTextInputEvent, IOnTripleClickEvent } from "src/editor/view/viewPart/editor/adapter/proseEventBroadcaster";
import { EditorWindowSwitcher, IEditorWindowSwitcher } from "src/editor/view/viewPart/editor/editorSwitcher";
import { Mutable } from "src/base/common/utilities/type";
import { EditorExtensionInfo } from "src/editor/editorWidget";

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
    private readonly _editorSwitcher: IEditorWindowSwitcher;

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
        const editorContainer = document.createElement('div');
        editorContainer.className = 'editor-view-container';
        this._container = editorContainer;

        // the centre that integrates the editor-related functionalities
        this._editorSwitcher = this.__register(new EditorWindowSwitcher(editorContainer, context, extensions));
        this.__adaptEditorSwitcherListeners(this._editorSwitcher);
        
        // update listener registration from view-model
        this.__registerViewModelListeners();

        // render
        container.appendChild(this._container);

        // others
        this._onLog.fire({ level: LogLevel.DEBUG, message: 'EditorView constructed.' });
    }

    // [public methods]

    get editor(): EditorWindow {
        return this._editorSwitcher.editor;
    }

    public isEditable(): boolean {
        return this._editorSwitcher.editor.isEditable();
    }

    public focus(): void {
        this._editorSwitcher.editor.focus();
    }

    public isFocused(): boolean {
        return this._editorSwitcher.editor.isFocused();
    }

    public destroy(): void {
        this._editorSwitcher.editor.destroy();
    }

    public isDestroyed(): boolean {
        return this._editorSwitcher.editor.isDestroyed();
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
            this._editorSwitcher.render(event);
        }));

        this.__register(viewModel.onDidRenderModeChange(mode => {
            this._editorSwitcher.setRenderMode(mode);
        }));
    }

    private __adaptEditorSwitcherListeners(this: Mutable<IEditorView>, switcher: IEditorWindowSwitcher): void {
        this.onDidFocusChange = switcher.editor.onDidFocusChange;
        this.onBeforeRender = switcher.editor.onBeforeRender;
        this.onClick = switcher.editor.onClick;
        this.onDidClick = switcher.editor.onDidClick;
        this.onDoubleClick = switcher.editor.onDoubleClick;
        this.onDidDoubleClick = switcher.editor.onDidDoubleClick;
        this.onTripleClick = switcher.editor.onTripleClick;
        this.onDidTripleClick = switcher.editor.onDidTripleClick;
        this.onKeydown = switcher.editor.onKeydown;
        this.onKeypress = switcher.editor.onKeypress;
        this.onTextInput = switcher.editor.onTextInput;
        this.onPaste = switcher.editor.onPaste;
        this.onDrop = switcher.editor.onDrop;
    }
}