import 'src/editor/view/media/editorView.scss';
import { Disposable } from "src/base/common/dispose";
import { defaultLog, ILogEvent, ILogService } from "src/base/common/logger";
import { EditorWindow, IEditorView } from "src/editor/common/view";
import { EditorOptionsType } from "src/editor/common/editorConfiguration";
import { IEditorExtension } from 'src/editor/common/editorExtension';
import { IEditorModel } from 'src/editor/common/model';
import { ProseEditorState } from 'src/editor/common/proseMirror';
import { IEditorViewModel } from 'src/editor/common/viewModel';
import { RichTextView } from 'src/editor/view/richTextView';
import { IEditorInputEmulator } from 'src/editor/view/inputEmulator';
import { IInstantiationService, InstantiationService } from 'src/platform/instantiation/common/instantiation';
import { KeyCode } from 'src/base/common/keyboard';

export class ViewContext {
    constructor(
        public readonly viewModel: IEditorViewModel,
        public readonly view: IEditorView,
        public readonly options: EditorOptionsType,
        public readonly log: (event: ILogEvent) => void,
    ) {}
}

// region - EditorView

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
    
    get onDidBlur() { return this._view.onDidFocus; }
    get onDidFocus() { return this._view.onDidFocus; }
    
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
    get onTextInput() { return this._view.onTextInput; }
    
    get onCompositionStart() { return this._view.onCompositionStart; }
    get onCompositionEnd() { return this._view.onCompositionEnd; }

    get onMouseOver() { return this._view.onMouseOver; }
    get onMouseOut() { return this._view.onMouseOut; }
    get onMouseEnter() { return this._view.onMouseEnter; }
    get onMouseLeave() { return this._view.onMouseLeave; }
    get onMouseDown() { return this._view.onMouseDown; }
    get onMouseUp() { return this._view.onMouseUp; }
    get onMouseMove() { return this._view.onMouseMove; }
    
    get onPaste() { return this._view.onPaste; }
    get onDrop() { return this._view.onDrop; }
    get onDropOverlay() { return this._view.onDropOverlay; }
    get onDrag() { return this._view.onDrag; }
    get onDragStart() { return this._view.onDragStart; }
    get onDragEnd() { return this._view.onDragEnd; }
    get onDragOver() { return this._view.onDragOver; }
    get onDragEnter() { return this._view.onDragEnter; }
    get onDragLeave() { return this._view.onDragLeave; }
    
    get onWheel() { return this._view.onWheel; }

    // [constructor]
    
    constructor(
        container: HTMLElement,
        viewModel: IEditorViewModel,
        initState: ProseEditorState,
        extensions: IEditorExtension[],
        inputEmulator: IEditorInputEmulator,
        options: EditorOptionsType,
        @ILogService logService: ILogService,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super();

        this._container = document.createElement('div');
        this._container.className = 'editor-view-container';

        const context = new ViewContext(viewModel, this, options, event => defaultLog(logService, event.level, 'EditorView', event.message, event.error, event.additional));
        this._ctx = context;

        // the centre that integrates the editor-related functionalities
        const editorElement = document.createElement('div');
        editorElement.className = 'editor-container';
        this._view = this.__register(instantiationService.createInstance(RichTextView, editorElement, this._container, context, initState, extensions, inputEmulator));
        
        // forward: start listening events from view model
        this.__registerEventFromViewModel();
        this.__registerEventToViewModel();

        // render
        this._container.appendChild(editorElement);
        container.appendChild(this._container);

        // others
        logService.debug('EditorView', 'Constructed');
    }

    // [public methods]

    get editor(): EditorWindow {
        return this._view;
    }

    public override dispose(): void {
        super.dispose();
        this._container.remove();
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

    public type(text: string, from?: number, to?: number): void {
        this._view.type(text, from, to);
    }

    public keydown(code: KeyCode, alt?: boolean, shift?: boolean, ctrl?: boolean, meta?: boolean): void {
        this._view.keydown(code, alt, shift, ctrl, meta);
    }

    // [private helper methods]

    private __registerEventFromViewModel(): void {
        const viewModel = this._ctx.viewModel;

        this.__register(viewModel.onDidContentChange(event => {
            const { tr } = event;
            this._view.internalView.dispatch(tr);
        }));
    }

    private __registerEventToViewModel(): void {
        const viewModel = this._ctx.viewModel;

        /**
         * Since in Prosemirror whenever the content of the document changes, 
         * the old {@link ProseEditorState} is no longer valid. Therefore we 
         * need to inform view model to update its state.
         */
        this.__register(this._view.onDidContentChange(e => viewModel.updateViewChange(e)));
        this.__register(this._view.onDidSelectionChange(e => viewModel.updateViewChange(e)));
    }
}