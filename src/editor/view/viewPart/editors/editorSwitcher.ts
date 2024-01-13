import { Disposable } from "src/base/common/dispose";
import { EditorInstance } from "src/editor/common/view";
import { EditorType, RenderEvent } from "src/editor/common/viewModel";
import { ViewContext } from "src/editor/view/editorView";
import { RichtextEditor } from "src/editor/view/viewPart/editors/richtextEditor_old/richtextEditor";

/**
 * Interface only for {@link EditorViewSwitcher}.
 */
export interface IEditorViewSwitcher extends Disposable {

    readonly container: HTMLElement;
    readonly editor: EditorInstance;
    readonly renderMode: EditorType;

    /**
     * @description Render the given context to the editor editor. Depending on
     * the rendering mode, the centre will decide which type of editor to be 
     * created.
     * @param event The event that contains the context for rendering. 
     */
    render(event: RenderEvent): void;

    /**
     * @description Change the current rendering mode. This will recreate the
     * current editor editor to fit the desired rendering mode.
     * @param mode The desired rendering mode.
     */
    setRenderMode(mode: EditorType): void;
}

/**
 * @class Integration on {@link EditorInstance}. Provide functionality to switch
 * the editor view into different rendering {@link EditorType} type easily.
 */
export class EditorViewSwitcher extends Disposable implements IEditorViewSwitcher {

    // [field]

    private readonly _container: HTMLElement;
    private readonly _ctx: ViewContext;
    
    private _renderMode: EditorType;
    private _editor: EditorInstance;

    // [constructor]

    constructor(container: HTMLElement, context: ViewContext) {
        super();

        this._ctx = context;

        const winContainer = document.createElement('div');
        winContainer.className = 'editor-container';
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

    get editor(): EditorInstance {
        return this._editor;
    }
    
    get renderMode(): EditorType {
        return this._renderMode;
    }

    // [public methods]

    public render(event: RenderEvent): void {
        console.log('[EditorView] on render event', event); // TEST

        /**
         * The new render event requires new type of rendering mode, destroys
         * the old editor and create the new one.
         */
        if (event.type !== this._renderMode) {
            this.__destroyCurrWindow();
            this._editor = this.__createWindow(event.type);
        }

        this._editor.updateContent(event as any);
    }

    public setRenderMode(mode: EditorType): void {
        if (mode === this._renderMode) {
            return;
        }

        this.__destroyCurrWindow();
        this._editor = this.__createWindow(mode, this._editor);
    }

    // [private helper methods]

    private __createWindow(mode: EditorType, oldEdtior?: EditorInstance): EditorInstance {
        
        const winArgs = [this._container, this._ctx, oldEdtior] as const;
        let editor: EditorInstance;
        
        switch (mode) {
            case EditorType.Plain: {
                throw new Error('does not support plain text editor yet.');
            }
            case EditorType.Rich: {
                editor = RichtextEditor.create(...winArgs);
                break;
            }
            case EditorType.Split: {
                throw new Error('does not support split editor yet.');
            }
            default: {
                throw new Error('does not support empty editor yet.');
            }
        }

        this.__register(editor);
        return editor;
    }

    private __destroyCurrWindow(): void {
        this._editor.dispose();
        this._editor = undefined!;
    }
}