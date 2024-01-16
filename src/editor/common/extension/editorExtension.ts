import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ProseExtension } from "src/editor/common/proseMirror";
import { IOnBeforeRenderEvent, IOnClickEvent, IOnDidClickEvent, IOnDidDoubleClickEvent, IOnDidTripleClickEvent, IOnDoubleClickEvent, IOnDropEvent, IOnKeydownEvent, IOnKeypressEvent, IOnPasteEvent, IOnTextInputEvent, IOnTripleClickEvent, ProseEventBroadcaster } from "src/editor/view/viewPart/editor/adapter/proseEventBroadcaster";

export abstract class EditorExtension extends Disposable {
    
    // [fields]

    private readonly _viewPlugin: ProseExtension;
    private readonly _eventBroadcaster: ProseEventBroadcaster;

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
        super();
        this._viewPlugin = new ProseExtension({});
        this._eventBroadcaster = this.__register(new ProseEventBroadcaster(this._viewPlugin.props));

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

    // [public methods]

    public getViewPlugin(): ProseExtension {
        return this._viewPlugin;
    }
}