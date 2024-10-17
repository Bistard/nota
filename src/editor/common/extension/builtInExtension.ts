import { Constructor } from "src/base/common/utilities/type";
import { EditorExtension } from "src/editor/common/extension/editorExtension";
import { EditorCommandExtension } from "src/editor/view/contrib/commandExtension";

export const enum EditorExtensionIDs {
    Command = 'editor-command-extension',
}

/**
 * @description These extensions are meant to be built-in features of the editor.
 */
export function getBuiltInExtension(): { id: string, ctor: Constructor<EditorExtension> }[] {
    return [
        { id: EditorExtensionIDs.Command, ctor: EditorCommandExtension },
    ];
}