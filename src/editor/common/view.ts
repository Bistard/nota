import { Register } from "src/base/common/event";
import { ILogEvent } from "src/base/common/logger";
import { IEditorEventBroadcaster } from "src/editor/common/eventBroadcaster";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { IBaseEditor } from "src/editor/view/viewPart/editors/baseEditor";

export interface IEditorView extends IEditorEventBroadcaster {

    /**
     * The binding view model.
     */
    readonly viewModel: IEditorViewModel;

    /**
     * The actual editor instance.
     */
    readonly editor: IBaseEditor;

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