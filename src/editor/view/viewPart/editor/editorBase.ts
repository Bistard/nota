import 'src/editor/view/media/editor/editorBase.scss';
import { ProseEditorState, ProseEditorView } from "src/editor/common/proseMirror";
import { EditorExtensionInfo } from "src/editor/editorWidget";
import { ViewContext } from "src/editor/view/editorView";
import { EditorViewProxy, IEditorViewProxy } from "src/editor/view/viewPart/editor/adapter/editorViewProxy";

export interface IEditorBase extends IEditorViewProxy {
    
}

export abstract class EditorBase extends EditorViewProxy implements IEditorBase {

    // [fields]

    protected readonly _container: HTMLElement;
    protected readonly _context: ViewContext;

    // [constructor]

    constructor(
        container: HTMLElement,
        context: ViewContext,
        extensions: EditorExtensionInfo[],
    ) {
        container.classList.add('editor-base');

        // binding the view part of the extension to the proseMirror
        const schema = context.viewModel.getSchema();
        const viewExtensionInfo = extensions.map(ext => { return { id: ext.id, extension: ext.extension.getViewExtension() }; });
        const view = new ProseEditorView(
            container, 
            {
                state: ProseEditorState.create({
                    schema: schema,
                    doc: undefined,
                    /**
                     * Note:
                     * 1. The {@link ProseEditorView} is always constructed 
                     *    slightly before the {@link EditorModel.onDidBuild} 
                     *    process completes. If we bind the extension immediately, 
                     *    Initialization of {@link EditorExtension} will be 
                     *    triggered at this point.
                     * 2. When {@link EditorModel.onDidBuild} finishes, it will 
                     *    call {@link this.render()} eventually, which will 
                     *    cause the Initialization of {@link EditorExtension} to 
                     *    be triggered again.
                     * 
                     * As a result, the Initialization of {@link EditorExtension} 
                     * will be called twice in a short span of time. To avoid 
                     * this, we only trigger them during the second step.
                     */
                    plugins: [],
                }),
            }
        );

        super(context, viewExtensionInfo, view);
        this._container = container;
        this._context = context;
    }

    // [public methods]


    // [private helper methods]

}
