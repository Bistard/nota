import { Disposable } from "src/base/common/dispose";
import { EditorWindow } from "src/editor/common/view";
import { EditorType, RenderEvent } from "src/editor/common/viewModel";
import { EditorExtensionType } from "src/editor/editorWidget";
import { ViewContext } from "src/editor/view/editorView";
import { RichtextEditor } from "src/editor/view/viewPart/editor/richtextEditor";

/**
 * Interface only for {@link EditorWindowSwitcher}.
 */
export interface IEditorWindowSwitcher extends Disposable {

    readonly container: HTMLElement;
    readonly editor: EditorWindow;
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
 * @class Integration on {@link EditorWindow}. Provide functionality to switch
 * the editor view into different rendering {@link EditorType} type easily.
 */
export class EditorWindowSwitcher extends Disposable implements IEditorWindowSwitcher {

    // [field]

    private readonly _container: HTMLElement;
    private readonly _ctx: ViewContext;
    private readonly _extensions: EditorExtensionType[];

    private _renderMode: EditorType;
    private _editor: EditorWindow;

    // [constructor]

    constructor(
        container: HTMLElement,
        context: ViewContext,
        extensions: EditorExtensionType[],
    ) {
        super();

        this._ctx = context;
        this._extensions = extensions;

        this._container = this.__getEditorContainer();

        this._renderMode = context.viewModel.renderMode;
        this._editor = this.__createWindow(this._renderMode);

        container.appendChild(this._container);
    }

    // [getter]

    get container(): HTMLElement {
        return this._container;
    }

    get editor(): EditorWindow {
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

        // render

        if (event.type === EditorType.Rich) {
            this._editor.render(event.document);
        }
    }

    public setRenderMode(mode: EditorType): void {
        if (mode === this._renderMode) {
            return;
        }

        this.__destroyCurrWindow();
        this._editor = this.__createWindow(mode, this._editor);
    }

    // [private helper methods]

    private __createWindow(mode: EditorType, oldEdtior?: EditorWindow): EditorWindow {

        const editorArguments = <const>[this._container, this._ctx, this._extensions];
        let editor: EditorWindow;

        switch (mode) {
            case EditorType.Plain: {
                throw new Error('does not support plain text editor yet.');
            }
            case EditorType.Rich: {
                editor = new RichtextEditor(...editorArguments);
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

    private __getEditorContainer(): HTMLElement {
        const winContainer = document.createElement('div');
        winContainer.className = 'editor-container';
        return winContainer;
    }
}