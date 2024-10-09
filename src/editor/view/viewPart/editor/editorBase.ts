import 'src/editor/view/media/editor/editorBase.scss';
import { ProseEditorView } from "src/editor/common/proseMirror";
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
        const extensionArr = viewExtensionInfo.map(info => info.extension);

        super(
            context,
            viewExtensionInfo,
            new ProseEditorView(
                container, 
                {
                    state: EditorViewProxy.__createNewViewStateFrom(schema, extensionArr, null),
                }
            ),
        );

        this._container = container;
        this._context = context;
    }

    // [public methods]


    // [private helper methods]

}
