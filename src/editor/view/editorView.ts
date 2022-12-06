import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogEvent } from "src/base/common/logger";
import { ProseEditorState } from "src/editor/common/proseMirror";
import { IEditorView, IEditorViewOptions } from "src/editor/common/view";
import { EditorRenderType, IEditorViewModel, IRenderEvent } from "src/editor/common/viewModel";
import { EditorOptionsType } from "src/editor/common/configuration/editorConfiguration";
import { RichtextEditor } from "src/editor/view/viewPart/editors/richtextEditor/richtextEditor";
import { IBaseEditor } from "src/editor/view/viewPart/editors/baseEditor";

export class ViewContext {
    constructor(
        public readonly viewModel: IEditorViewModel,
        public readonly view: IEditorView,
        public readonly options: EditorOptionsType,
        public readonly log: (event: ILogEvent<string | Error>) => void,
    ) {}
}

export class EditorView extends Disposable implements IEditorView {

    // [fields]

    private readonly _container: HTMLElement;

    private readonly _ctx: ViewContext;
    private readonly _editorManager: IEditorManager;

    // [events]
    
    public readonly onBeforeRender: Register<void>;

    private readonly _onLog = this.__register(new Emitter<ILogEvent<string | Error>>());
    public readonly onLog = this._onLog.registerListener;

    // [constructor]
    
    constructor(
        container: HTMLElement,
        viewModel: IEditorViewModel,
        // commandDelegate: ICommandDelegate,
        options: EditorOptionsType,
    ) {
        super();

        const context = new ViewContext(viewModel, this, options, this._onLog.fire.bind(this));
        this._ctx = context;

        // the overall element that contains all the relevant components
        const editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container';
        this._container = editorContainer;

        // the centre that integrates the editor-related functionalities
        this._editorManager = new EditorManager(editorContainer, context);
        this.onBeforeRender = this._editorManager.editor.onBeforeRender;
        
        // update listener registration from view-model
        this.__registerViewModelListeners();

        // resource registration
        this.__register(this._editorManager);

        // render
        container.appendChild(this._container);
    }

    // [public methods]

    public isEditable(): boolean {
        return this._editorManager.editor.isEditable();
    }

    public focus(): void {
        this._editorManager.editor.focus();
    }

    public isFocused(): boolean {
        return this._editorManager.editor.isFocused();
    }

    public destroy(): void {
        this._editorManager.editor.destroy();
    }

    public isDestroyed(): boolean {
        return this._editorManager.editor.isDestroyed();
    }
    
    public updateOptions(options: Partial<IEditorViewOptions>): void {
        
    }

    public override dispose(): void {
        super.dispose();
        this._container.remove();
    }

    // [private helper methods]

    private __registerViewModelListeners(): void {
        const viewModel = this._ctx.viewModel;

        viewModel.onRender(event => {
            this._editorManager.render(event);
        });

        viewModel.onDidChangeRenderMode(mode => {
            this._editorManager.setRenderMode(mode);
        });
    }
}

/**
 * Interface only for {@link EditorManager}.
 */
interface IEditorManager extends Disposable {

    readonly container: HTMLElement;
    readonly editor: IBaseEditor;
    readonly renderMode: EditorRenderType;

    /**
     * @description Render the given context to the editor editor. Depending on
     * the rendering mode, the centre will decide which type of editor to be 
     * created.
     * @param event The event that contains the context for rendering. 
     */
    render(event: IRenderEvent): void;

    /**
     * @description Change the current rendering mode. This will recreate the
     * current editor editor to fit the desired rendering mode.
     * @param mode The desired rendering mode.
     */
    setRenderMode(mode: EditorRenderType): void;
}

/**
 * @class Integration on {@link IBaseEditor} management.
 */
class EditorManager extends Disposable implements IEditorManager {

    // [field]

    private readonly _container: HTMLElement;
    private readonly _ctx: ViewContext;
    
    private _renderMode: EditorRenderType;
    private _editor: IBaseEditor;

    // [constructor]

    constructor(container: HTMLElement, context: ViewContext) {
        super();

        this._ctx = context;

        const winContainer = document.createElement('div');
        winContainer.className = '.editor-container';
        this._container = winContainer;

        const mode = context.viewModel.renderMode;
        const editor = this.__createWindow(mode);

        this._renderMode = mode;
        this._editor = editor;

        container.appendChild(winContainer);
    }

    // [getter]

    get container(): HTMLElement {
        return this._container;
    }

    get editor(): IBaseEditor {
        return this._editor;
    }
    
    get renderMode(): EditorRenderType {
        return this._renderMode;
    }

    // [public methods]

    public render(event: IRenderEvent): void {
        
        console.log('[view] on render event', event); // TEST

        /**
         * The new render event requires new type of rendering mode, destroys
         * the old editor and create the new one.
         */
        if (event.type !== this._renderMode) {
            this.__destroyCurrWindow();
            this._editor = this.__createWindow(event.type);
        }

        this._editor.updateContent(event);
    }

    public setRenderMode(mode: EditorRenderType): void {
        if (mode === this._renderMode) {
            return;
        }

        const oldState = this._editor.state;
        this.__destroyCurrWindow();
        this._editor = this.__createWindow(mode, oldState);
    }

    // [private helper methods]

    /**
     * @description Constructs a new {@link IBaseEditor} with the given render
     * type.
     * @param mode The given render type.
     * @param initState The initial state of the editor if provided.
     * @returns A newly constructed editor.
     */
    private __createWindow(mode: EditorRenderType, initState?: ProseEditorState): IBaseEditor {
        
        const winArgs = [this._container, this._ctx, initState] as const;
        let editor: IBaseEditor;
        
        switch (mode) {
            case EditorRenderType.Plain: {
                // todo: splitWindow
                throw new Error('does not support plain text editor yet.');
            }
            case EditorRenderType.Rich: {
                editor = new RichtextEditor(...winArgs);
                break;
            }
            case EditorRenderType.Split: {
                // todo: splitWindow
                throw new Error('does not support split editor yet.');
            }
            default: {
                // todo: emptyWindow
                throw new Error('does not support empty editor yet.');
            }
        }

        this.__register(editor);
        return editor;
    }

    private __destroyCurrWindow(): void {
        this._editor.destroy();
        this._editor = undefined!;
    }
}