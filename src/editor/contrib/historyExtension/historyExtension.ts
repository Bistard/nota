import type { IEditorWidget } from "src/editor/editorWidget";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseEditorState, ProseTransaction } from "src/editor/common/proseMirror";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";

/**
 * An interface only for {@link EditorHistoryExtension}.
 */
export interface IEditorHistoryExtension extends IEditorExtension {

    readonly id: EditorExtensionIDs.History;
}

export class EditorHistoryExtension extends EditorExtension implements IEditorHistoryExtension {

    // [fields]

    public readonly id = EditorExtensionIDs.History;
    private readonly _undoStack: ProseTransaction[] = [];
    private readonly _redoStack: ProseTransaction[] = [];

    // [constructor]

    constructor(
        editorWidget: IEditorWidget,
    ) {
        super(editorWidget);
    }

    // [public methods]

    public undo(state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void): boolean {
        if (this._undoStack.length === 0) {
            return false;
        }

        const lastTransaction = this._undoStack.pop();
        if (lastTransaction) {
            this._redoStack.push(lastTransaction);
            const tr = state.tr;

            for (let i = 0; i < lastTransaction.steps.length; i++) {
                const step = lastTransaction.steps[i]!;
                const inverted = step.invert(lastTransaction.docs[i]!);
                tr.step(inverted);
            }

            tr.setMeta('$history', 'undo');
            dispatch?.(tr.scrollIntoView());
        }

        return true;
    }

    public redo(state: ProseEditorState, dispatch?: (tr: ProseTransaction) => void): boolean {
        if (this._redoStack.length === 0) {
            return false;
        }

        const lastTransaction = this._redoStack.pop();
        if (lastTransaction) {
            this._undoStack.push(lastTransaction);
            const tr = state.tr;
            lastTransaction.steps.forEach(step => tr.step(step));

            tr.setMeta('$history', 'redo');
            dispatch?.(tr.scrollIntoView());
        }

        return true;
    }

    // [protected methods]

    protected override onStateTransaction(transaction: ProseTransaction, oldState: ProseEditorState, newState: ProseEditorState): void {
        if (!transaction.docChanged) {
            return;
        }

        const res = transaction.getMeta('$history');
        if (res === 'undo' || res === 'redo') {
            return;
        }

        this._undoStack.push(transaction);
        this._redoStack.length = 0;
    }
}
