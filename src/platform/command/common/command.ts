import type { IShortcutRegistration } from "src/workbench/services/shortcut/shortcutRegistrant";
import type { ICommandRegistrant, ICommandBasicSchema } from "src/platform/command/common/commandRegistrant";
import { ContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { IContextService } from "src/platform/context/common/contextService";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { Callable, Constructor } from "src/base/common/utilities/type";

/**
 * A more concrete set of metadata to describe a command specifically used for
 * {@link Command}.
 */
export interface ICommandSchema extends Omit<ICommandBasicSchema, 'command' | 'overwrite'> {

    /**
     * The precondition that indicates if the command is valid to be invoked.
     */
    readonly when: ContextKeyExpr | null;

    /**
     * If the option is provided, the command will also be registered as a
     * shortcut.
     * @note The shortcut will only be available when the command schema
     * -provided `when` and the shortcut-provided `when` are both satisfied.
     */
    readonly shortcutOptions?: Omit<IShortcutRegistration<string>, 'commandID'>;
}

export type CommandImplementation<TArgs extends any[] = any[], TReturn = any> = Callable<[provider: IServiceProvider, ...args: TArgs], TReturn>;

/**
 * An interface only for {@link Command}.
 */
export interface ICommand {

    /**
     * The ID of the command.
     */
    readonly id: string;

    /**
     * A pre-condition that describe when should the command to be executed.
     * @see ContextKeyExpr
     */
    readonly when: ContextKeyExpr | null;

    /**
     * @description The actual command implementation.
     * @param provider A service provider that gives permission to access the
     *                 internal dependency injection to get all kinds of 
     *                 different micro-services.
     * @param args The other provided data.
     * @returns Returns a boolean indicates the command if applied successfully.
     * 
     * @note You may run the command manually also.
     */
    run: CommandImplementation<any[], boolean | Promise<boolean>>;
}

/**
 * @class Represents a command that encapsulates the executable logic by
 * implement the method 'run'. 
 * 
 * @note Should be registered through {@link ICommandRegistrant['registerCommand']}.
 *       It gives the {@link Command} able to have access to a {@link IServiceProvider}
 *       inside the 'run' parameter.
 * @note Use this class to define commands with complex logic or those that 
 *       require additional metadata. The `run` method must be implemented.
 * 
 * @example
 * ```ts
 * class MyCommand extends Command {
 *   public run(provider: IServiceProvider, ...args: any[]): boolean | Promise<boolean> {
 *     // Command logic here
 *   }
 * }
 * 
 * // Registering the command
 * const myCommand = new MyCommand({ id: 'myCommand', when: null });
 * commandRegistrant.registerCommand(myCommand);
 * ```
 * 
 * @example
 * // You may also define a command in the `AllCommands` to work with 'CommandService'
 * 
 * // commandList.ts
 * const enum AllCommands {
 *   MyCommand = 'myCommand',
 * }
 * export type AllCommandsArgumentsTypes = {
 *     [AllCommands.MyCommand]: [arg1: number];
 * };
 * export type AllCommandsReturnTypes = {
 *     [AllCommands.MyCommand]: void;
 * };
 * 
 * // main.ts
 * 
 * class MyCommand extends Command {
 *   public run(provider: IServiceProvider, arg: number): void {
 *     console.log(arg);
 *   }
 * }
 * 
 * const myCommand = new MyCommand({ id: AllCommands.MyCommand, when: null });
 * commandRegistrant.registerCommand(myCommand);
 * 
 * // type safety (ensuring a 'number' must be provided)
 * commandService.executeCommand(AllCommands.MyCommand, 100);
 */
export class Command<ID extends string = string> implements ICommand {

    // [field]

    private readonly _schema: ICommandSchema;

    // [constructor]

    constructor(schema: ICommandSchema) {
        this._schema = schema;
    }

    // [public methods]

    get schema(): ICommandSchema {
        return this._schema;
    }

    get id(): ID {
        return <ID>this._schema.id;
    }

    get when(): ContextKeyExpr | null {
        return this._schema.when;
    }

    get description(): string | undefined {
        return this._schema.description;
    }

    // [protected methods]

    /**
     * @description A callback function that will be invoked by the command
     * service.
     */
    protected __runCommand(provider: IServiceProvider, ...args: any[]): boolean | Promise<boolean> {
        const contextService = provider.getOrCreateService(IContextService);
        if (!contextService.contextMatchExpr(this._schema.when)) {
            return false;
        }
        return this.run(provider, ...args);
    }

    // [abstract methods]

    /**
     * The encapsulated implementation.
     */
    public run(provider: IServiceProvider, ...args: any[]): boolean | Promise<boolean> {
        return false;
    }
}

/**
 * @class Combine a list of {@link Command} into one single {@link Command}. The
 * commands are executed in the provided sequence. Any one of the command returns
 * a true will stop the execution.
 * 
 * @note This only works with all synchronous commands. Including any 
 *       asynchronous commands might cause weird behaviors.
 */
export class ChainCommand<ID extends string = string> extends Command<ID> {

    private readonly _commands: Command[];

    constructor(schema: ICommandSchema, commands: Command[]) {
        super(schema);
        this._commands = commands;
    }

    public override run(provider: IServiceProvider, ...args: any[]): boolean {
        const contextService = provider.getOrCreateService(IContextService);

        for (const cmd of this._commands) {
            if (!contextService.contextMatchExpr(cmd.when)) {
                continue;
            }

            const success = cmd.run(provider, ...args);
            if (success) {
                return true;
            }
        }
        return false;
    }
}

/**
 * @description A helpers to construct a {@link ChainCommand} easily.
 */
export function buildChainCommand<ID extends string = string>(schema: ICommandSchema, ctors: (typeof Command)[]): ChainCommand<ID> {
    return new ChainCommand(
        schema,
        [
            ...ctors.map(ctor => new ctor(schema))
        ],
    );
}