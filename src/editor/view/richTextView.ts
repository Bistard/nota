import 'src/editor/view/media/editorBase.scss';
import 'src/editor/view/media/richTextView.scss';
import { ProseEditorState, ProseEditorView } from "src/editor/common/proseMirror";
import { ViewContext } from "src/editor/view/editorView";
import { EditorViewProxy, IEditorViewProxy } from "src/editor/view/editorViewProxy";
import { IEditorExtension } from 'src/editor/common/editorExtension';
import { IEditorInputEmulator } from 'src/editor/view/inputEmulator';
import { IOnTextInputEvent } from 'src/editor/view/proseEventBroadcaster';
import { createStandardKeyboardEvent } from 'src/base/common/keyboard';

/**
 * An interface only for {@link RichTextView}.
 */
export interface IRichTextView extends IEditorViewProxy {
    
    // [fields]

    /**
     * The container that contains all the editor-related components.
     */
    readonly container: HTMLElement;

    /**
     * The container that directly contains the actual editor components and 
     * editor-related overlay components.
     * 
     * @note This is the container that is scrollable.
     */
    readonly overlayContainer: HTMLElement;
}

export class RichTextView extends EditorViewProxy implements IRichTextView {

    // [fields]

    protected readonly _container: HTMLElement;
    protected readonly _editorContainer: HTMLElement;
    protected readonly _context: ViewContext;
    
    private readonly _inputEmulator: IEditorInputEmulator;

    // [constructor]

    constructor(
        overlayContainer: HTMLElement,
        domEventElement: HTMLElement,
        context: ViewContext,
        editorState: ProseEditorState,
        extensions: IEditorExtension[],
        inputEmulator: IEditorInputEmulator,
    ) {
        overlayContainer.classList.add('editor-base', 'rich-text');

        // binding the view part of the extension to the proseMirror
        const viewExtensionInfo = extensions.map(extension => ({ id: extension.id, extension: extension.getViewExtension() }));
        const view = new ProseEditorView(
            overlayContainer, 
            {
                state: editorState,
                editable: () => context.options.writable.value,
            }
        );

        super(domEventElement, context, viewExtensionInfo, view);
        this._editorContainer = overlayContainer;
        this._container = domEventElement;
        this._context = context;
        this._inputEmulator = inputEmulator;

        // send latest data back to viewModel after initialization
        context.viewModel.updateViewChange({
            view: view,
            transaction: view.state.tr,
        });
    }

    // [getter]
    
    get container() { return this._container; }
    get overlayContainer() { return this._editorContainer; }
    
    // [public methods]

    public type(text: string, from?: number, to?: number): void {
        
        // FIX: after snippet is based on state machine, refactor this code.
        
        let pointer = 0;
        let i = 0;
        for (; i < text.length; i++) {
            const c = text[i]!;
            if (c === ' ' || c === '\n') {
                const textBefore = text.slice(pointer, i);
                this.__type(textBefore, from, to);
                this.__type(c, from, to);
                pointer = i + 1;
            }
        }

        const lastText = text.slice(pointer, i);
        if (lastText) {
            this.__type(lastText, from, to);
        }
    }

    // [private helper methods]
    
    private __type(text: string, from?: number, to?: number): void {
        // case 1: typing '\n', we emulate pressing `enter` on keydown.
        if (text === '\n') {
            this._inputEmulator.keydown({
                view: this._view,
                event: createStandardKeyboardEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    charCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true,
                })),
                preventDefault: () => {},
            });
            return;
        }

        // general case
        const { state } = this._view;
        from ??= state.selection.from;
        to   ??= state.selection.to;

        let prevented = false;
        const event: IOnTextInputEvent = {
            view: this._view, 
            text, 
            from, 
            to,
            preventDefault: () => prevented = true,
        };
        this._inputEmulator.type(event);
        if (prevented) {
            return;
        }

        // default behavior on typing
        const tr = state.tr.insertText(text, from, to);
        const newState = state.apply(tr);

        // render it
        this.render(newState);
    }
}
