import { ICommandService } from "src/code/platform/command/common/commandService";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";
import { EditorCommandsEnum } from "src/editor/common/command/command.register";
import { EditorExtension } from "src/editor/common/extension/editorExtension";
import { IEditorExtensionRegistrant } from "src/editor/common/extension/editorExtensionRegistrant";
import { IEditorWidget } from "src/editor/editorWidget";

export class KeyboardController extends EditorExtension {

    // [constructor]

    constructor(
        private readonly editor: IEditorWidget,
        @ICommandService private readonly commandService: ICommandService,
    ) {
        super();
        
        this.onKeydown(event => {
            // FIX
            this.commandService.executeCommand(EditorCommandsEnum.deleteCurrentSelection, event.view);
        });
    }

    // [public methods]
}

REGISTRANTS.get(IEditorExtensionRegistrant).registerEditorExtension('keyboardController', KeyboardController);
