import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Emitter, PauseableEmitter, Register } from "src/base/common/event";
import { Shortcut } from "src/base/common/keyboard";
import { hash } from "src/base/common/util/hash";
import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { createRegistrant, RegistrantType } from "src/code/platform/registrant/common/registrant";

export const IShortcutRegistrant = createRegistrant<IShortcutRegistrant>(RegistrantType.Shortcut);

export interface IShortcutRegistrant {
    /**
     * Fires when one of the registered shortcut is pressed.
     */
    readonly onDidPress: Register<ShortcutPressEvent>;

    /**
     * @description Register a {@link Shortcut} with a callback.
     * @param registration The shortcut registration information.
     * @returns A disposable to unregister the callback itself.
     */
    register(registration: IShortcutRegistration): IDisposable;
    
     /**
      * @description Unregister the given command c with all its listeners.
      * @param commandID The id of the command to be unregistered.
      * @returns If the unregistration successed.
      */
    unRegister(commandID: string): boolean;
}

/** @internal */
export interface IShortcutRegistrantFriendship extends IShortcutRegistrant {
    onShortcutPress(shortcut: Shortcut, provider: IServiceProvider): void;
    getShortcut(command: string): Shortcut | undefined;
    getAllShortcutBindings(): IShortcutConfiguration[];
}

export interface ShortcutPressEvent {
    /**
     * The pressed shortcut.
     */
    readonly shortcut: Shortcut;
}

export interface IShortcutRegistration {
    /**
     * The id of the command.
     */
    readonly commandID: string;

    /**
     * The id of the `when`.
     */
    readonly whenID: string;

    /**
     * The shortcut to be registered.
     */
    readonly shortcut: Shortcut;

    /**
     * The callback to tell when the shortcut should be turned on or off.
     */
    readonly when: Register<boolean> | null;

    /**
     * The command to be excuated when shorcut invokes.
     */
    readonly command: (serviceProvider: IServiceProvider) => void;

    /**
     * Overrides the shortcut.
     */
    readonly override: boolean;

    /**
     * Activates the shortcut by default.
     */
    readonly activate: boolean;
}

export interface IShortcutConfiguration {
    readonly commandID: string;
    readonly whenID: string;
    readonly shortcut: string;
}

/**
 * @internal Mapping data structure stored in {@link IShortcutService}.
 */
interface __IShortcutBinding {
    readonly commandID: string;
    readonly whenID: string;
    readonly when: IDisposable | null;
    readonly executor: PauseableEmitter<IServiceProvider>;
}

@IShortcutRegistrant
class ShortcutRegistrant implements IShortcutRegistrant, IShortcutRegistrantFriendship {

    // [event]

    private readonly _onDidPress = new Emitter<ShortcutPressEvent>();
    public readonly onDidPress = this._onDidPress.registerListener;

    // [fields]

    /**
     * Represents how many unique shortcuts have been registered. Mapping from
     * command ID to shortcut.
     */
    private idMap: Map<string, Shortcut> = new Map();

    /**
     * Represent what commands are registered under each shortcut. Mapping the
     * hash value of the shortcut to all the corresponding bindings.
     */
    private map: Map<number, __IShortcutBinding> = new Map();

    // [constructor]

    constructor() {}

    // [public methods]

    public register(registration: IShortcutRegistration): IDisposable {

        // hash the shortcut into a number for fast future map searching.
        const hashVal = hash(registration.shortcut.toString());
        let newBinding = this.map.get(hashVal);
        
        // if the shortcut is never registered, we create one.
        if (newBinding === undefined) {
            newBinding = {
                commandID: registration.commandID,
                whenID: registration.whenID,
                executor: new PauseableEmitter(registration.activate),
                when: registration.when ? registration.when((on: boolean) => {
                    if (on) {
                        newBinding!.executor.resume();
                    } else {
                        newBinding!.executor.pause();
                    }
                }) : null,
            };

            this.map.set(hashVal, newBinding);
            this.idMap.set(registration.commandID, registration.shortcut);
        }

        // overrides the shortcut
        else if (registration.override) {
            const oldBindings = this.map.get(hashVal);
            if (oldBindings) {
                this.__disposeBinding(oldBindings);
                this.map.delete(hashVal);
            }
            
            const newVal = hash(registration.shortcut.toString());
            this.idMap.set(registration.commandID, registration.shortcut);
            this.map.set(newVal, newBinding);
        }

        // register command
        newBinding.executor.registerListener(registration.command);

        // for unregister purpose
        return toDisposable(() => {
            this.unRegister(registration.commandID);
        });
    }

    public unRegister(commandID: string): boolean {
        const shortcut = this.idMap.get(commandID);
        if (shortcut === undefined) {
            return false;
        }

        const hashVal = hash(shortcut.toString());
        const oldBindings = this.map.get(hashVal);
        if (oldBindings) {
            this.__disposeBinding(oldBindings);
            this.idMap.delete(commandID);
            return this.map.delete(hashVal);
        }
        
        return false;
    }

    // [public internal methods]

    public onShortcutPress(shortcut: Shortcut, provider: IServiceProvider): void {
        const val = hash(shortcut.toString());
        const cache = this.map.get(val);
        if (cache) {
            cache.executor.fire(provider);
        }
        this._onDidPress.fire({
            shortcut: shortcut,
        });
    }

    public getShortcut(command: string): Shortcut | undefined {
        return this.idMap.get(command);
    }

    public getAllShortcutBindings(): IShortcutConfiguration[] {
        const bindings: IShortcutConfiguration[] = [];
        for (const [commandID, shortcut] of this.idMap) {
            const hashVal = hash(shortcut.toString());
            const whenID = this.map.get(hashVal)!.whenID;
            bindings.push({
                commandID: commandID,
                shortcut: shortcut.toString(),
                whenID: whenID,
            });
        };
        return bindings;
    }

    // [private helper methods]

    private __disposeBinding(registration: __IShortcutBinding): void {
        registration.executor.dispose();
        if (registration.when) {
            registration.when.dispose();
        }
    }
}
