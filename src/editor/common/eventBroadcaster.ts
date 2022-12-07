import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { createStandardKeyboardEvent, IStandardKeyboardEvent } from "src/base/common/keyboard";
import { ProseEditorView, ProseNode, ProseSlice, ProseTransaction } from "src/editor/common/proseMirror";

export interface IOnBeforeRenderEvent {
    readonly tr: ProseTransaction;
    prevent(): void;
}

interface IOnBeforeClickEventBase {
    readonly view: ProseEditorView;
    readonly position: number;
    readonly node: ProseNode;
    readonly nodePosition: number;
    readonly direct: boolean;
    readonly browserEvent: MouseEvent;
}

interface IOnDidClickEventBase {
    readonly view: ProseEditorView;
    readonly position: number;
    readonly browserEvent: MouseEvent;
}

export interface IOnClickEvent extends IOnBeforeClickEventBase {}

export interface IOnDidClickEvent extends IOnDidClickEventBase {}

export interface IOnDoubleClickEvent extends IOnBeforeClickEventBase {}

export interface IOnDidDoubleClickEvent extends IOnDidClickEventBase {}

export interface IOnTripleClickEvent extends IOnBeforeClickEventBase {}

export interface IOnDidTripleClickEvent extends IOnDidClickEventBase {}

export interface IOnKeydownEvent {
    readonly view: ProseEditorView;
    readonly browserEvent: IStandardKeyboardEvent;
}

export interface IOnKeypressEvent {
    readonly view: ProseEditorView;
    readonly browserEvent: IStandardKeyboardEvent;
}

export interface IOnTextInputEvent {
    readonly view: ProseEditorView;
    readonly from: number;
    readonly to: number;
    readonly text: string;
    preventDefault(): void;
}

export interface IOnPasteEvent {
    readonly view: ProseEditorView;
    readonly slice: ProseSlice;
    readonly browserEvent: ClipboardEvent;
}

export interface IOnDropEvent {
    readonly view: ProseEditorView;
    readonly slice: ProseSlice;
    readonly moved: boolean;
    readonly browserEvent: DragEvent;
}

/**
 * An interface only for {@link EditorEventBroadcaster}.
 */
export interface IEditorEventBroadcaster extends IDisposable {

    /** 
	 * Fires when the component is either focused or blured (true represents 
	 * focused). 
	 */
    readonly onDidFocusChange: Register<boolean>;

    /**
     * Fires before next rendering on DOM tree.
     */
    readonly onBeforeRender: Register<IOnBeforeRenderEvent>;

    /**
     * Fires for each node around a click, from the inside out. The direct flag 
     * will be true for the inner node.
     */
    readonly onClick: Register<IOnClickEvent>;

    /**
     * Fires when the editor is clicked, after 'onClick' event have been called.
     */
    readonly onDidClick: Register<IOnDidClickEvent>;

    /**
     * Fires for each node around a double click, from the inside out. The 
     * direct flag will be true for the inner node.
     */
    readonly onDoubleClick: Register<IOnDoubleClickEvent>;

    /**
     * Fires when the editor is double clicked, after 'onDoubleClick' event have 
     * been called.
     */
    readonly onDidDoubleClick: Register<IOnDidDoubleClickEvent>;

    /**
     * Fires for each node around a triple click, from the inside out. The 
     * direct flag will be true for the inner node.
     */
    readonly onTripleClick: Register<IOnTripleClickEvent>;

    /**
     * Fires when the editor is triple clicked, after 'onDoubleClick' event have 
     * been called.
     */
    readonly onDidTripleClick: Register<IOnDidTripleClickEvent>;

    /**
     * Fires when the editor encounters a keydown event.
     */
    readonly onKeydown: Register<IOnKeydownEvent>;

    /**
     * Fires when the editor encounters a keypress event.
     */
    readonly onKeypress: Register<IOnKeypressEvent>;

    /**
     * Fires whenever the user directly inputs some text, this event is called 
     * before the input is applied. If the `preventDeault` is invoked, the 
     * default behavior of inserting the text is prevented.
     */
    readonly onTextInput: Register<IOnTextInputEvent>;

    /**
     * Fires when the editor encounters a clipboard event. `slice` is the pasted 
     * content parsed by the editor, but you can directly access the event to 
     * get at the raw content.
     */
    readonly onPaste: Register<IOnPasteEvent>;

    /**
     * Fires when something is dropped onto the editor. `moved` will be true if 
     * this drop moves from the current selection (which should thus be deleted).
     */
    readonly onDrop: Register<IOnDropEvent>;
}

export class EditorEventBroadcaster extends Disposable implements IEditorEventBroadcaster {

    // [event]

    private readonly _onDidFocusChange = this.__register(new Emitter<boolean>());
    public readonly onDidFocusChange = this._onDidFocusChange.registerListener;

