import { Keyboard } from "src/base/common/keyboard";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";
import { EditorCommand } from "src/editor/common/command/editorCommand";
import { EditorExtension } from "src/editor/common/extension/editorExtension";
import { IEditorExtensionRegistrant } from "src/editor/common/extension/editorExtensionRegistrant";
import { getEditorDefaultBuiltInKeybindings } from "src/editor/contrib/keyboard/keyboardConfiguration";
import { IEditorWidget } from "src/editor/editorWidget";

export class KeyboardController extends EditorExtension {

    // [field]

    private readonly _keybindings: Map<number, EditorCommand>;

    // [constructor]

    constructor(
        private readonly editor: IEditorWidget,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super();
        
        this._keybindings = new Map();
        const defaultBindings = getEditorDefaultBuiltInKeybindings();
        for (const [shortcut, command] of defaultBindings) {
            this._keybindings.set(shortcut.toHashcode(), command);
        }

        this.__register(this.onKeydown(event => {
            const shortcut = Keyboard.eventToShortcut(event.event);
            const command = this._keybindings.get(shortcut.toHashcode());
            if (!command) {
                return;
            }

            command.runCommand(instantiationService, event.view);
        }));
    }

    // [public methods]
}

REGISTRANTS.get(IEditorExtensionRegistrant).registerEditorExtension('keyboardController', KeyboardController);
