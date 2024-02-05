import { EditorExtensionInfo } from "src/editor/editorWidget";
import { ViewContext } from "src/editor/view/editorView";
import { EditorBase } from "src/editor/view/viewPart/editor/editorBase";


export abstract class ReadableEditor extends EditorBase {

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