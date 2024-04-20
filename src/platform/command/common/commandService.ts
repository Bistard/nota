import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { AllCommands, AllCommandsArgumentsTypes, AllCommandsReturnTypes } from "src/workbench/services/workbench/commandList";
import { ICommandEvent, ICommandRegistrant } from "src/platform/command/common/commandRegistrant";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { panic } from "src/base/common/utilities/panic";

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
     * @description Executes a predefined command using its unique identifier 
     * (ID). 
     * 
     * @note Ensures type safety by enforcing specific argument and return types 
     *       for each command as defined in:
     *  - {@link AllCommandsArgumentsTypes} and 
     *  - {@link AllCommandsReturnTypes}.
     * 
     * @param id The ID of the predefined command from {@link AllCommands}.
     * @param args The arguments required for the command.
     * @returns A {@link Promise} resolving with the command's result, or 
     *          rejects if an error occurs.
     * 
     * @example
     * // Execute a command without arguments
     * commandService.executeCommand(AllCommands.reloadWindow);
     */
    executeCommand<ID extends AllCommands>(id: ID, ...args: AllCommandsArgumentsTypes[ID]): Promise<AllCommandsReturnTypes[ID]>;
    
    /**
     * @description Executes a command that may not be predefined in the 
     * application. 
     * 
     * @note This method is more flexible and accepts any command ID as a string 
     *       along with any number of arguments.
     * 
     * @param id The arbitrary string ID of the command.
     * @param args Any number of arguments for the command.
     * @returns A {@link Promise} resolving with the command's result, or 
     *          rejects if an error occurs.
     * 
     * @example
     * // Execute a custom command with arbitrary arguments
     * commandService.executeAnyCommand('customCommand', customArg1, customArg2);
     */
    executeAnyCommand(id: string, ...args: any[]): Promise<any>;
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
        return this.executeAnyCommand(id, ...args);
    }

    public async executeAnyCommand(id: string, ...args: any[]): Promise<any> {
        const command = this._registrant.getCommand(id);
        if (!command) {
            return panic(new Error(`command with ID '${id}' is not found`));
        }

        try {
            const ret = await command.command(this.instantiationService, ...args);
            this.logService.trace('CommandService', `executed the command: '${id}'`);

            this._onDidExecuteCommand.fire({ id });
            return ret;
        }
        catch (error: any) {
            this.logService.error('CommandService', `encounters an error with command '${id}'.`, error);
            panic(error);
        }
    }
}