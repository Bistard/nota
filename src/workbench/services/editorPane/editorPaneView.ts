import type { IEditorPaneRegistrant } from "src/workbench/services/editorPane/editorPaneRegistrant";
import { AutoDisposable, Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { EditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";

/**
 * {@link IEditorPaneView}
 * 
 * @description The base class of editors in the workspace. Represents the UI 
 * component associated with an editor model. Every view will bonded with an 
 * {@link EditorPaneModel}. 
 * 
 * @note The lifecycle of an view is managed by workspace and groups. Its own 
 * lifecycle goes in the order:
 * 0. {@link setModel()}      : Editor bonded with a model when created. Can be
 *                              called arbitrary times.
 * 1. {@link onInitialize()}  : Editor gets initiated.
 * 2. {@link onRender()}      : Editor first rendering process (only invoked once).
 * 3. {@link shouldRerender()}: Whenever {@link setModel()} gets invoked (except-
 *                              first time), this gets invoked and decide whether should rerender.
 * 4. {@link onRerender()}    : Only invoked when {@link shouldRerender()} returns true.
 * 5. {@link dispose()}       : Editor destructed.
 * 
 * @override Subclasses may extends this base class to override certain behaviors.
 * @see {@link IEditorPaneRegistrant}
 */
export interface IEditorPaneView<T extends EditorPaneModel = EditorPaneModel> extends Disposable {

    /**
     * Fires whenever the view is about to dispose.
     */
    readonly onWillDispose: Register<void>;
    
    /**
     * Should be a human readable string identifier to this type of editor pane.
     * Each instance of the same {@link IEditorPaneView} should shares the same 
     * type.
     */
    readonly type: string;

    /**
     * Every view will bonded with an {@link EditorPaneModel}. 
     * @note The model will share the same lifecycle with the {@link EditorPaneView}.
     */
    readonly model: T;

    /**
     * Indicates the container of the entire editor pane view.
     */
    readonly container: HTMLElement | undefined;

    // [subclass implementation]

    /**
     * @override Subclasses should implement this method.
     * @description This method is called whenever a new editor model is about 
     * opening. This determines if this view decides to take this model.
     * @param candidate The model that
     * 
     * @note The model will always be one of the valid models when you 
     * registered an editor pane view.
     * @note Usually you may always return `true` in this method.
     */
    onModel(candidate: T): boolean;

    /**
     * @override Subclasses should implement this method.
	 * @description Renders the editor in the parent HTMLElement for the first 
     * time. 
	 */
    onRender(parent: HTMLElement): void;

    /**
     * @override Subclasses should implement this method.
     * @description Invoked when {@link shouldRerender()} returns true. 
     */
    onRerender(parent: HTMLElement): Promise<void> | void;

    /**
     * @override Subclasses should implement this method.
     * @description Whenever {@link EditorPaneView} binds to a new model, this
     * function decides whether to invoke {@link onRerender()}.
     * @param model The new model that will be bonded after.
     */
    shouldRerender(model: T): boolean;

    /**
     * @override Subclasses should implement this method.
     * @description A function will only be called once right before first 
     * rendering.
     */
    onInitialize(): Promise<void> | void;

    /**
     * @override Subclasses should implement this method.
     * @description A function will be called when the visibility of the editor
     * changes.
     */
    onVisibility(visibility: boolean): Promise<void> | void;

    // [client SHOULD NOT invoke these functions]
    
    /**
     * // TODO
     */
    setModel(newModel: T): boolean;
}

export abstract class EditorPaneView<T extends EditorPaneModel = EditorPaneModel> extends Disposable implements IEditorPaneView<T> {

    // [event]

    private readonly _onWillDispose = this.__register(new Emitter<void>());
    public readonly onWillDispose = this._onWillDispose.registerListener;

    // [fields]

    private readonly _model: AutoDisposable<T>;

    // [constructor]

    constructor() {
        super();
        this._model = this.__register(new AutoDisposable());
    }

    // [getter/setter]

    get model(): T { return this._model.get(); }
    
    // [public - subclass implementation]
    
    abstract get type(): string;
    abstract get container(): HTMLElement | undefined;
    public abstract onModel(candidate: T): boolean;
	public abstract onRender(parent: HTMLElement): void;
	public abstract onRerender(parent: HTMLElement): Promise<void> | void;
    public abstract shouldRerender(model: T): boolean;
    public abstract onInitialize(): void;
    public abstract onVisibility(visibility: boolean): Promise<void> | void;

    // [public - client SHOULD NOT invoke these functions]

    public setModel(newModel: T): boolean {
        
        // never set before.
        if (!this._model.isSet()) {
            this._model.set(newModel);
            return true;
        }
        
        const rerender = this.shouldRerender(newModel);
        
        // make sure only replace the old model after `shouldRerender`
        this._model.set(newModel);
        
        return rerender;
    }

    public override dispose(): void {
        this._onWillDispose.fire();
        super.dispose();
    }
}