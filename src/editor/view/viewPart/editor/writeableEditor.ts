import { EditorExtensionInfo } from "src/editor/editorWidget";
import { ViewContext } from "src/editor/view/editorView";
import { ReadableEditor } from "src/editor/view/viewPart/editor/readableEditor";


export abstract class WriteableEditor extends ReadableEditor {

    // [fields]

    // [constructor]

    constructor(
        container: HTMLElement,
        context: ViewContext,
        extensions: EditorExtensionInfo[],
    ) {
        super(container, context, extensions);
    }

    // [public methods]
    
}