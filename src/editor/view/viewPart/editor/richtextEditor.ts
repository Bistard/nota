import { EditorExtensionInfo } from "src/editor/editorWidget";
import { ViewContext } from "src/editor/view/editorView";
import { WriteableEditor } from "src/editor/view/viewPart/editor/writeableEditor";

export class RichtextEditor extends WriteableEditor {

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