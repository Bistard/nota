import 'src/editor/view/media/editor/richtextEditor.scss';
import { EditorExtensionInfo } from "src/editor/editorWidget";
import { ViewContext } from "src/editor/view/editorView";
import { EditorBase } from 'src/editor/view/viewPart/editor/editorBase';

export class RichtextEditor extends EditorBase {

    // [fields]

    // [constructor]

    constructor(
        container: HTMLElement,
        context: ViewContext,
        extensions: EditorExtensionInfo[],
    ) {
        container.classList.add('rich-text');
        super(container, context, extensions);
    }

    // [public methods]
    
}