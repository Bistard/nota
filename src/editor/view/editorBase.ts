import 'src/editor/view/media/editor/editorBase.scss';
import { ProseEditorState, ProseEditorView } from "src/editor/common/proseMirror";
import { ViewContext } from "src/editor/view/editorView";
import { EditorViewProxy, IEditorViewProxy } from "src/editor/view/editorViewProxy";
import { IEditorExtension } from 'src/editor/common/editorExtension';

export interface IEditorBase extends IEditorViewProxy {
    
    /**
     * The container that contains all the editor-related components.
     */
    readonly container: HTMLElement;

    /**
     * The container that directly contains the actual editor components and 
     * editor-related overlay components.
     */
    readonly overlayContainer: HTMLElement;
}

export abstract class EditorBase extends EditorViewProxy implements IEditorBase {

    // [fields]

    protected readonly _container: HTMLElement;
    protected readonly _editorContainer: HTMLElement;
    protected readonly _context: ViewContext;

    // [constructor]

    constructor(
        overlayContainer: HTMLElement,
        domEventElement: HTMLElement,
        context: ViewContext,
        editorState: ProseEditorState,
        extensions: IEditorExtension[],
    ) {
        overlayContainer.classList.add('editor-base');

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
    }

    // [public methods]

    get container() { return this._container; }
    get overlayContainer() { return this._editorContainer; }

    // [private helper methods]
}
