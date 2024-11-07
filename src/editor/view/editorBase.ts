import 'src/editor/view/media/editor/editorBase.scss';
import { ProseEditorState, ProseEditorView } from "src/editor/common/proseMirror";
import { ViewContext } from "src/editor/view/editorView";
import { EditorViewProxy, IEditorViewProxy } from "src/editor/view/editorViewProxy";
import { IEditorExtension } from 'src/editor/common/editorExtension';

export interface IEditorBase extends IEditorViewProxy {
    
    /**
     * The direct wrapper container of `ProseMirror`.
     */
    readonly editorContainer: HTMLElement;
}

export abstract class EditorBase extends EditorViewProxy implements IEditorBase {

    // [fields]

    protected readonly _container: HTMLElement;
    protected readonly _context: ViewContext;

    // [constructor]

    constructor(
        container: HTMLElement,
        context: ViewContext,
        editorState: ProseEditorState,
        extensions: IEditorExtension[],
    ) {
        container.classList.add('editor-base');

        // binding the view part of the extension to the proseMirror
        const viewExtensionInfo = extensions.map(extension => ({ id: extension.id, extension: extension.getViewExtension() }));
        const view = new ProseEditorView(
            container, 
            {
                state: editorState,
                editable: () => context.options.writable.value,
            }
        );

        super(context, viewExtensionInfo, view);
        this._container = container;
        this._context = context;
    }

    // [public methods]

    get editorContainer(): HTMLElement { return this._container; }

    // [private helper methods]
}
