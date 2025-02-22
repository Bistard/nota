import { IProseEventBroadcaster } from "src/editor/view/proseEventBroadcaster";
import { RichTextView } from "src/editor/view/richTextView";

export const enum EditorType {
    Plain = 'plain-text',
    Split = 'split-view',
    Rich = 'rich-text'
}

export type PlaintextEditor = {} & RichTextView; // TEST
export type SplitViewEditor = {} & RichTextView; // TEST

export type EditorWindow = RichTextView | PlaintextEditor | SplitViewEditor;

/**
 * An interface only for {@link EditorView}.
 */
export interface IEditorView extends IProseEventBroadcaster {

    /**
     * The actual editor instance.
     */
    readonly editor: RichTextView;

    /**
     * // TODO
     * @param text 
     * @param from 
     * @param to 
     */
    type(text: string, from?: number, to?: number): void;
}
