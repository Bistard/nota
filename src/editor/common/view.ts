import { Register } from "src/base/common/event";
import { ILogEvent } from "src/base/common/logger";
import { IEditorViewCore } from "src/editor/view/editorViewCore";

export interface IEditorView extends IEditorViewCore {

    /**
     * Fires when a log is about happen.
     */
    readonly onLog: Register<ILogEvent<string | Error>>;

    /**
     * @description Updates the options of the editor view.
     * @param options The options.
     */
    updateOptions(options: Partial<IEditorViewOptions>): void;
}

export interface IEditorViewOptions {

}