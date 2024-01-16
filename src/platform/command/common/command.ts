import { IShortcutRegistration } from "src/workbench/services/shortcut/shortcutRegistrant";
import { ICommandRegistrant, ICommandSchema } from "src/platform/command/common/commandRegistrant";
import { ContextKeyExpr, CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { IContextService } from "src/platform/context/common/contextService";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { Constructor } from "src/base/common/utilities/type";

export interface ICommandRegistrationSchema extends Omit<ICommandSchema, 'overwrite'> {

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

export type CommandImplementation = {
    (provider: IServiceProvider, ...args: any[]): boolean | Promise<boolean>;
};

/**
 * An interface only for {@link Command}.
 */
export interface ICommand {

    readonly id: string;
    readonly when: ContextKeyExpr | null;

    /**
     * @description The actual command implementation.
     * @param provider A service provider that gives permission to access the
     *                 internal dependency injection to get all kinds of 
     *                 different micro-services.
     * @param args The other provided data.
     * @returns Returns a boolean indicates the command if applied successfully.
     * @note You may run the command manually also.
     */
    run: CommandImplementation;
}

/**
 * @class Instead of register a command into the {@link ICommandRegistrant} 
 * directly. A {@link Command} provides extra functionalities and a series of 
 * inherited classes that supports additional behaviours.
 * 
 * @note The abstract method `run` indicates the actual command implementation.
 * 
 * @note When a {@link Command} is constructed, the abstract method `run` will 
 * be automatically wrapped and registered into the {@link ICommandRegistrant}.
 */
export abstract class Command implements ICommand {

    // [field]

    private readonly _schema: ICommandRegistrationSchema;

    // [constructor]

    constructor(schema: ICommandRegistrationSchema) {
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
        // commandRegistrant.registerCommand(actualSchema, this.__runCommand.bind(this));
    }

    // [public methods]

    get id(): string {
        return this._schema.id;
    }

    get when(): ContextKeyExpr | null {
        return this._schema.when;
    }

    get schema(): ICommandSchema {
        return this._schema;
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

export interface IChainCommandRegistration {
    readonly id: string;
    readonly when: ContextKeyExpr | null;
    readonly command: CommandImplementation;
}

export class ChainCommand extends Command {

    private readonly _commands: Command[];

    constructor(schema: ICommandRegistrationSchema, commands: Command[]) {
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

/**
 * @description A helpers to construct a {@link ChainCommand} easily.
 */
export function buildChainCommand(schema: ICommandRegistrationSchema, ctors: Constructor<Command>[]): Command {
    return new ChainCommand(
        schema,
        [
            ...ctors.map(ctor => new ctor(schema))
        ]
    );
}