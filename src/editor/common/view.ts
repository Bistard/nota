import { Register } from "src/base/common/event";
import { ILogEvent } from "src/base/common/logger";
import { IEditorEventBroadcaster } from "src/editor/common/eventBroadcaster";
import { IEditorViewModel } from "src/editor/common/viewModel";

export interface IEditorView extends IEditorEventBroadcaster {

    readonly viewModel: IEditorViewModel;

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