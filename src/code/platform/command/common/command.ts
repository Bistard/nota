import { IDisposable, toDisposable } from "src/base/common/dispose";
import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";

export interface ICommand {
    readonly id: string;
    readonly description?: string;
    readonly executor: ICommandExecutor;
}

export interface ICommandExecutor {
    (provider: IServiceProvider, ...args: any[]): void;
}

export interface ICommandEvent {
    commandID: string;
    args: any[];
}

export interface ICommandRegistrant {

    // TODO
    registerCommand(id: string, executor: ICommandExecutor, description?: string): IDisposable;

    // TODO
    getCommand(id: string): ICommand | undefined;

    getAllCommands(): any;
}

// TODO
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
        const command = this._commands.get(id);
        return command;
    }

    public getAllCommands(): any {
        return this._commands;
    }
}