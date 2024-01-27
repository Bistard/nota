import { Shortcut } from "src/base/common/keyboard";
import { EditorExtension } from "src/editor/common/extension/editorExtension";
import { EditorCommands } from "src/editor/view/contrib/editorCommands";
import { Command, buildChainCommand } from "src/platform/command/common/command";
import { CommandRegistrant } from "src/platform/command/common/commandRegistrant";
import { ICommandService } from "src/platform/command/common/commandService";
import { CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";

export const enum EditorCommandID {
    Enter = 'editor-enter',
    Backspace = 'editor-backspace',
}

export class EditorCommandExtension extends EditorExtension {

    // [fields]

    /**
     * Mapping from {@link Shortcut}-hashed code to command ID.
     */
    private readonly _commands: Map<number, EditorCommandID>;

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

            commandService.executeCommand(name, event.view.state, event.view.dispatch, event.view);
        });

        this.__registerEditorCommands(registrantService);
    }

    // [private helper methods]

    private __registerEditorCommands(registrantService: IRegistrantService): void {
        const registrant = registrantService.getRegistrant(RegistrantType.Command);

        // enter
        {
            [
                Shortcut.fromString('Enter').toHashcode(),
                Shortcut.fromString('Ctrl+Enter').toHashcode(),
                Shortcut.fromString('Shift+Enter').toHashcode(),
            ]
            .forEach(hash => {
                this._commands.set(hash, EditorCommandID.Enter);
            });

            this.__registerCommand(registrant, Enter);
        }

        // backspace
        {
            [
                Shortcut.fromString('Backspace').toHashcode(),
                Shortcut.fromString('Shift+Backspace').toHashcode(),
                Shortcut.fromString('Meta+Backspace').toHashcode(),
            ]
            .forEach(hash => {
                this._commands.set(hash, EditorCommandID.Backspace);
            });

            this.__registerCommand(registrant, Backspace);
        }
    }

    private __registerCommand(registrant: CommandRegistrant, command: Command): void {
        registrant.registerCommand(command.schema, command.run.bind(command));
    }
}

const Enter = buildChainCommand(
    { 
        id: EditorCommandID.Enter, 
        when: CreateContextKeyExpr.Equal('isEditorFocused', true),
    }, 
    [
        EditorCommands.insertNewLineInCodeBlock,
        EditorCommands.InsertEmptyParagraphAdjacentToBlock,
        EditorCommands.LiftEmptyTextBlock,
        EditorCommands.SplitBlockAtSelection,
    ],
);

const Backspace = buildChainCommand(
    { 
        id: EditorCommandID.Backspace, 
        when: CreateContextKeyExpr.Equal('isEditorFocused', true),
    }, 
    [
        EditorCommands.DeleteSelection,
        EditorCommands.JoinBackward,
        EditorCommands.SelectNodeBackward,
    ],
);