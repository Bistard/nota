import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ProseEditorState } from "src/editor/common/proseMirror";
import { IRenderEvent } from "src/editor/common/viewModel";
import { ViewContext } from "src/editor/view/editorView";

/**
 * Every {@link IBaseEditor} might has implement a core internally.
 */
export interface IEditorCore extends Disposable {

    /**
     * The current editor state.
     */
    readonly state: ProseEditorState;

    /**
     * Event fires before next rendering on DOM tree.
     */
    readonly onBeforeRender: Register<void>;

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

export abstract class BaseEditor extends Disposable implements IBaseEditor {

    // [field]

    private readonly _container: HTMLElement;
    protected readonly _context: ViewContext;

    // [constructor]

    constructor(container: HTMLElement, context: ViewContext, type: string) {
        super();
        this._container = container;
        this._context = context;
        container.classList.add(type);
    }

    // [event]

    public abstract get onBeforeRender(): Register<void>;

    // [public abstract methods]

    public abstract updateContent(event: IRenderEvent): void;

    public abstract isEditable(): boolean;

    public abstract destroy(): void;

    public abstract isDestroyed(): boolean;

    public abstract isFocused(): boolean;

    public abstract focus(): void;

    // [public methods]
    
    public abstract get state(): ProseEditorState;

    public get container(): HTMLElement {
        return this._container;
    }
}