import { Keyboard } from "src/base/common/keyboard";
import { CommandService, ICommandService } from "src/platform/command/common/commandService";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { REGISTRANTS } from "src/platform/registrant/common/registrant";
import { EditorExtension } from "src/editor/common/extension/editorExtension";
import { IEditorExtensionRegistrant } from "src/editor/common/extension/editorExtensionRegistrant";
import { IEditorWidget } from "src/editor/editorWidget";

export class KeyboardController extends EditorExtension {

    // [field]

    // [constructor]

    constructor(
        private readonly editor: IEditorWidget,
        @IInstantiationService instantiationService: IInstantiationService,
        @ICommandService CommandService: ICommandService,
    ) {
        super();

    }

    // [public methods]
}

REGISTRANTS.get(IEditorExtensionRegistrant).registerEditorExtension('keyboardController', KeyboardController);
