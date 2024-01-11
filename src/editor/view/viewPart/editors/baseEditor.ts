import { Disposable } from "src/base/common/dispose";
import { errorToMessage } from "src/base/common/error";
import { IEditorEventBroadcaster } from "src/editor/common/eventBroadcaster";
import { EditorType, RenderEvent } from "src/editor/common/viewModel";
import { ViewContext } from "src/editor/view/editorView";

/**
 * Every {@link IBaseEditor} might has implement a core internally.
 */
export interface IEditorCore extends IEditorEventBroadcaster {

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
export interface IBaseEditor<TType extends EditorType> extends IEditorCore {
    
    /**
     * The type of the editor.
     */
    readonly type: TType;

    /**
     * The parent HTML container of the window.
     */
    readonly container: HTMLElement;

    updateContent(event: RenderEvent): void;
}

export abstract class BaseEditor<TType extends EditorType, TCore extends IEditorCore> extends Disposable {

    // [field]

    private readonly _type: TType;

    private readonly _container: HTMLElement;
    protected readonly _context: ViewContext;
    protected readonly _core: TCore;

    // [constructor]

    constructor(type: TType, container: HTMLElement, context: ViewContext, coreArguments?: any[]) {
        super();
        this._type = type;
        this._container = container;
        this._context = context;
        container.classList.add(type);

        try {
            this._core = this.createEditorCore(container, context, ...(coreArguments ?? []));
            this.__register(this._core);
        } catch (err) {
            throw new Error(`Cannot create the editor core properly and the error message is: ${errorToMessage(err)}`);
        }
    }

    // [public abstract methods]

    protected abstract createEditorCore(container: HTMLElement, context: ViewContext, ...args: any[]): TCore;
    public abstract updateContent(event: RenderEvent): void;
    
    // [public methods]
    
    public get type(): TType {
        return this._type;
    }

    public get container(): HTMLElement {
        return this._container;
    }

    public override dispose(): void {
        this._core.destroy();
        super.dispose();
    }
}