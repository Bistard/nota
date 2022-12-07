import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { EditorCommand, IEditorCommandEvent } from "src/editor/common/command/editorCommand";
import { EditorContextKeys } from "src/editor/common/editorContextKeys";
import { IEditorWidget } from "src/editor/editorWidget";

export const enum EditorCommandsEnum {
    deleteCurrentSelection = 'delete-current-selection',
}

export abstract class EditorCommands {
    
    public static readonly deleteCurrentSelection = (new class extends EditorCommand {
        constructor() {
            super({
                id: EditorCommandsEnum.deleteCurrentSelection,
                when: EditorContextKeys.editorFocusedContext,
                description: 'Delete the current editor selection.',
            });
        }
    
        protected command(provider: IServiceProvider, editor: IEditorWidget, { state, dispatch }: IEditorCommandEvent): void {
            if (state.selection.empty) {
                return;
            }
            if (dispatch) {
                dispatch(state.tr.deleteSelection().scrollIntoView());
            }
        }
    });
}
