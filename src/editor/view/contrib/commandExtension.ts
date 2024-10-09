import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { EditorExtension } from "src/editor/common/extension/editorExtension";
import { EditorCommands } from "src/editor/view/contrib/editorCommands";
import { Command } from "src/platform/command/common/command";
import { ICommandService } from "src/platform/command/common/commandService";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";

/**
 * @class Extension for handling editor commands with associated keyboard 
 * shortcuts. This class binds commands to specific shortcuts and registers 
 * these commands within the {@link CommandService}.
 */
export class EditorCommandExtension extends EditorExtension {

    // [fields]

    /**
     * Mapping from {@link Shortcut}-hashed code to command ID.
     */
    private readonly _commands = new Map<number, EditorCommands.Composite.ID>();

    // [constructor]

    constructor(
        @IRegistrantService private readonly registrantService: IRegistrantService,
        @ICommandService commandService: ICommandService,
    ) {
        super();
        
        /**
         * Binds predefined commands to their respective shortcuts.
         */
        this.__bindCommandsWithShortcut();
        
        /**
         * Keydown: when key is pressing in the editor:
         *  1. we look up for any registered command (from the map), 
         *  2. if found any, we execute that command from the standard command 
         *     system: {@link CommandService}.
         */
        this.__register(this.onKeydown(event => {
            const keyEvent = event.event;
            const shortcut = new Shortcut(keyEvent.ctrl, keyEvent.shift, keyEvent.alt, keyEvent.meta, keyEvent.key);
            const commandID = this._commands.get(shortcut.toHashcode());
            if (!commandID) {
                return;
            }

            /**
             * It seems like browser default behaviors will cause some bugs in
             * our codebase. By the moment I write this comment, the following 
             * bug is fixed by `keyEvent.preventDefault()`:
             *      1. Ctrl+A does not select the entire document, while a "HTML"
             *         type of node is located at the last of the document.
             */
            if (commandID === EditorCommands.Composite.ID.SelectAll) {
                keyEvent.preventDefault();
            }

            commandService.executeAnyCommand(commandID, event.view.state, event.view.dispatch, event.view);
        }));
    }

    // [private helper methods]

    private __bindCommandsWithShortcut(): void {
        this.__bindCommand(EditorCommands.Composite.Enter, ['Enter']);
        this.__bindCommand(EditorCommands.Composite.Backspace, ['Backspace']);
        this.__bindCommand(EditorCommands.Composite.Delete, ['Delete']);
        this.__bindCommand(EditorCommands.Composite.SelectAll, ['Meta+A', 'Ctrl+A']);
    }

    private __bindCommand(command: Command, shortcuts: string[]): void {

        /**
         * Register the command to the standard {@link CommandService}.
         */
        const registrant = this.registrantService.getRegistrant(RegistrantType.Command);
        registrant.registerCommand(command);
        
        /**
         * Bind the shortcuts with the command.
         */
        shortcuts
            .map(str => Shortcut.fromString(str).toHashcode())
            .forEach(hash => {
                this._commands.set(hash, <EditorCommands.Composite.ID>command.id);
            });

    }
}
