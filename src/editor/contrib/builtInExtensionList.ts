import { Constructor } from "src/base/common/utilities/type";
import { EditorExtension } from "src/editor/common/editorExtension";
import { EditorCommandExtension } from "src/editor/contrib/commandExtension/commandExtension";
import { EditorAutoSaveExtension } from "src/editor/view/contrib/autoSaveExtension";

export const enum EditorExtensionIDs {
    Command = 'editor-command-extension',
    AutoSave = 'editor-autosave-extension',
    InputRules = "InputRules",
}

/**
 * @description These extensions are meant to be built-in features of the editor.
 */
export function getBuiltInExtension(): { id: string, ctor: Constructor<EditorExtension> }[] {
    return [
        { id: EditorExtensionIDs.Command, ctor: EditorCommandExtension },
        { id: EditorExtensionIDs.AutoSave, ctor: EditorAutoSaveExtension },
    ];
}