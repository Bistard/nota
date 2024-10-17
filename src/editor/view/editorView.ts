import 'src/editor/view/media/editorView.scss';
import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { ILogEvent, LogLevel } from "src/base/common/logger";
import { EditorWindow, IEditorView, IEditorViewOptions } from "src/editor/common/view";
import { IEditorViewModel, IRenderRichEvent } from "src/editor/common/viewModel";
import { EditorOptionsType } from "src/editor/common/configuration/editorConfiguration";
import { RichtextEditor } from 'src/editor/view/viewPart/editor/richtextEditor';
import { IEditorExtension } from 'src/editor/common/extension/editorExtension';

export class ViewContext {
    constructor(
        public readonly viewModel: IEditorViewModel,
        public readonly view: IEditorView,
        public readonly options: EditorOptionsType,
        public readonly log: (event: ILogEvent) => void,
    ) {}
}

export class EditorView extends Disposable implements IEditorView {

    // [fields]

    /**
     * The HTML container of the entire editor.
     */
    private readonly _container: HTMLElement;

    /**
     * A wrapper of some frequently used references.
     */
    private readonly _ctx: ViewContext;
    private readonly _view: EditorWindow;

    // [events]
    
    private readonly _onLog = this.__register(new Emitter<ILogEvent>());
    public readonly onLog = this._onLog.registerListener;
    
    get onDidFocusChange() { return this._view.onDidFocusChange; }
    get onBeforeRender() { return this._view.onBeforeRender; }
    get onRender() { return this._view.onRender; }
    get onDidRender() { return this._view.onDidRender; }
    get onDidSelectionChange() { return this._view.onDidSelectionChange; }
    get onDidContentChange() { return this._view.onDidContentChange; }
    get onClick() { return this._view.onClick; }
    get onDidClick() { return this._view.onDidClick; }
    get onDoubleClick() { return this._view.onDoubleClick; }
    get onDidDoubleClick() { return this._view.onDidDoubleClick; }
    get onTripleClick() { return this._view.onTripleClick; }
    get onDidTripleClick() { return this._view.onDidTripleClick; }
    get onKeydown() { return this._view.onKeydown; }
    get onKeypress() { return this._view.onKeypress; }
    get onTextInput() { return this._view.onTextInput; }
    get onPaste() { return this._view.onPaste; }
    get onDrop() { return this._view.onDrop; }

    // [constructor]
    
    constructor(
        container: HTMLElement,
        viewModel: IEditorViewModel,
        extensions: IEditorExtension[],
        options: EditorOptionsType,
    ) {
        super();

        const context = new ViewContext(viewModel, this, options, this._onLog.fire.bind(this));
        this._ctx = context;

        // the centre that integrates the editor-related functionalities
        const editorElement = document.createElement('div');
        editorElement.className = 'editor-container';
        this._view = new RichtextEditor(editorElement, context, extensions);
        
        // start listening events from view-model
        this.__registerEventFromViewModel();

        // communication backward to view-model
        this.__registerEventToViewModel();

        // render
        this._container = document.createElement('div');
        this._container.className = 'editor-view-container';
        this._container.appendChild(editorElement);
        container.appendChild(this._container);

        // others
        this._onLog.fire({ level: LogLevel.DEBUG, message: 'EditorView constructed.' });
    }

    // [public methods]

    get editor(): EditorWindow {
        return this._view;
    }

    public isEditable(): boolean {
        return this._view.isEditable();
    }

    public focus(): void {
        this._view.focus();
    }

    public isFocused(): boolean {
        return this._view.isFocused();
    }

    public destroy(): void {
        this._view.destroy();
    }

    public isDestroyed(): boolean {
        return this._view.isDestroyed();
    }
    
    public updateOptions(options: Partial<IEditorViewOptions>): void {
        
    }

    public override dispose(): void {
        super.dispose();
        this._container.remove();
    }

    // [private helper methods]

    private __registerEventFromViewModel(): void {
        const viewModel = this._ctx.viewModel;

        this.__register(viewModel.onRender(event => {
            this._view.render((event as IRenderRichEvent).document);
        }));

        this.__register(viewModel.onDidRenderModeChange(mode => {
            // TODO
        }));
    }

    private __registerEventToViewModel(): void {
        // TODO
    }
}