import 'src/editor/view/media/editor/richtextEditor.scss';
import { ViewContext } from "src/editor/view/editorView";
import { EditorBase } from 'src/editor/view/viewPart/editor/editorBase';
import { IEditorExtension } from 'src/editor/common/extension/editorExtension';

export class RichtextEditor extends EditorBase {

    // [fields]

    // [constructor]

    constructor(
        container: HTMLElement,
        context: ViewContext,
        extensions: IEditorExtension[],
    ) {
        container.classList.add('rich-text');
        super(container, context, extensions);
    }

    // [public methods]
    
}