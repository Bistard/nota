import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { trySafe } from "src/base/common/error";
import { Shortcut } from "src/base/common/keyboard";
import { ILogService } from "src/base/common/logger";
import { EditorExtensionIDs } from "src/editor/common/extension/builtInExtension";
import { EditorExtension, IEditorExtension } from "src/editor/common/extension/editorExtension";
import { registerBasicEditorCommands } from "src/editor/view/contrib/editorCommands";
import { Command } from "src/platform/command/common/command";
import { ICommandService } from "src/platform/command/common/commandService";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";

/**
 * An interface only for {@link EditorCommandExtension}.
 */
export interface IEditorCommandExtension extends IEditorExtension {

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
export class EditorCommandExtension extends EditorExtension<void> implements IEditorCommandExtension {

    // [fields]

    public readonly id = EditorExtensionIDs.Command;

    /** Mapping from {@link Shortcut}-hashed code to command ID. */
    private readonly _commandKeybinding = new Map<number, string>();
    
    /** A set that contains all the editor commands' IDs */
    private readonly _commandSet = new Set<string>();

    // [constructor]

    constructor(
        @IRegistrantService private readonly registrantService: IRegistrantService,
        @ICommandService commandService: ICommandService,
        @ILogService logService: ILogService,
    ) {
        super(logService);

        /**
         * Keydown: when key is pressing in the editor:
         *  1. we look up for any registered command (from the map), 
         *  2. if found any, we execute that command from the standard command 
         *     system: {@link CommandService}.
         */
        this.__register(this.onKeydown(event => {
            const keyEvent = event.event;
            const shortcut = new Shortcut(keyEvent.ctrl, keyEvent.shift, keyEvent.alt, keyEvent.meta, keyEvent.key);
            const commandID = this._commandKeybinding.get(shortcut.toHashcode());
            if (!commandID) {
                return;
            }

            /**
             * Whenever a command is executed, we need to invoke `markAsExecuted`
             * to tell prosemirror to prevent default behavior of the browser.
             * 
             * @see https://discuss.prosemirror.net/t/question-allselection-weird-behaviours-when-the-document-contains-a-non-text-node-at-the-end/7749/3
             */
            trySafe(
                () => commandService.executeCommand<boolean | Promise<boolean>>(commandID, event.view.state, event.view.dispatch, event.view),
                {
                    onError: () => false,
                    onThen: (anyExecuted) => {
                        if (anyExecuted) {
                            event.markAsExecuted();
                        }
                    }
                }
            );
        }));
    }

    // [public methods]

    protected onStateInit(state: EditorState): void {
        
        /**
         * Binds predefined commands to their respective shortcuts.
         */
        registerBasicEditorCommands(this, this.logService);
    }

    protected override onViewInit(view: EditorView): void {}
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
        shortcuts
            .map(str => Shortcut.fromString(str).toHashcode())
            .forEach(hash => {
                this._commandKeybinding.set(hash, command.id);
            });
    }
}