    private readonly _onBeforeRender = this.__register(new Emitter<IOnBeforeRenderEvent>());
    public readonly onBeforeRender = this._onBeforeRender.registerListener;

    private readonly _onClick = this.__register(new Emitter<IOnClickEvent>());
    public readonly onClick = this._onClick.registerListener;

    private readonly _onDidClick = this.__register(new Emitter<IOnDidClickEvent>());
    public readonly onDidClick = this._onDidClick.registerListener;

    private readonly _onDoubleClick = this.__register(new Emitter<IOnDoubleClickEvent>());
    public readonly onDoubleClick = this._onDoubleClick.registerListener;

    private readonly _onDidDoubleClick = this.__register(new Emitter<IOnDidDoubleClickEvent>());
    public readonly onDidDoubleClick = this._onDidDoubleClick.registerListener;

    private readonly _onTripleClick = this.__register(new Emitter<IOnTripleClickEvent>());
    public readonly onTripleClick = this._onTripleClick.registerListener;

    private readonly _onDidTripleClick = this.__register(new Emitter<IOnDidTripleClickEvent>());
    public readonly onDidTripleClick = this._onDidTripleClick.registerListener;

    private readonly _onKeydown = this.__register(new Emitter<IOnKeydownEvent>());
    public readonly onKeydown = this._onKeydown.registerListener;

    private readonly _onKeypress = this.__register(new Emitter<IOnKeypressEvent>());
    public readonly onKeypress = this._onKeypress.registerListener;
    
    private readonly _onTextInput = this.__register(new Emitter<IOnTextInputEvent>());
    public readonly onTextInput = this._onTextInput.registerListener;

    private readonly _onPaste = this.__register(new Emitter<IOnPasteEvent>());
    public readonly onPaste = this._onPaste.registerListener;

    private readonly _onDrop = this.__register(new Emitter<IOnDropEvent>());
    public readonly onDrop = this._onDrop.registerListener;

    // [constructor]

    constructor(view: ProseEditorView) {
        super();
        const props = view.props;
        
        // dom event listeners
        props.handleDOMEvents = {
            ...props.handleDOMEvents,
            focus: () => this._onDidFocusChange.fire(true),
            blur: () => this._onDidFocusChange.fire(false),
        };

        // on before render
        props.dispatchTransaction = (tr) => {
            let prevented = false;
            this._onBeforeRender.fire({ 
                tr: tr, 
                prevent: () => prevented = true,
            });

            if (prevented) {
                return;
            }

            const newState = view.state.apply(tr);
            view.updateState(newState);
        };

        // on before click
        props.handleClickOn = (view, pos, node, nodePos, event, direct) => {
            this._onClick.fire({
                view: view,
                position: pos,
                node: node,
                nodePosition: nodePos,
                browserEvent: event,
                direct: direct,
            });
        };
        
        // on did click
        props.handleClick = (view, pos, event) => {
            this._onDidClick.fire({
                view: view,
                position: pos,
                browserEvent: event,
            });
        };

        // on before double click
        props.handleDoubleClickOn = (view, pos, node, nodePos, event, direct) => {
            this._onDoubleClick.fire({
                view: view,
                position: pos,
                node: node,
                nodePosition: nodePos,
                browserEvent: event,
                direct: direct,
            });
        };
        
        // on did double click
        props.handleDoubleClick = (view, pos, event) => {
            this._onDidDoubleClick.fire({
                view: view,
                position: pos,
                browserEvent: event,
            });
        };

        // on before triple click
        props.handleTripleClickOn = (view, pos, node, nodePos, event, direct) => {
            this._onTripleClick.fire({
                view: view,
                position: pos,
                node: node,
                nodePosition: nodePos,
                browserEvent: event,
                direct: direct,
            });
        };

        // on did triple click
        props.handleTripleClick = (view, pos, event) => {
            this._onDidTripleClick.fire({
                view: view,
                position: pos,
                browserEvent: event,
            });
        };
        
        // on key down
        props.handleKeyDown = (view, event) => {
            this._onKeydown.fire({
                view: view,
                browserEvent: createStandardKeyboardEvent(event),
            });
        };
        
        // on key press
        props.handleKeyPress = (view, event) => {
            this._onKeypress.fire({
                view: view,
                browserEvent: createStandardKeyboardEvent(event),
            });
        };
        
        // on text input
        props.handleTextInput = (view, from, to, text) => {
            let prevented = false;
            
            this._onTextInput.fire({
                view: view,
                from: from,
                to: to,
                text: text,
                preventDefault: () => prevented = true,
            });

            return prevented;
        };
        
        // on paste
        props.handlePaste = (view, event, slice) => {
            this._onPaste.fire({
                view: view,
                browserEvent: event,
                slice: slice,
            });
        };
        
        // on drop
        props.handleDrop = (view, event, slice, moved) => {
            this._onDrop.fire({
                view: view,
                browserEvent: event,
                slice: slice,
                moved: moved,
            });
        };
    }
}