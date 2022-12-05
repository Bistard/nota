import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Shortcut, ShortcutHash } from "src/base/common/keyboard";
import { isNumber } from "src/base/common/util/type";
import { ICommandRegistrant } from "src/code/platform/command/common/commandRegistrant";
import { ContextKeyExpr } from "src/code/platform/context/common/contextKeyExpr";
import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { createRegistrant, REGISTRANTS, RegistrantType } from "src/code/platform/registrant/common/registrant";

export const IShortcutRegistrant = createRegistrant<IShortcutRegistrant>(RegistrantType.Shortcut);

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
     * tell the program which command should choose be execute. Given a number, 
     * the less the number is the higher the priority of the shortcut is.
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
    getAllShortcutRegistrations(): ReadonlyMap<number, IShortcutItem[]>;
}

@IShortcutRegistrant
class ShortcutRegistrant implements IShortcutRegistrant {

    // [field]

    private static _shortcutID = 0;
    private readonly _commandRegistrant = REGISTRANTS.get(ICommandRegistrant);

    /**
     * A map that stores all the registered shortcuts. Mapping from the hash 
     * code of the shortcut to an array that stores all the commands that binds
     * to that shortcut.
     */
    private readonly _shortcuts: Map<number, IShortcutItem[]>;

    private _bufferSortedShortcuts?: [number, IShortcutItem[]][];

    // [constructor]

    constructor() {
        this._shortcuts = new Map();
    }

    // [public methods]

    public register(registration: IShortcutRegistration): IDisposable {

        // clean the sorted shortcuts buffer
        this._bufferSortedShortcuts = undefined;
        
        const hashcode = registration.shortcut.toHashcode();
        let arr = this._shortcuts.get(hashcode);
        if (!arr) {
            arr = [];
            this._shortcuts.set(hashcode, arr);
        }

        const ID = ShortcutRegistrant._shortcutID++;
        arr.push({
            id: ID,
            commandID: registration.commandID,
            commandArgs: registration.commandArgs,
            when: registration.when,
            weight: registration.weight,
        });

        return toDisposable(() => {
            if (arr) {
                const itemIdx = arr.findIndex((item) => item.id === ID);
                arr.splice(itemIdx, 1);
                if (arr.length === 0) {
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

    public findShortcut(shortcut: Shortcut | ShortcutHash): IShortcutItem[] {
        if (!isNumber(shortcut)) {
            shortcut = shortcut.toHashcode();
        }
        const registered = this._shortcuts.get(shortcut);
        return registered ?? [];
    }

    public getAllShortcutRegistrations(): ReadonlyMap<number, IShortcutItem[]> {
        return this._shortcuts;
    }
    
    // [private helper methods]

}
