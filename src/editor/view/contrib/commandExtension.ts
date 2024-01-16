import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { EditorExtension } from "src/editor/common/extension/editorExtension";
import { EditorCommands, KeyboardEditorCommands } from "src/editor/view/contrib/editorCommand";
import { Command, buildChainCommand } from "src/platform/command/common/command";
import { CommandRegistrant } from "src/platform/command/common/commandRegistrant";
import { ICommandService } from "src/platform/command/common/commandService";
import { CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";

export class EditorCommandExtension extends EditorExtension {

    // [fields]

    /**
     * Mapping from {@link Shortcut}-hashed code to command ID.
     */
    private readonly _commands: Map<number, KeyboardEditorCommands>;

    // [constructor]

    constructor(
        @IRegistrantService registrantService: IRegistrantService,
        @ICommandService commandService: ICommandService,
        
    ) {
        super();
        this._commands = new Map();
        
        this.onKeydown(event => {
            const keyEvent = event.event;

            const shortcut = new Shortcut(keyEvent.ctrl, keyEvent.shift, keyEvent.alt, keyEvent.meta, keyEvent.key);
            const name = this._commands.get(shortcut.toHashcode());
            if (!name) {
                return;
            }

            commandService.executeCommand(name, event.view.state, event.view.dispatch, event.event);
        });

        this.__registerEditorCommands(registrantService);
    }

    // [private helper methods]

    private __registerEditorCommands(registrantService: IRegistrantService): void {
        const registrant = registrantService.getRegistrant(RegistrantType.Command);

        // enter
        {
            this._commands.set(
                new Shortcut(false, false, false, false, KeyCode.Enter).toHashcode(),
                KeyboardEditorCommands.Enter,
            );
            const schema = { 
                id: KeyboardEditorCommands.Enter, 
                when: CreateContextKeyExpr.Equal('isEditorFocused', true),
            };
            
            this.__registerCommand(
                registrant, 
                buildChainCommand(schema, [
                    EditorCommands.CreateNewLineInCodeBlock,
                    EditorCommands.CreateParagraphNear,
                    EditorCommands.liftEmptyBlock,
                    EditorCommands.SplitBlock,
                ]),
            );
        }
    }

    private __registerCommand(registrant: CommandRegistrant, command: Command): void {
        registrant.registerCommand(command.schema, command.run.bind(command));
    }
}