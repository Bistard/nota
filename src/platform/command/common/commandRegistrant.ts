import { Mutable } from "src/base/common/utilities/type";
import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Command, CommandImplementation } from "src/platform/command/common/command";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { ShortcutRegistrant } from "src/workbench/services/shortcut/shortcutRegistrant";
import { CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { AllCommandsDescriptions } from "src/workbench/services/workbench/commandList";
import { ILogService } from "src/base/common/logger";

/**
 * An event fired whenever a command is executed.
 */
export interface ICommandEvent {
    
    /**
     * The ID of the executed command.
     */
    readonly id: string;
}

/**
 * A set of basic metadata that describes the command that is about to be 
 * registered.
 */
export interface ICommandBasicSchema {

    /**
     * The name of the command.
     */
    readonly id: string;

    /**
     * The actual command implementation.
     */
    readonly command: CommandImplementation<any[], any>;

    /**
     * The description of the command.
     */
    readonly description?: string;

    /**
     * If to overwrite the existing command. 
     * @default false
     */
    readonly overwrite?: boolean;
}

/**
 * An interface only for {@link CommandRegistrant}.
 */
export interface ICommandRegistrant extends IRegistrant<RegistrantType.Command> {

    /**
     * @description Registers a {@link ICommandBasicSchema} which includes a set 
     * of basic metadata to describe a command.
     * @param schema A set of metadata that describes the command.
     * @returns A disposable for deregistration.
     */
    registerCommandBasic(schema: ICommandBasicSchema): IDisposable;

    /**
     * @description Registers a concrete {@link Command} instance.  
     * @note The command is also registered with the shortcut registrant if 
     *       shortcut options are provided in the command schema.
     * 
     * @param command The concrete command to register.
     * @returns A disposable for deregistration.
     */
    registerCommand(command: Command): IDisposable;

    /**
     * @description Get the {@link ICommandBasicSchema} object through the command ID.
     */
    getCommand(id: string): ICommandBasicSchema | undefined;

    /**
     * @description Return all the registered commands.
     */
    getAllCommands(): Map<string, ICommandBasicSchema>;
}

/**
 * A command registrant can register commands and can be executed through 
 * the {@link ICommandService}.
 * 
 * @note Make sure 'CommandRegistrant' is constructed after 'ShortcutRegistrant'.
 */
export class CommandRegistrant implements ICommandRegistrant {

    // [fields]

    public readonly type = RegistrantType.Command;
    
    private readonly _commands = new Map<string, ICommandBasicSchema>();
    private readonly _shortcutRegistrant: ShortcutRegistrant;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        this._shortcutRegistrant = registrantService.getRegistrant(RegistrantType.Shortcut);
    }

    // [public methods]

    public initRegistrations(provider: IServiceProvider): void {
        
        /**
         * Since the {@link CommandRegistrant} is constructed in both main
         * and renderer process. Do not register here unless it is shared in 
         * both processes.
         */
    }

    public registerCommandBasic(schema: ICommandBasicSchema): IDisposable {
        const id = schema.id;
        const cmd: Mutable<ICommandBasicSchema> = schema;

        if (!cmd.description) {
            // try to find descriptions for the predefined commands
            const predefined = AllCommandsDescriptions[cmd.id];
            cmd.description = predefined ?? 'No descriptions are provided.';
        }

        if (cmd.overwrite === true || !this._commands.has(id)) {
            this._commands.set(id, cmd);
            this.logService.trace('CommandRegistrant', `Command registered: '${id}'`);
        }

        return this.__toUnregister(id);
    }

    public registerCommand(command: Command): IDisposable {
        
        // command registration
        this.registerCommandBasic({
            id: command.id,
            description: command.description,
            command: (...args) => command.run(...args),
        });

        // shortcut registration
        if (command.schema.shortcutOptions) {
            this._shortcutRegistrant.register(command.id, {
                ...command.schema.shortcutOptions,
                when: CreateContextKeyExpr.And(command.when, command.schema.shortcutOptions.when),
            });
        }
        
        return this.__toUnregister(command.id);
    }

    public getCommand(id: string): ICommandBasicSchema | undefined {
        return this._commands.get(id);
    }

    public getAllCommands(): Map<string, ICommandBasicSchema> {
        return this._commands;
    }

    // [private helper methods]

    private __toUnregister(id: string): IDisposable {
        return toDisposable(() => {
            this._commands.delete(id);
        });
    }
}