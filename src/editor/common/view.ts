import { Register } from "src/base/common/event";
import { ILogEvent } from "src/base/common/logger";
import { IProseEventBroadcaster } from "src/editor/view/viewPart/editor/adapter/proseEventBroadcaster";
import { EditorBase } from "src/editor/view/viewPart/editor/editorBase";
import { RichtextEditor } from "src/editor/view/viewPart/editor/richtextEditor";

export type PlaintextEditor = {} & EditorBase; // TEST
export type SplitviewEditor = {} & EditorBase; // TEST

export type EditorWindow = RichtextEditor | PlaintextEditor | SplitviewEditor;

/**
 * An interface only for {@link EditorView}.
 */
export interface IEditorView extends IProseEventBroadcaster {

    /**
     * The actual editor instance.
     */
    readonly editor: EditorWindow;

    /**
     * Fires when a log is about happen.
     */
    readonly onLog: Register<ILogEvent>;

    /**
     * @description Updates the options of the editor view.
     * @param options The options.
     */
    updateOptions(options: Partial<IEditorViewOptions>): void;
}

export interface IEditorViewOptions {

}