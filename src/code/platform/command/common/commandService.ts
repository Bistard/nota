import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { ICommandEvent, ICommandRegistrant } from "src/code/platform/command/common/commandRegistrant";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";

export const ICommandService = createService<ICommandService>('command-service');

/**
 * An interface only for {@link CommandService}.
 */
export interface ICommandService {

    /**
     * Fires when a command is executed successfully.
     */
    readonly onDidExecuteCommand: Register<ICommandEvent>;
    
    /**
     * @description Execute the command that is registered in the 
     * {@link ICommandRegistrant}. Returns a promise that will resolve if the 
     * execution successed, it will resolve either the command is not found or
     * encounter errors during the execution.
     * @param id The id of the command.
     * @param args The optional arguments for the command executor.
     */
    executeCommand<T = unknown>(id: string, ...args: any[]): Promise<T>;
}

/**
 * @class A micro-service that able to execute commands which are registered
 * through {@link ICommandRegistrant}.
 */
export class CommandService extends Disposable implements ICommandService {
    
    // [field]

    private readonly _registrant: ICommandRegistrant = REGISTRANTS.get(ICommandRegistrant);

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

    public executeCommand<T = unknown>(id: string, ...args: any[]): Promise<T> {

        const command = this._registrant.getCommand(id);
        if (!command) {
			return Promise.reject(new Error(`command '${id}' not found`));
		}

        try {
            const result = command.executor(this.instantiationService, ...args);
            this._onDidExecuteCommand.fire({ commandID: id, args: args });
            this.logService.trace('CommandService execute command:', id);
            return Promise.resolve(<T>result);
        } catch (error) {
            this.logService.trace('CommandService not found command:', id);
            return Promise.reject(error);
        }
    }
}