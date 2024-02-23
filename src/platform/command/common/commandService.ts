import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { AllCommands, AllCommandsArgumentsTypes, AllCommandsReturnTypes } from "src/platform/command/common/commandList";
import { ICommandEvent, ICommandRegistrant } from "src/platform/command/common/commandRegistrant";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";

export const ICommandService = createService<ICommandService>('command-service');

/**
 * An interface only for {@link CommandService}.
 */
export interface ICommandService extends IService {

    /**
     * Fires when a command is executed successfully.
     */
    readonly onDidExecuteCommand: Register<ICommandEvent>;
 
    /**
     * @description Executes a command within the application, identified by its 
     * unique identifier (ID). 
     * 
     * @note This method is designed to handle both predefined commands listed 
     *       in {@link AllCommands} and arbitrary string commands.
     *          - Predefined command IDs are ensured to be registered already.
     *          - Arbitrary command IDs can be potentially non-existed.
     * 
     * @note Executing a predefined {@link AllCommands} command enforces its 
     *       specific argument and return types as defined in 
     *       {@link AllCommandsArgumentsTypes} and {@link AllCommandsReturnTypes}, 
     *       ensuring type safety.
     * 
     * @note Executing an arbitrary commands accepts any type of arguments (any[])
     *       and with a return type `T`.
     * 
     * @note The method returns a {@link Promise} that resolves upon successful 
     *       execution of the command. Rejects whenever the command is not found, 
     *       or error encounters.
     * 
     * @param id The unique identifier of the command to be executed. 
     * @param args The arguments required for executing the command.
     * @returns A {@link Promise} that resolves with the result of the command 
     *          execution.
     * 
     * @example
     * // Executing a predefined command without arguments
     * commandService.executeCommand(AllCommands.reloadWindow);
     * 
     * @example
     * // Executing a custom command with arbitrary arguments and handling the result
     * const ret: T = commandService.executeCommand<T>('customCommand', customArg1, customArg2);
     */
    executeCommand<ID extends AllCommands>(id: ID, ...args: AllCommandsArgumentsTypes[ID]): Promise<AllCommandsReturnTypes[ID]>;
    executeCommand<T>(id: string, ...args: any[]): Promise<T>;
}

/**
 * @class A micro-service that able to execute commands which are registered
 * through {@link ICommandRegistrant}.
 */
export class CommandService extends Disposable implements ICommandService {

    declare _serviceMarker: undefined;

    // [field]

    private readonly _onDidExecuteCommand = this.__register(new Emitter<ICommandEvent>());
    public readonly onDidExecuteCommand = this._onDidExecuteCommand.registerListener;
    private readonly _registrant: ICommandRegistrant;

    // [constructor]

    constructor(
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILogService private readonly logService: ILogService,
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        super();
        this._registrant = registrantService.getRegistrant(RegistrantType.Command);
    }

    // [public methods]

    public executeCommand<ID extends AllCommands>(id: ID, ...args: AllCommandsArgumentsTypes[ID]): Promise<AllCommandsReturnTypes[ID]>;
    public executeCommand<T>(id: string, ...args: any[]): Promise<T>;
    public executeCommand(id: string, ...args: any[]): Promise<any> {

        const command = this._registrant.getCommand(id);
        if (!command) {
            return Promise.reject(new Error(`command with ID '${id}' is not found`));
        }

        try {
            const ret = command.command(this.instantiationService, ...args);
            this.logService.trace('CommandService', `executed the command '${id}'`);

            this._onDidExecuteCommand.fire({ id });
            return Promise.resolve(ret);
        }
        catch (error: any) {
            this.logService.error('CommandService', `encounters an error with command '${id}'.`, error);
            return Promise.reject(error);
        }
    }
}