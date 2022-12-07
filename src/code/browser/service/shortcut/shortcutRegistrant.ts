import { Disposable, IDisposable, toDisposable } from "src/base/common/dispose";
import { Shortcut, ShortcutHash } from "src/base/common/keyboard";
import { isNumber } from "src/base/common/util/type";
import { ICommandRegistrant } from "src/code/platform/command/common/commandRegistrant";
import { ContextKeyExpr } from "src/code/platform/context/common/contextKeyExpr";
import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { createRegistrant, REGISTRANTS, RegistrantType } from "src/code/platform/registrant/common/registrant";

export const IShortcutRegistrant = createRegistrant<IShortcutRegistrant>(RegistrantType.Shortcut);

/**
 * The less the number is, the higher the priority of the shortcut is.
 */
export const enum ShortcutWeight {
    Core              = 0,
    Editor            = 100,
    workbench         = 200,
    BuiltInExtension  = 300,
    ExternalExtension = 400,
}

interface IShortcutBase {
    /**
     * The id of the command. It indicates which command the shortcut is binding
     * to. When shortcut is triggered, the application will try to lookup by the
     * ID in the {@link ICommandRegistrant}.
     */
    readonly commandID: string;

    /**
     * The arguments for the command when it is executed.
     */
    readonly commandArgs?: any[];

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
}

/**
 * An interface describes the shortcut when registrating programmatically.
 */
export interface IShortcutRegistration extends IShortcutBase {

    /**
     * The shortcut of the given command.
     */
    readonly shortcut: Shortcut;
}

/**
 * Another way to register a shortcut along with the command itself. The command
 * will be registered into the {@link ICommandRegistrant}.
 */
export interface IShortcutWithCommandRegistration extends IShortcutRegistration {
    
    /**
     * The command to be executed when the shortcut is invoked. The arguments 
     * will be provided by the shortcut registration.
     */
    readonly command: (provider: IServiceProvider, ...args: any[]) => void;

    /**
     * The description of the command if provided.
     */
    readonly description?: string;

    /**
     * If to overwrite the existing command.
     * @default false
     */
    readonly overwrite?: boolean;
}

/**
 * The data structure used to represent the registered shortcut.
 */
export interface IShortcutItem extends IShortcutBase {
    /** @internal */
    readonly id: number;
}

interface IShortcutItems {
    readonly commands: Set<string>;
    readonly shortcuts: IShortcutItem[];
}

/**
 * An interface only for {@link ShortcutRegistrant}.
 */
export interface IShortcutRegistrant {
    
    /**
     * @description Register a {@link Shortcut}.
     * @param registration The shortcut registration information.
     * @returns A disposable to unregister the shortcut itself.
     */
    register(registration: IShortcutRegistration): IDisposable;
    
    /**
     * @description Except a general registration, you may also register a 
     * shortcut alongs with a new command which will be also registered into
     * {@link ICommandRegistrant}.
     * @param registration The shortcut registration with command information.
     * @returns A disposable to unregister the shortcut itself. 
     * 
     * @note When unregistering, the command will not be unregistered.
     */
    registerWithCommand(registration: IShortcutWithCommandRegistration): IDisposable;

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
    findShortcut(shortcut: Shortcut | ShortcutHash): IShortcutItem[];

    /**
     * @description Returns all the registered shortcuts. Mapping from the hash 
     * code of the shortcut to an array that stores all the commands that binds
     * to that shortcut.
     */
    getAllShortcutRegistrations(): Map<number, IShortcutItem[]>;
}

@IShortcutRegistrant
class ShortcutRegistrant implements IShortcutRegistrant {

    // [field]

    private static _shortcutID = 0;
    private readonly _commandRegistrant = REGISTRANTS.get(ICommandRegistrant);

    /**
     * A map that stores all the registered shortcuts. Mapping from the hash 
     * code of the shortcut to an object which contains a set and an array,
     * where the set stores all the unique names of each binding command and the
     * array stores all the binding shortcuts.
     */
    private readonly _shortcuts: Map<number, IShortcutItems>;

    // [constructor]

    constructor() {
        this._shortcuts = new Map();
    }

    // [public methods]

    public register(registration: IShortcutRegistration): IDisposable {

        const hashcode = registration.shortcut.toHashcode();
        let items = this._shortcuts.get(hashcode);
        if (!items) {
            items = {
                commands: new Set(),
                shortcuts: [],
            };
            this._shortcuts.set(hashcode, items);
        }

        /**
         * Checks if there is a same command with the same shortcut that is 
         * registered.
         */
        const commandID = registration.commandID;
        if (items.commands.has(commandID)) {
            throw new Error(`There exists a command with ID '${commandID}' that is already registered`);
        }
        
        // registere the shortcut
        const ID = ShortcutRegistrant._shortcutID++;
        items.shortcuts.push({
            id: ID,
            commandID: commandID,
            commandArgs: registration.commandArgs,
            when: registration.when,
            weight: registration.weight,
        });
        items.commands.add(commandID);

        return toDisposable(() => {
            if (items) {
                const itemIdx = items.shortcuts.findIndex((item) => item.id === ID);
                items.shortcuts.splice(itemIdx, 1);
                if (items.shortcuts.length === 0) {
                    this._shortcuts.delete(hashcode);
                }
            }
        });
    }

    public registerWithCommand(registration: IShortcutWithCommandRegistration): IDisposable {
        const unregister = this.register(registration);
        this._commandRegistrant.registerCommand(
            { 
                id: registration.commandID, 
                description: registration.description, 
                overwrite: registration.overwrite 
            }, 
            registration.command,
        );
        return unregister;
    }

    public isRegistered(shortcut: Shortcut | ShortcutHash, commandID: string): boolean {
        if (!isNumber(shortcut)) {
            shortcut = shortcut.toHashcode();
        }
        const items = this._shortcuts.get(shortcut);
        return items?.commands.has(commandID) ?? false;
    }

    public findShortcut(shortcut: Shortcut | ShortcutHash): IShortcutItem[] {
        if (!isNumber(shortcut)) {
            shortcut = shortcut.toHashcode();
        }
        const registered = this._shortcuts.get(shortcut)?.shortcuts;
        return registered ?? [];
    }

    public getAllShortcutRegistrations(): Map<number, IShortcutItem[]> {
        const map = new Map();

        for (const [hashcode, shortcuts] of this._shortcuts) {
            map.set(hashcode, shortcuts.shortcuts);
        }
        return map;
    }
    
    // [private helper methods]

}
