import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Mutable } from "src/base/common/utilities/type";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";

export interface ICommandExecutor<T = any> {
    (provider: IServiceProvider, ...args: any[]): T;
}

export interface ICommandEvent {
    commandID: string;
    args: any[];
}

/**
 * A set of metadata that describes the command that is about to be registered.
 */
export interface ICommandSchema {

    /**
     * The name of the command for later access.
     */
    readonly id: string;

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

export interface ICommand extends ICommandSchema {
    /**
     * The actual command implementation.
     */
    readonly command: ICommandExecutor;
}

/**
 * An interface only for {@link CommandRegistrant}.
 */
export interface ICommandRegistrant extends IRegistrant<RegistrantType.Command> {

    /**
     * @description Registers a command by storing it in a map with its id as the key.
     * @param schema A set of metadata that describes the command.
     * @param command The actual implementation of the command. 
     * @returns A disposible for unregistration.
     */
    registerCommand(schema: ICommandSchema, command: ICommandExecutor): IDisposable;

    /**
     * @description Get the {@link ICommand} object through the command id.
     */
    getCommand(id: string): ICommand | undefined;

    /**
     * @description Return all the registered commands.
     */
    getAllCommands(): Map<string, ICommand>;
}

/**
 * A command registrant can register commands and can be executed through 
 * the {@link ICommandService}.
 */
export class CommandRegistrant implements ICommandRegistrant {

    public readonly type = RegistrantType.Command;

    private readonly _commands = new Map<string, ICommand>();

    constructor() {
        // noop
    }

    public initRegistrations(): void {
        // noop
    }

    public registerCommand(schema: ICommandSchema, command: ICommandExecutor): IDisposable {
        const id = schema.id;
        const cmd: Mutable<ICommand> = {
            ...schema,
            command: command,
        };

        if (!schema.description) {
            cmd.description = 'No descriptions are provided.';
        }

        if (schema.overwrite === true || !this._commands.has(id)) {
            this._commands.set(id, cmd);
        }

        const unregister = toDisposable(() => {
            this._commands.delete(id);
        });
        return unregister;
    }

    public getCommand(id: string): ICommand | undefined {
        return this._commands.get(id);
    }

    public getAllCommands(): Map<string, ICommand> {
        return this._commands;
    }
}