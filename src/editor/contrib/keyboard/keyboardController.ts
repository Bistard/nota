import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";
import { deleteCurrentSelection } from "src/editor/common/command/command.register";
import { EditorExtension } from "src/editor/common/extension/editorExtension";
import { IEditorExtensionRegistrant } from "src/editor/common/extension/editorExtensionRegistrant";
import { IEditorWidget } from "src/editor/editorWidget";

export class KeyboardController extends EditorExtension {

    // [constructor]

    constructor(
        private readonly editor: IEditorWidget,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super();
        
        this.onKeydown(event => {
            deleteCurrentSelection.runCommand(instantiationService, event.view);
        });
    }

    // [public methods]
}

REGISTRANTS.get(IEditorExtensionRegistrant).registerEditorExtension('keyboardController', KeyboardController);
