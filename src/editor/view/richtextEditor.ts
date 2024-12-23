import 'src/editor/view/media/editor/richtextEditor.scss';
import { ViewContext } from "src/editor/view/editorView";
import { EditorBase } from 'src/editor/view/editorBase';
import { IEditorExtension } from 'src/editor/common/editorExtension';
import { ProseEditorState } from 'src/editor/common/proseMirror';

export class RichtextEditor extends EditorBase {

    // [fields]

    // [constructor]

    constructor(
        container: HTMLElement,
        domEventElement: HTMLElement,
        context: ViewContext,
        editorState: ProseEditorState,
        extensions: IEditorExtension[],
    ) {
        container.classList.add('rich-text');
        super(container, domEventElement, context, editorState, extensions);
    }

    // [public methods]
    
}