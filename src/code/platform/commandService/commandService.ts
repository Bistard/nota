import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { IInstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { CommandRegistrant, ICommandEvent } from "./command";

export interface ICommandService {
    readonly onDidExecuteCommand: Register<ICommandEvent>;
    
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