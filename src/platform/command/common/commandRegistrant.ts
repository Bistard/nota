import { Mutable } from "src/base/common/utilities/type";
import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Command, CommandImplementation } from "src/platform/command/common/command";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";

export interface ICommandExecutor<T = any> {
    (provider: IServiceProvider, ...args: any[]): T;
}

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
     * If to overwrite the exsiting command. 
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
     * @returns A disposible for unregistration.
     */
    registerCommandBasic(schema: ICommandBasicSchema): IDisposable;

    /**
     * @description Registers a {@link Command}.
     * @param command A concrete {@link Command}.
     * @returns A disposible for unregistration.
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
 */
export class CommandRegistrant implements ICommandRegistrant {

    public readonly type = RegistrantType.Command;

    private readonly _commands = new Map<string, ICommandBasicSchema>();

    constructor() {
        // noop
    }

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
            cmd.description = 'No descriptions are provided.';
        }

        if (cmd.overwrite === true || !this._commands.has(id)) {
            this._commands.set(id, cmd);
        }

        const unregister = toDisposable(() => {
            this._commands.delete(id);
        });
        return unregister;
    }

    public registerCommand(command: Command): IDisposable {
        const id = command.id;
        
        
        
        return undefined!;
    }

    public getCommand(id: string): ICommandBasicSchema | undefined {
        return this._commands.get(id);
    }

    public getAllCommands(): Map<string, ICommandBasicSchema> {
        return this._commands;
    }
}