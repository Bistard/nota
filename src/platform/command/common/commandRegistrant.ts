import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Mutable } from "src/base/common/utilities/type";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";

export interface ICommandExecutor<T = any> {
    (provider: IServiceProvider, ...args: any[]): T;
}

/**
 * An event fired whenever a command is executed.
 */
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
     * The actual command implementation.
     */
    readonly command: ICommandExecutor;

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
     * @description Registers a command by storing it in a map with its ID as 
     * the key.
     * @param schema A set of metadata that describes the command.
     * @returns A disposible for unregistration.
     */
    registerCommandSchema(schema: ICommandSchema): IDisposable;

    /**
     * @description Get the {@link ICommandSchema} object through the command ID.
     */
    getCommand(id: string): ICommandSchema | undefined;

    /**
     * @description Return all the registered commands.
     */
    getAllCommands(): Map<string, ICommandSchema>;
}

/**
 * A command registrant can register commands and can be executed through 
 * the {@link ICommandService}.
 */
export class CommandRegistrant implements ICommandRegistrant {

    public readonly type = RegistrantType.Command;

    private readonly _commands = new Map<string, ICommandSchema>();

    constructor() {
        // noop
    }

    public initRegistrations(): void {
        // noop
    }

    public registerCommandSchema(schema: ICommandSchema): IDisposable {
        const id = schema.id;
        const cmd: Mutable<ICommandSchema> = schema;

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

    public getCommand(id: string): ICommandSchema | undefined {
        return this._commands.get(id);
    }

    public getAllCommands(): Map<string, ICommandSchema> {
        return this._commands;
    }
}