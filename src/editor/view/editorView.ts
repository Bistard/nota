import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogEvent } from "src/base/common/logger";
import { ProseEditorState } from "src/editor/common/proseMirror";
import { IEditorView, IEditorViewOptions } from "src/editor/common/view";
import { EditorRenderType, IEditorViewModel, IRenderEvent } from "src/editor/common/viewModel";
import { RichtextWindow } from "src/editor/view/viewPart/viewWindow/richtext/richtextWindow";
import { IViewWindow } from "src/editor/view/viewPart/viewWindow/window";

export class ViewContext {

    constructor(
        public readonly viewModel: IEditorViewModel,
        public readonly view: IEditorView,
        public readonly options: IEditorViewOptions,
        public readonly log: (event: ILogEvent<string | Error>) => void,
    ) {}
}

export class EditorView extends Disposable implements IEditorView {

    // [fields]

    private readonly _ctx: ViewContext;
    private readonly _winCentre: ViewWindowCentre;

    // [events]
    
    public readonly onRender: Register<void>;

    private readonly _onLog = this.__register(new Emitter<ILogEvent<string | Error>>());
    public readonly onLog = this._onLog.registerListener;

    // [constructor]
    
    constructor(
        container: HTMLElement,
        viewModel: IEditorViewModel,
        options: IEditorViewOptions,
    ) {
        super();

        const context = new ViewContext(viewModel, this, options, this._onLog.fire.bind(this));
        this._ctx = context;

        // the overall element that contains all the relevant components
        const editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container';

        // the centre that integrates the window-related functionalities
        this._winCentre = new ViewWindowCentre(editorContainer, context);
        this.onRender = this._winCentre.window.onRender;
        
        // update listener registration from view-model
        this.__registerViewModelListeners();

        // resource registration
        this.__register(this._winCentre);

        // render
        container.appendChild(editorContainer);
    }

    // [public methods]

    public isEditable(): boolean {
        return this._winCentre.window.isEditable();
    }

    public focus(): void {
        this._winCentre.window.focus();
    }

    public isFocused(): boolean {
        return this._winCentre.window.isFocused();
    }

    public destroy(): void {
        this._winCentre.window.destroy();
    }

    public isDestroyed(): boolean {
        return this._winCentre.window.isDestroyed();
    }
    
    public updateOptions(options: Partial<IEditorViewOptions>): void {
        
    }

    public override dispose(): void {
        super.dispose();
    }

    // [private helper methods]

    private __registerViewModelListeners(): void {
        const viewModel = this._ctx.viewModel;

        viewModel.onRender(event => {
            this._winCentre.render(event);
        });

        viewModel.onDidChangeRenderMode(mode => {
            this._winCentre.setRenderMode(mode);
        });
    }
}

/**
 * Interface only for {@link ViewWindowCentre}.
 */
interface IViewWindowCentre extends Disposable {

    /**
     * @description Render the given context to the editor window. Depending on
     * the rendering mode, the centre will decide which type of window to be 
     * created.
     * @param event The event that contains the context for rendering. 
     */
    render(event: IRenderEvent): void;

    /**
     * @description Change the current rendering mode. This will recreate the
     * current editor window to fit the desired rendering mode.
     * @param mode The desired rendering mode.
     */
    setRenderMode(mode: EditorRenderType): void;
}

/**
 * @class Integration on {@link IViewWindow} management.
 */
class ViewWindowCentre extends Disposable implements IViewWindowCentre {

    // [field]

    private readonly _container: HTMLElement;
    private readonly _ctx: ViewContext;
    
    private _renderMode: EditorRenderType;
    private _window: IViewWindow;

    // [constructor]

    constructor(container: HTMLElement, context: ViewContext) {
        super();

        this._ctx = context;

        const winContainer = document.createElement('div');
        winContainer.className = 'window-container';
        this._container = winContainer;

        const mode = context.viewModel.renderMode;
        const window = this.__createWindow(mode);

        this._renderMode = mode;
        this._window = window;

        container.appendChild(winContainer);
    }

    // [getter]

    get container(): HTMLElement {
        return this._container;
    }

    get window(): IViewWindow {
        return this._window;
    }
    
    get renderMode(): EditorRenderType {
        return this._renderMode;
    }

    // [public methods]

    public render(event: IRenderEvent): void {
        
        console.log('[view] on render event', event); // TEST

        /**
         * The new render event requires new type of rendering mode, destroys
         * the old window and create the new one.
         */
        if (event.type !== this._renderMode) {
            this.__destroyCurrWindow();
            this._window = this.__createWindow(event.type);
        }

        this._window.updateContent(event);
    }

    public setRenderMode(mode: EditorRenderType): void {
        if (mode === this._renderMode) {
            return;
        }

        const oldState = this._window.state;
        this.__destroyCurrWindow();
        this._window = this.__createWindow(mode, oldState);
    }

    // [private helper methods]

    /**
     * @description Constructs a new {@link IViewWindow} with the given render
     * type.
     * @param mode The given render type.
     * @param initState The initial state of the editor if provided.
     * @returns A newly constructed window.
     */
    private __createWindow(mode: EditorRenderType, initState?: ProseEditorState): IViewWindow {
        
        const winArgs = [this._container, this._ctx, initState] as const;
        let window: IViewWindow;
        
        switch (mode) {
            case EditorRenderType.Plain: {
                throw new Error('does not support plain text window yet.');
            }
            case EditorRenderType.Rich: {
                window = new RichtextWindow(...winArgs);
                break;
            }
            case EditorRenderType.Split: {
                // todo: splitWindow
                window = undefined!;
                throw new Error('does not support split window yet.');
            }
            default: {
                // todo: emptyWindow
                window = undefined!;
                throw new Error('does not support empty window yet.');
            }
        }

        this.__register(window);
        return window;
    }

    private __destroyCurrWindow(): void {
        this._window.destroy();
        this._window = undefined!;
    }
}