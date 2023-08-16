import { Disposable } from "src/base/common/dispose";
import { errorToMessage } from "src/base/common/error";
import { Emitter, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { ICommandEvent, ICommandRegistrant } from "src/platform/command/common/commandRegistrant";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { REGISTRANTS } from "src/platform/registrant/common/registrant";

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

    declare _serviceMarker: undefined;

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
            return Promise.reject(new Error(`command with ID '${id}' is not found`));
        }

        try {
            const result = command.command(this.instantiationService, ...args);
            this._onDidExecuteCommand.fire({ commandID: id, args: args });
            this.logService.trace(`[CommandService] executed the command '${id}'`);
            return Promise.resolve(<T>result);
        }
        catch (error) {
            this.logService.error(`[CommandService] encounters an error with command '${id}': ${errorToMessage(error)}`);
            return Promise.reject();
        }
    }
}