import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { CommandRegistrant, ICommandEvent } from "src/code/platform/command/common/command";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";

export const ICommandService = createDecorator<ICommandService>('command-service');


export interface ICommandService {

    /**
     * Fires when the command is executed.
     */
    readonly onDidExecuteCommand: Register<ICommandEvent>;
    
    /**
     * @description Execute the command that is registered in the 
     * {@link CommandRegistrant}. Returns a promise that will resolve if the 
     * execution successed, it will resolve either the command is not found or
     * encounter errors during the execution.
     * @param id The id of the command.
     * @param args The optional arguments for the command executor.
     */
    executeCommand(id: string, ...args: any[]): Promise<any>;
}

export class CommandService extends Disposable implements ICommandService {
    
    // [field]

    private readonly _onDidExecuteCommand = this.__register(new Emitter<ICommandEvent>());
    public readonly onDidExecuteCommand = this._onDidExecuteCommand.registerListener;

    // [constructor]

    constructor(
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
    }

    // [public methods]

    public executeCommand(id: string, ...args: any[]): Promise<any> {

        const command = CommandRegistrant.getCommand(id);
        if (!command) {
			return Promise.reject(new Error(`command '${id}' not found`));
		}

        try {
            const result = command.executor(this.instantiationService, ...args);
            this._onDidExecuteCommand.fire({ commandID: id, args: args });
            this.logService.trace('CommandService execute command:', id);
            return Promise.resolve(result);
        } catch (error) {
            this.logService.trace('CommandService not found command:', id);
            return Promise.reject(error);
        }
    }
}