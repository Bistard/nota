import { IDisposable, toDisposable } from "src/base/common/dispose";
import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { createRegistrant, RegistrantType } from "src/code/platform/registrant/common/registrant";

export const ICommandRegistrant = createRegistrant<ICommandRegistrant>(RegistrantType.Command);

export interface ICommandExecutor<T = any> {
    (provider: IServiceProvider, ...args: any[]): T;
}

export interface ICommandEvent {
    commandID: string;
    args: any[];
}

/**
 * A set of metadata that describes the command.
 */
export interface ICommandSchema {
    
    /**
     * The name of the command for later access.
     */
    readonly id: string; 

    /**
     * The description of the command.
     */
    description?: string;

    /**
     * If to overwrite the exsiting command. 
     * @default false
     */
    overwrite?: boolean;
}

/**
 * An interface only for {@link CommandRegistrant}.
 */
export interface ICommandRegistrant {

    /**
     * @description Registers a command by storing it in a map with its id as the key.
     * @param schema A set of metadata that describes the command.
     * @param executor The actual callback function of the command. 
     * @returns A disposible for unregistration.
     */
    registerCommand(schema: ICommandSchema, executor: ICommandExecutor): IDisposable;

    /**
     * @description Get the {@link ICommand} object through the command id.
     */
    getCommand(id: string): ICommand | undefined;

    /**
     * @description Return all the registered commands.
     */
    getAllCommands(): Map<string, ICommand>;
}

interface ICommand<T = any> {
    readonly id: string;
    readonly description?: string;
    readonly executor: ICommandExecutor<T>;
}

/**
 * A command registrant can register commands and can be executed through 
 * the {@link ICommandService}.
 */
@ICommandRegistrant
class CommandRegistrant implements ICommandRegistrant {

    private readonly _commands = new Map<string, ICommand>();

    constructor() {
        // noop
    }

    public registerCommand(schema: ICommandSchema, executor: ICommandExecutor): IDisposable {
        const id = schema.id;
        
        if (!schema.description) {
            schema.description = 'No descriptions are provided.';
        }

        if (schema.overwrite === true || !this._commands.has(id)) {
            this._commands.set(id, { id, executor, description: schema.description });
        }
        
        let unregister = toDisposable(() => {
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