import { KeyCode } from "src/base/common/keyboard";
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
     * @description Programmatically emulate user typing action. 
     *  - If `from` or `to` not provided, it will be treated as simple insertion 
     *    at the cursor.
     * @param text The text for replacement, insertion. Multi-character supported.
     *             Each character will be typed in sequence.
     * @param from The start absolute position points to ProseMirror document.
     * @param to The end absolute position points to ProseMirror document.
     */
    type(text: string, from?: number, to?: number): void;

    /**
     * @description Programmatically trigger a keydown event. This emulates 
     * low-level keyboard interactions like navigation, shortcuts, or special 
     * key behaviors in the editor.
     * @param code The physical key code to emulate.
     */
    keydown(code: KeyCode, alt?: boolean, shift?: boolean, ctrl?: boolean, meta?: boolean): void;
}
