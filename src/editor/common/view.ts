import { IProseEventBroadcaster } from "src/editor/view/proseEventBroadcaster";
import { EditorBase } from "src/editor/view/editorBase";
import { RichtextEditor } from "src/editor/view/richtextEditor";

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
}
