import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { EditorCommand } from "src/editor/common/command/editorCommand";
import { EditorContextKeys } from "src/editor/common/editorContextKeys";
import { ProseEditorView } from "src/editor/common/proseMirror";
import { IEditorWidget } from "src/editor/editorWidget";

export const enum EditorCommandsEnum {
    deleteCurrentSelection = 'delete-current-selection',
}

export const deleteCurrentSelection = (new class extends EditorCommand {
    constructor() {
        super({
            id: EditorCommandsEnum.deleteCurrentSelection,
            when: EditorContextKeys.editorFocusedContext,
            description: 'Delete the current editor selection.',
        });
    }

    protected command(provider: IServiceProvider, editor: IEditorWidget, view: ProseEditorView): void {
        const state = view.state;
        const dispatch = view.dispatch;
        
        if (state.selection.empty) {
            return;
        }
        if (dispatch) {
            dispatch(state.tr.deleteSelection().scrollIntoView());
        }
    }
});