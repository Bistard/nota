import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { trySafe } from "src/base/common/error";
import { Shortcut } from "src/base/common/keyboard";
import { ILogService } from "src/base/common/logger";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { IEditorWidget } from "src/editor/editorWidget";
import { registerBasicEditorCommands } from "src/editor/contrib/commandExtension/editorCommands";
import { Command } from "src/platform/command/common/command";
import { ICommandService } from "src/platform/command/common/commandService";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { Priority } from "src/base/common/event";

/**
 * An interface only for {@link EditorCommandExtension}.
 */
export interface IEditorCommandExtension extends IEditorExtension {

    readonly id: EditorExtensionIDs.Command;

    /**
     * @description Register a {@link Command} as editor command that can be 
     * triggered by any of the given shortcuts.
     * 
     * @note The {@link Command} will also be registered into the global 
     * {@link CommandService}.
     */
    registerCommand(command: Command, shortcuts: string[]): void;
}

/**
 * @class Extension for handling editor commands with associated keyboard 
 * shortcuts. This class binds commands to specific shortcuts and registers 
 * these commands within the {@link CommandService}.
 */
export class EditorCommandExtension extends EditorExtension implements IEditorCommandExtension {

    // [fields]

    public readonly id = EditorExtensionIDs.Command;

    /** Mapping from {@link Shortcut}-hashed code to command ID. */
    private readonly _commandKeybinding = new Map<number, string>();
    
    /** A set that contains all the editor commands' IDs */
    private readonly _commandSet = new Set<string>();

    // [constructor]

    constructor(
        editorWidget: IEditorWidget,
        @IRegistrantService private readonly registrantService: IRegistrantService,
        @ICommandService commandService: ICommandService,
        @ILogService private readonly logService: ILogService,
    ) {
        super(editorWidget);

        /**
         * Keydown: when key is pressing in the editor:
         *  1. we look up for any registered command (from the map), 
         *  2. if found any, we execute that command from the standard command 
         *     system: {@link CommandService}.
         * 
         * @note Registered with {@link Priority.Low}. Make other extensions has
         *       possibility to handle the keydown event first.
         */
        this.__register(this.onKeydown(event => {
            const keyEvent = event.event;
            const shortcut = new Shortcut(keyEvent.ctrl, keyEvent.shift, keyEvent.alt, keyEvent.meta, keyEvent.key);
            const commandID = this._commandKeybinding.get(shortcut.toHashcode());
            if (!commandID) {
                return;
            }

            /**
             * Whenever a command is executed, we need to invoke `preventDefault`
             * to tell prosemirror to prevent default behavior of the browser.
             * 
             * @see https://discuss.prosemirror.net/t/question-allselection-weird-behaviours-when-the-document-contains-a-non-text-node-at-the-end/7749/3
             */
            trySafe(
                () => commandService.executeCommand(commandID, editorWidget, event.view.state, event.view.dispatch, event.view),
                {
                    onError: () => false,
                    onThen: (anyExecuted) => {
                        if (anyExecuted) {
                            event.preventDefault();
                        }
                    }
                }
            );
        }, undefined, Priority.Low));
    }

    // [protected override methods]

    protected override onViewStateInit(state: EditorState): void {
        
        /**
         * Binds predefined commands to their respective shortcuts.
         */
        registerBasicEditorCommands(this, this.logService);
    }

    protected override onViewDestroy(view: EditorView): void {
        const registrant = this.registrantService.getRegistrant(RegistrantType.Command);
        
        // unregister all the editor commands
        for (const registeredID of this._commandSet.values()) {
            registrant.unregisterCommand(registeredID);
        }

        // cache cleanup
        this._commandKeybinding.clear();
        this._commandSet.clear();
    }

    // [public methods]

    public registerCommand(command: Command, shortcuts: string[]): void {
        this._commandSet.add(command.id);

        /**
         * Register the command to the standard {@link CommandService}.
         */
        const registrant = this.registrantService.getRegistrant(RegistrantType.Command);
        registrant.registerCommand(command);
        
        /**
         * Bind the shortcuts with the command.
         */
        for (const str of shortcuts) {
            const shortcut = Shortcut.fromString(str);
            if (shortcut === Shortcut.None) {
                this.logService.warn(this.id, `Editor command (${command.id}) with shortcut registration (${str}) fails.`);
                continue;
            }
            const hash = shortcut.toHashcode();
            this._commandKeybinding.set(hash, command.id);
        }
    }
}
