import { ProseEditorState, ProseEditorView } from "src/editor/common/proseMirror";
import { EditorExtensionType } from "src/editor/editorWidget";
import { ViewContext } from "src/editor/view/editorView";
import { EditorViewProxy, IEditorViewProxy } from "src/editor/view/viewPart/editor/adapter/editorViewProxy";
import { EditorSchema } from "src/editor/viewModel/schema";

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
        extensions: EditorExtensionType[],
    ) {
        // binding the view part of the extension to the proseMirror
        const viewExtensions = extensions.map(ext => ext.extension.getViewExtension());
        const schema = context.viewModel.getSchema();

        super(
            new ProseEditorView(
                container, 
                {
                    state: createtDefaultState(schema),
                    plugins: [
                        ...viewExtensions,
                    ],
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

function createtDefaultState(schema: EditorSchema): ProseEditorState {
    return ProseEditorState.create({
        schema: schema,
        plugins: [],
    });
}