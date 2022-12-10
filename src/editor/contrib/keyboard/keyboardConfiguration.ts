import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { deleteCurrentSelection } from "src/editor/common/command/command.register";
import { EditorCommand } from "src/editor/common/command/editorCommand";

export function getEditorDefaultBuiltInKeybindings(): [Shortcut, EditorCommand][] {
    const keybindings: [Shortcut, EditorCommand][] = [];

    keybindings.push([new Shortcut(false, false, false, false, KeyCode.Delete), deleteCurrentSelection]);

    return keybindings;
}