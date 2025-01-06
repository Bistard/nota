import type { IEditorPaneRegistrant } from "src/workbench/services/editorPane/editorPaneRegistrant";
import { AutoDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { EditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";
import { ILayoutable, Layoutable } from "src/workbench/services/component/layoutable";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

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
 * 3. {@link shouldUpdate()}: Whenever {@link setModel()} gets invoked (except-
 *                              first time), this gets invoked and decide whether should rerender.
 * 4. {@link onUpdate()}    : Only invoked when {@link shouldUpdate()} returns true.
 * 5. {@link dispose()}       : Editor destructed.
 * 
 * @override Subclasses may extends this base class to override certain behaviors.
 * @see {@link IEditorPaneRegistrant}
 */
export interface IEditorPaneView<T extends EditorPaneModel = EditorPaneModel> extends ILayoutable {

    /**
     * @event
     * Fires whenever the view is about to dispose.
     */
    readonly onWillDispose: Register<void>;
    
    /**
     * Should be a human readable string identifier to this type of editor pane.
     * All instances of a {@link IEditorPaneView} should shares the same type.
     * 
     * @example "TextEditor" or "PreviewEditor"
     */
    readonly type: string;

    /**
     * The {@link EditorPaneModel} instance to which this view is currently 
     * bound. The model contains all the state and data needed by this view.
     *
     * @note This model shares the same lifecycle as the view. Once the view
     *       is disposed, its model will also be disposed.
     */
    readonly model: T;

    /**
     * The primary container that encapsulates the entire editor pane UI. This 
     * is the root element you attach DOM structures or components to.
     */
    readonly container: HTMLElement | undefined;

    // [subclass implementation]
   
    /**
     * @description Called when a new model candidate is proposed to this editor. 
     * This method decides if the view accepts the model for display or processing.
     * 
     * @param candidate The potential model to be set on this view.
     * @returns A boolean indicating whether this candidate is acceptable.
     * 
     * @override Subclasses should implement this method to perform any
     *           custom matching or pre-processing logic.
     * @note The model will always be one of the valid models when you 
     *       registered an editor pane view.
     * @note In most cases, returning `true` is sufficient unless the editor
     *       wants to explicitly reject certain models.
     */
    onModel(candidate: T): boolean;

    /**
     * @description Called when the view is rendered for the first time. Use 
     * this hook to perform one-time rendering or asynchronous tasks that need 
     * to be completed for the first time.
     * 
     * @override Subclasses must implement this method to render content 
     *           into the given parent element.
     * @param parent The parent HTML element to render into.
     */
    onRender(parent: HTMLElement): Promise<void> | void;

    /**
     * @description Called if and only if a new model is bound to this editor, 
     * and {@link shouldUpdate} returns `true`. It provides an opportunity to 
     * re-render or update the UI to accommodate the new model.
     * 
     * @override Subclasses must implement this method if they need to re-render 
     *           the UI (either partially or fully) based on a new model.
     * @param parent The parent HTML element to re-render into (the same 
     *               container used in {@link onRender}).
     */
    onUpdate(parent: HTMLElement): Promise<void> | void;

    /**
     * @description Determines if the editor pane should re-render when a new 
     * model is set.
     * 
     * @override Subclasses implement logic here to compare the incoming model 
     *           with the existing one or other state. If it returns `true`, 
     *           {@link onUpdate} will be invoked. Otherwise, the new model is 
     *           accepted silently without re-rendering the UI.
     * @param model The new model being set.
     */
    shouldUpdate(model: T): boolean;

    /**
     * @description Called whenever the editor's visibility changes, for example 
     * when it's attached or detached from the DOM, or when switching tabs. Use 
     * this hook to save resources, pause media, or refresh the view based on 
     * visibility status.
     * 
     * @override Subclasses may implement this to handle visibility logic 
     *           (e.g., pausing animations when hidden).
     * @param visibility A boolean indicating whether the editor is becoming 
     *                   visible (`true`) or hidden (`false`).
     */
    onVisibility(visibility: boolean): Promise<void> | void;

    // [client SHOULD NOT invoke these functions]
    
    /**
     * @description Used internally to associate this view with a new model. 
     * Clients should not directly call this method; it is usually managed by 
     * the editor group.
     * 
     * @param newModel The new model to be set for this view.
     * @returns A boolean indicating whether a re-render is needed 
     *          (`true` if {@link shouldUpdate} says so).
     */
    setModel(newModel: T): boolean;
}

export abstract class EditorPaneView<T extends EditorPaneModel = EditorPaneModel> extends Layoutable implements IEditorPaneView<T> {

    // [event]

    private readonly _onWillDispose = this.__register(new Emitter<void>());
    public readonly onWillDispose = this._onWillDispose.registerListener;

    // [fields]

    private readonly _model: AutoDisposable<T>;

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super(instantiationService);
        this._model = this.__register(new AutoDisposable());
    }

    // [getter/setter]

    get model(): T { return this._model.get(); }
    
    // [public - subclass implementation]
    
    abstract get type(): string;
    abstract get container(): HTMLElement | undefined;
    public abstract onModel(candidate: T): boolean;
	public abstract onRender(parent: HTMLElement): Promise<void> | void;
	public abstract onUpdate(parent: HTMLElement): Promise<void> | void;
    public abstract shouldUpdate(model: T): boolean;
    public abstract onVisibility(visibility: boolean): Promise<void> | void;

    // [public - client SHOULD NOT invoke these functions]

    public override getLayoutElement(): HTMLElement | null | undefined {
        return this.container;
    }

    public setModel(newModel: T): boolean {
        
        // never set before.
        if (!this._model.isSet()) {
            this._model.set(newModel);
            return true;
        }
        
        const rerender = this.shouldUpdate(newModel);
        
        // make sure only replace the old model after `shouldUpdate`
        this._model.set(newModel);
        
        return rerender;
    }

    public override dispose(): void {
        this._onWillDispose.fire();
        super.dispose();
    }
}