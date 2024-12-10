import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Shortcut, ShortcutHash } from "src/base/common/keyboard";
import { HashNumber } from "src/base/common/utilities/hash";
import { panic } from "src/base/common/utilities/panic";
import { isNumber } from "src/base/common/utilities/type";
import { AllCommands, AllCommandsArgumentsTypes } from "src/workbench/services/workbench/commandList";
import { ICommandRegistrant } from "src/platform/command/common/commandRegistrant";
import { ContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";
import { rendererWorkbenchShortcutRegister } from "src/workbench/services/workbench/shortcut.register";
import { IS_MAC } from "src/base/common/platform";
import { Arrays } from "src/base/common/utilities/array";
import { Emitter, Register } from "src/base/common/event";

/**
 * The less the number is, the higher the priority of the shortcut is.
 */
export const enum ShortcutWeight {
    Core = 0,
    Editor = 100,
    workbench = 200,
    BuiltInExtension = 300,
    ExternalExtension = 400,
}

interface IShortcutBase<TArgs extends any[]> {
    
    /**
     * The arguments for the command when it is executed.
     */
    readonly commandArgs: TArgs;

    /**
     * The command will only be executed when the expression (precondition) 
     * evaluates to true by given a context. Given a null will evaluate the 
     * expression always to true.
     */
    readonly when: ContextKeyExpr | null;

    /**
     * When a shortcut is registered with more than one command. The weight will
     * tell the program which command should choose be execute.
     */
    readonly weight: ShortcutWeight;

    // TODO: description?: string;
}

type IShortcutRegistrationBase<ID extends string> = ID extends AllCommands
    ? IShortcutBase<AllCommandsArgumentsTypes[ID]>
    : IShortcutBase<any[]>;

/**
 * An interface describes the shortcut for register programmatically.
 */
export type IShortcutRegistration<ID extends string> = IShortcutRegistrationBase<ID> & {

    /**
     * The shortcut of the given command.
     */
    readonly shortcut: Shortcut;
};

/**
 * An interface describes the shortcut for register programmatically.
 */
export type IShortcutRegistration2<ID extends string> = IShortcutRegistrationBase<ID> & {

    /**
     * The shortcut of the given command in string format. Check the format 
     * details at {@link Shortcut.fromString}.
     */
    readonly key: string;

    /**
     * If provided, this will be the shortcut only in MacOS. Check the format 
     * details at {@link Shortcut.fromString}.
     */
    readonly mac?: string;
};

/**
 * The data structure used to represent the registered shortcut.
 */
export interface IShortcutReference extends IShortcutBase<any[]> {
    
    /**
     * The id of the command. It indicates which command the shortcut is binding
     * to. When shortcut is triggered, the application will try to lookup by the
     * ID in the {@link ICommandRegistrant}.
     */
    readonly commandID: string;
}

/**
 * An interface only for {@link ShortcutRegistrant}.
 */
export interface IShortcutRegistrant extends IRegistrant<RegistrantType.Shortcut> {

    /**
     * Fires whenever a new command is registered.
     */
    readonly onDidRegister: Register<Shortcut>;

    /**
     * Fires whenever a command is un-registered.
     */
    readonly onDidUnRegister: Register<Shortcut>;

    /**
     * @description Register a {@link Shortcut} that binds to a command with the
     * given 'commandID'.
     * @param commandID An ID refers to a registered command in the command service.
     * @param registration The shortcut registration information.
     * @returns A disposable to unregister the shortcut.
     */
    register<ID extends string>(commandID: ID, registration: IShortcutRegistration<ID>): IDisposable;
    registerBasic<ID extends string>(commandID: ID, registration: IShortcutRegistration2<ID>): IDisposable;

    /**
     * @description Check if the command is already registered with the given
     * shortcut.
     * @param shortcut The given shortcut or the hashcode.
     * @param commandID The id of the command.
     */
    isRegistered(shortcut: Shortcut | ShortcutHash, commandID: string): boolean;

    /**
     * @description Given the shortcut or the hashcode, returns an array that 
     * contains all the items that have the same shortcut.
     * @param shortcut The given shortcut or the hashcode.
     */
    findShortcut(shortcut: Shortcut | ShortcutHash): IShortcutReference[];

    /**
     * @description Returns all the registered shortcuts. Mapping from the hash 
     * code of the shortcut to an array that stores all the commands that binds
     * to that shortcut.
     */
    getAllShortcutRegistrations(): Map<HashNumber, IShortcutReference[]>;
}

export class ShortcutRegistrant implements IShortcutRegistrant {

    // [event]

    private readonly _onDidRegister = new Emitter<Shortcut>();
    public readonly onDidRegister = this._onDidRegister.registerListener;

    private readonly _onDidUnRegister = new Emitter<Shortcut>();
    public readonly onDidUnRegister = this._onDidUnRegister.registerListener;

    // [field]

    public readonly type = RegistrantType.Shortcut;

    private static _shortcutUUID = 0;

    /**
     * A map that stores all the registered shortcuts. Mapping from the hash 
     * code of the shortcut to an object which contains a set and an array,
     * where the set stores all the unique names of each binding command and the
     * array stores all the binding shortcuts.
     */
    private readonly _shortcuts: Map<
        HashNumber, 
        Array<(IShortcutReference & { readonly uuid: number; })>
    >;

    // [constructor]

    constructor() {
        this._shortcuts = new Map();
    }

    // [public methods]

    public initRegistrations(provider: IServiceProvider): void {
        rendererWorkbenchShortcutRegister(provider);
    }

    public registerBasic<ID extends string>(commandID: ID, registration: IShortcutRegistration2<ID>): IDisposable {
        const shortcut = (IS_MAC && registration.mac) 
            ? Shortcut.fromString(registration.mac) 
            : Shortcut.fromString(registration.key);
        
        const resolved: IShortcutRegistration<ID> = {
            ...registration,
            shortcut: shortcut,
        };
        return this.register(commandID, resolved);
    }

    public register<ID extends string>(commandID: ID, registration: IShortcutRegistration<ID>): IDisposable {

        const hashcode = registration.shortcut.toHashcode();
        let items = this._shortcuts.get(hashcode);
        if (!items) {
            items = [];
            this._shortcuts.set(hashcode, items);
        }

        /**
         * Checks if there is a same command with the same shortcut that is 
         * registered.
         */
        if (Arrays.exist2(items, entry => entry.commandID === commandID)) {
            panic(`[ShortcutRegistrant] There exists a command with ID '${commandID}' that is already registered`);
        }

        // register the shortcut
        const uuid = ShortcutRegistrant._shortcutUUID++;
        items.push({
            uuid: uuid,
            commandID: commandID,
            commandArgs: registration.commandArgs,
            when: registration.when,
            weight: registration.weight,
        });

        this._onDidRegister.fire(registration.shortcut);

        return toDisposable(() => {
            if (items) {
                const itemIdx = items.findIndex((item) => item.uuid === uuid);
                items.splice(itemIdx, 1);
                if (items.length === 0) {
                    this._shortcuts.delete(hashcode);
                }
                this._onDidUnRegister.fire(registration.shortcut);
            }
        });
    }

    public isRegistered(shortcut: Shortcut | ShortcutHash, commandID: string): boolean {
        if (!isNumber(shortcut)) {
            shortcut = shortcut.toHashcode();
        }
        const items = this._shortcuts.get(shortcut);
        return items ? Arrays.exist2(items, entry => entry.commandID === commandID) : false;
    }

    public findShortcut(shortcut: Shortcut | ShortcutHash): IShortcutReference[] {
        if (!isNumber(shortcut)) {
            shortcut = shortcut.toHashcode();
        }
        const registered = this._shortcuts.get(shortcut);
        return registered ?? [];
    }

    public getAllShortcutRegistrations(): Map<HashNumber, IShortcutReference[]> {
        return this._shortcuts;
    }
}
