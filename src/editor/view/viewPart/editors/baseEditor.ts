import { Disposable } from "src/base/common/dispose";
import { IEditorEventBroadcaster } from "src/editor/common/eventBroadcaster";
import { ProseEditorState } from "src/editor/common/proseMirror";
import { IRenderEvent } from "src/editor/common/viewModel";
import { ViewContext } from "src/editor/view/editorView";

/**
 * Every {@link IBaseEditor} might has implement a core internally.
 */
export interface IEditorCore extends IEditorEventBroadcaster {

    /**
     * The current editor state.
     */
    readonly state: ProseEditorState;

    /**
     * @description If the content of the window is directly editable.
     * @note The content may still be modified programatically.
     */
    isEditable(): boolean;

    /**
     * @description Focus the window.
     */
    focus(): void;

    /**
     * @description Is the window focused.
     */
    isFocused(): boolean;
    
    /**
     * @description Removes the editor from the DOM and destroys all the 
     * resources relate to editor. 
     */
    destroy(): void;

    /**
     * @description If the window is destroyed. 
     */
    isDestroyed(): boolean;
}

/**
 * A {@link IBaseEditor} represents an editor window itself corresponding to a 
 * specific rendering mode.
 */
export interface IBaseEditor extends IEditorCore {
    
    /**
     * The parent HTML container of the window.
     */
    readonly container: HTMLElement;

    updateContent(event: IRenderEvent): void;
}

export abstract class BaseEditor<TCore extends IEditorCore> extends Disposable {

    // [field]

    private readonly _container: HTMLElement;
    protected readonly _context: ViewContext;
    protected readonly _core: TCore;

    // [constructor]

    constructor(container: HTMLElement, context: ViewContext, type: string, initState?: ProseEditorState) {
        super();
        this._container = container;
        this._context = context;
        container.classList.add(type);
        initState = initState ?? this.__createDefaultInitState(context);

        this._core = this.createEditorCore(container, context, initState);
        this.__register(this._core);
    }

    // [public abstract methods]

    protected abstract createEditorCore(container: HTMLElement, context: ViewContext, initState: ProseEditorState): TCore;
    public abstract updateContent(event: IRenderEvent): void;
    
    // [public methods]
    
    public abstract get state(): ProseEditorState;

    public get container(): HTMLElement {
        return this._container;
    }

    // [private helper methods]

    private __createDefaultInitState(context: ViewContext): ProseEditorState {
        return ProseEditorState.create({
            schema: context.viewModel.getSchema(),
            plugins: [],
        });
    }
}