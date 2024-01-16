import { Constructor } from "src/base/common/utilities/type";
import { EditorExtension } from "src/editor/common/extension/editorExtension";
import { EditorKeyboardExtension } from "src/editor/view/contrib/keyboardExtension";

/**
 * @description These extensions are meant to be built-in features of the editor.
 */
export function getBuiltInExtension(): { id: string, ctor: Constructor<EditorExtension> }[] {
    return [
        { id: 'Keyboard-extension', ctor: EditorKeyboardExtension },
    ];
}