import { Constructor } from "src/base/common/utilities/type";
import { EditorExtension } from "src/editor/common/extension/editorExtension";
import { EditorCommandExtension } from "src/editor/view/contrib/commandExtension";

/**
 * @description These extensions are meant to be built-in features of the editor.
 */
export function getBuiltInExtension(): { id: string, ctor: Constructor<EditorExtension> }[] {
    return [
        { id: 'command-extension', ctor: EditorCommandExtension },
    ];
}