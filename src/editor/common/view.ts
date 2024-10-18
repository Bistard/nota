import { Register } from "src/base/common/event";
import { ILogEvent } from "src/base/common/logger";
import { IProseEventBroadcaster } from "src/editor/view/viewPart/editor/adapter/proseEventBroadcaster";
import { EditorBase } from "src/editor/view/viewPart/editor/editorBase";
import { RichtextEditor } from "src/editor/view/viewPart/editor/richtextEditor";

export const enum EditorType {
    Plain = 'plain-text',
    Split = 'split-view',
    Rich = 'rich-text'
}

export type PlaintextEditor = {} & EditorBase; // TEST
export type SplitViewEditor = {} & EditorBase; // TEST

export type EditorWindow = RichtextEditor | PlaintextEditor | SplitViewEditor;

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

    /**
     * Determines how the editor is about to render the view.
     * @default EditorType.Rich
     */
    mode?: EditorType;

    /**
     * If enables code-block highlight functionality.
     * @default true
     */
    codeblockHighlight?: boolean;

    /**
     * When parsing, if ignores parse HTML content.
     * @default false
     */
    ignoreHTML?: boolean;
}
