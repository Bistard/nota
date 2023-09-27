import { Disposable } from "src/base/common/dispose";
import { EditorRenderMode, IEditorWidgetOptions } from "src/editor_new/common/editorConfiguration";

/**
 * // TODO
 */
export interface IEditorWindowInstance {

    readonly renderMode: EditorRenderMode;
}

/**
 * // TODO
 */
export abstract class EditorWindowInstance extends Disposable implements IEditorWindowInstance {
    
    // [fields]

    public abstract readonly renderMode: EditorRenderMode;

    // [constructor]

    constructor() {
        super();
    }

    // [public methods]

    public abstract render(container: HTMLElement, options: IEditorWidgetOptions): Promise<void>;
}
