import { IDisposable, toDisposable } from "src/base/common/dispose";
import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";

export interface ICommand<T = any> {
    readonly id: string;
    readonly description?: string;
    readonly executor: ICommandExecutor<T>;
}

export interface ICommandExecutor<T = any> {
    (provider: IServiceProvider, ...args: any[]): T;
}

export interface ICommandEvent {
    commandID: string;
    args: any[];
}


export interface ICommandRegistrant {

    /**
     * @description Registers a command by storing it in a map with its id as the key.
     * @param id The name of the command for later access.
     * @param executor The actual callback function of the command. 
     * @param description The description of the command.
     * @returns A disposible for unregistration.
     */
    registerCommand(id: string, executor: ICommandExecutor, description?: string): IDisposable;

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
 * A command registrant registers a command and can be accessed through the
 * {@link ICommandService}.
 */
export const CommandRegistrant: ICommandRegistrant = new class implements ICommandRegistrant {

    private _commands = new Map<string, ICommand>();

    constructor() {
        // noop
    }

    public registerCommand(id: string, executor: ICommandExecutor, description?: string, overwrite: boolean = false): IDisposable {
        if (!description) {
            description = 'No descriptions';
        }

        if (overwrite === true || !this._commands.has(id)) {
            this._commands.set(id, {id, executor, description});
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