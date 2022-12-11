import { AllSelection } from "prosemirror-state";
import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { ShortcutWeight } from "src/code/browser/service/shortcut/shortcutRegistrant";
import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { EditorViewCommand } from "src/editor/common/command/editorCommand";
import { EditorContextKeys } from "src/editor/common/editorContextKeys";
import { ProseEditorView } from "src/editor/common/proseMirror";
import { IEditorWidget } from "src/editor/editorWidget";

export const enum EditorCommandsEnum {
    selectAllContent = 'select-all-content',
    deleteCurrentSelection = 'delete-current-selection',
}

export const selectAllContent = (new class extends EditorViewCommand {
    constructor() {
        super({
            id: EditorCommandsEnum.selectAllContent,
            when: EditorContextKeys.editorFocusedContext,
            description: 'Select all the context.',
            shortcutOptions: {
                shortcut: new Shortcut(true, false, false, false, KeyCode.KeyA),
                weight: ShortcutWeight.Editor,
                when: null,
            }
        });
    }

    protected override richtextCommand(provider: IServiceProvider, editorWidget: IEditorWidget, view: ProseEditorView, ...args: any[]): boolean | Promise<boolean> {
        const state = view.state;
        if (state.selection.empty) {
            return false;
        }
        
        if (!view.dispatch) {
            return false;
        }

        view.dispatch(state.tr.setSelection(new AllSelection(state.doc)));
        return true;
    }
});

export const deleteCurrentSelection = (new class extends EditorViewCommand {
    constructor() {
        super({
            id: EditorCommandsEnum.deleteCurrentSelection,
            when: EditorContextKeys.editorFocusedContext,
            description: 'Delete the current editor selection.',
            shortcutOptions: {
                shortcut: new Shortcut(false, false, false, false, KeyCode.Delete),
                weight: ShortcutWeight.Editor,
                when: null,
            }
        });
    }

    protected override richtextCommand(provider: IServiceProvider, editorWidget: IEditorWidget, view: ProseEditorView, ...args: any[]): boolean | Promise<boolean> {
        const state = view.state;
        if (state.selection.empty) {
            return false;
        }

        if (!view.dispatch) {
            return false;
        }

        view.dispatch(state.tr.deleteSelection().scrollIntoView());
        return true;
    }
});