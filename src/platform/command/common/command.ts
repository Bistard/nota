import { IShortcutRegistration } from "src/workbench/services/shortcut/shortcutRegistrant";
import { ICommandRegistrant, ICommandBasicSchema } from "src/platform/command/common/commandRegistrant";
import { ContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { IContextService } from "src/platform/context/common/contextService";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { Callable } from "src/base/common/utilities/type";

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
     * @note The shortcut will only be avaliable when the command schema
     * -provided `when` and the shorcut-provided `when` are both satisfied.
     */
    readonly shortcutOptions?: Omit<IShortcutRegistration, 'commandID'>;
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
 * @class Instead of register a command schema into the {@link ICommandRegistrant} 
 * directly. A {@link Command} provides extra functionalities and a series of 
 * inherited classes that supports additional behaviours.
 * 
 * @note The abstract method `run` indicates the actual command implementation.
 * @note A {@link Command} requires more metadata to be constructed and 
 *       described by {@link ICommandSchema}.
 * @note Invoke {@link ICommandRegistrant.registerCommand} to register a 
 *       {@link Command} in a convinient way.
 */
export abstract class Command implements ICommand {

    // [field]

    private readonly _schema: ICommandSchema;

    // [constructor]

    constructor(schema: ICommandSchema) {
        this._schema = schema;
        const actualSchema = {
            ...schema,
            overwrite: true,
        };

        // FIX: shortcutRegistrant invalid
        // register as the shortcut if needed
        // if (schema.shortcutOptions) {
        //     shortcutRegistrant.register({
        //         commandID: schema.id,
        //         ...schema.shortcutOptions,
        //         when: CreateContextKeyExpr.And(schema.when, schema.shortcutOptions.when),
        //     });
        // }

        // command registration
        // FIX: commandRegistrant invalid
        // commandRegistrant.registerCommandBasic(actualSchema, this.__runCommand.bind(this));
    }

    // [public methods]

    get id(): string {
        return this._schema.id;
    }

    get when(): ContextKeyExpr | null {
        return this._schema.when;
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

    public abstract run(provider: IServiceProvider, ...args: any[]): boolean | Promise<boolean>;
}

export class ChainCommand extends Command {

    private readonly _commands: Command[];

    constructor(schema: ICommandSchema, commands: Command[]) {
        super(schema);
        this._commands = commands;
    }

    public async run(provider: IServiceProvider, ...args: any[]): Promise<boolean> {
        const contextService = provider.getOrCreateService(IContextService);

        for (const cmd of this._commands) {
            if (!contextService.contextMatchExpr(cmd.when)) {
                continue;
            }

            const success = await cmd.run(provider, ...args);
            if (success) {
                return true;
            }
        }
        return false;
    }
}
