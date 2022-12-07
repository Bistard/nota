import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { ProseExtension } from "src/editor/common/proseMirror";
import { IEditorWidget } from "src/editor/editorWidget";

/**
 * An interface used to describe an extension for an editor that is created for
 * every time when an editor is created and disposed when the editor is disposed.
 */
export interface IEditorExtension extends IDisposable {
    
    /** 
	 * Fires when the component is either focused or blured (true represents 
	 * focused). 
	 */
    readonly onDidFocusChange: Register<boolean>;

    /**
     * Event fires before next rendering on DOM tree.
     */
    readonly onBeforeRender: Register<void>;

    readonly onClick: Register<unknown>;
    readonly onDidClick: Register<unknown>;
    readonly onDoubleClick: Register<unknown>;
    readonly onDidDoubleClick: Register<unknown>;
    readonly onTripleClick: Register<unknown>;
    readonly onDidTripleClick: Register<unknown>;
    readonly onKeydown: Register<unknown>;
    readonly onKeypress: Register<unknown>;
    readonly onTextInput: Register<unknown>;
    readonly onPaste: Register<unknown>;
    readonly onDrop: Register<unknown>;
}

export interface IEditorExtensionCtor {
    new (editor: IEditorWidget, service: IServiceProvider): IEditorExtension;
}

/**
 * @class The base class for every editor-related extension.
 */
export abstract class EditorExtension extends ProseExtension implements IEditorExtension {

    // [field]

    private readonly _disposables: DisposableManager;

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

    constructor() {
        super({
            props: {
                handleDOMEvents: {
                    focus: () => this._onDidFocusChange.fire(true),
                    blur: () => this._onDidFocusChange.fire(false),
                },
                handleClickOn: undefined!,
                handleClick: undefined!,
            }
        });
        this._disposables = new DisposableManager();
    }

    // [public methods]

    public dispose(): void {
        this._disposables.dispose();
    }

    // [protected methods]

    protected __register<T extends IDisposable>(obj: T): T {
        if (obj && (obj as IDisposable) === this) {
			throw new Error('cannot register the disposable object to itself');
		}
        return this._disposables.register(obj);
    }
}