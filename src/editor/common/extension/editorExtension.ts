import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { EditorEventBroadcaster, IEditorEventBroadcaster, IOnBeforeRenderEvent, IOnClickEvent, IOnDidClickEvent, IOnDidDoubleClickEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnKeydownEvent, IOnKeypressEvent, IOnPasteEvent, IOnTextInputEvent, IOnTripleClickEvent } from "src/editor/common/eventBroadcaster";
import { ProseExtension } from "src/editor/common/proseMirror";
import { IEditorWidget } from "src/editor/editorWidget";

/**
 * An interface used to describe an extension for an editor that is created for
 * every time when an editor is created and disposed when the editor is disposed.
 */
export interface IEditorExtension extends IEditorEventBroadcaster, ProseExtension {
    
}

export interface IEditorExtensionCtor {
    new (editor: IEditorWidget, ...services: any[]): IEditorExtension;
}

/**
 * @class The base class for every editor-related extensions.
 */
export abstract class EditorExtension extends ProseExtension implements IEditorExtension {

    // [field]

    private readonly _disposables: DisposableManager;
    private readonly _eventBroadcaster: EditorEventBroadcaster;

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

    constructor() {
        super({ props: {} });
        this._disposables = new DisposableManager();
        this._eventBroadcaster = new EditorEventBroadcaster(this.props);
        
        // event bindings
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

        // memory management
        this._disposables.register(this._eventBroadcaster);
    }

    // [public methods]

    public dispose(): void {
        this._disposables.dispose();
    }

    /** 
	 * @description Determines if the current object is disposed already. 
	 */
	public isDisposed(): boolean {
		return this._disposables.disposed;
	}

    // [protected methods]

    /**
	 * @description Try to register a disposable object. Once this.dispose() is 
	 * invoked, all the registered disposables will be disposed.
	 * 
	 * If this object is already disposed, a console warning will be printed.
	 * If self-registering is encountered, an error will be thrown.
	 */
    protected __register<T extends IDisposable>(obj: T): T {
        if (obj && (obj as IDisposable) === this) {
			throw new Error('cannot register the disposable object to itself');
		}
        return this._disposables.register(obj);
    }
}