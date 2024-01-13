import { ViewContext } from "src/editor/view/editorView";
import { EditorBase } from "src/editor/view/viewPart/editor/editorBase";


export abstract class ReadableEditor extends EditorBase {

    // [fields]

    // [constructor]

    constructor(
        container: HTMLElement,
        context: ViewContext,
    ) {
        super(container, context);
    }

    // [public methods]
}