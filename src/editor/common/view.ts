import { Register } from "src/base/common/event";
import { ILogEvent } from "src/base/common/logger";
import { IEditorEventBroadcaster } from "src/editor/common/eventBroadcaster";
import { EditorType, IEditorViewModel } from "src/editor/common/viewModel";
import { IBaseEditor } from "src/editor/view/viewPart/editors/baseEditor";
import { RichtextEditor } from "src/editor/view/viewPart/editors/richtextEditor/richtextEditor";

// TEST
export type PlaintextEditor = {} & IBaseEditor<EditorType.Plain>;
export type SplitviewEditor = {} & IBaseEditor<EditorType.Split>;

export type EditorInstance = RichtextEditor | PlaintextEditor | SplitviewEditor;

export interface IEditorView extends IEditorEventBroadcaster {

    /**
     * The binding view model.
     */
    readonly viewModel: IEditorViewModel;

    /**
     * The actual editor instance.
     */
    readonly editor: EditorInstance;

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