import { ProseEditorState, ProseEditorView } from "src/editor/common/proseMirror";
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
    ) {
        super(
            new ProseEditorView(
                container, 
                {
                    state: createtDefaultState(context),
                    plugins: [],
                }
            ),
            context,
        );

        this._container = container;
        this._context = context;
    }

    // [public methods]


    // [private helper methods]

}

function createtDefaultState(context: ViewContext): ProseEditorState {
    return ProseEditorState.create({
        schema: context.viewModel.getSchema(),
        plugins: [],
    });
}