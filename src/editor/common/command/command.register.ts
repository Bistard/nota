import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { EditorCommand } from "src/editor/common/command/editorCommand";
import { EditorContextKeys } from "src/editor/common/editorContextKeys";
import { ProseEditorView } from "src/editor/common/proseMirror";
import { EditorType } from "src/editor/common/viewModel";
import { IEditorWidget, IEditorWidgetFriendship } from "src/editor/editorWidget";
import { RichtextEditor } from "src/editor/view/viewPart/editors/richtextEditor/richtextEditor";

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

    protected command(provider: IServiceProvider, editorWidget: IEditorWidget, view?: ProseEditorView): void {
        
        if (!view) {
            const editor = (<IEditorWidgetFriendship>editorWidget).view?.editor;
            if (editor?.type === EditorType.Rich) {
                view = RichtextEditor.getInternalView(editor);
            }
        }
        
        if (!view) {
            return;
        }

        const state = view.state;
        if (state.selection.empty) {
            return;
        }

        if (view.dispatch) {
            view.dispatch(state.tr.deleteSelection().scrollIntoView());
        }
    }
});