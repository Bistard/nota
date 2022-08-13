import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { PauseableEmitter, Register } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { URI } from "src/base/common/file/uri";
import { hash } from "src/base/common/util/hash";
import { Shortcut } from "src/base/common/keyboard";
import { IIpcService } from "src/code/browser/service/ipcService";
import { IKeyboardService } from "src/code/browser/service/keyboardService";
import { IWorkbenchService } from "src/code/browser/service/workbenchService";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";
import { IInstantiationService, IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { ILogService } from "src/base/common/logger";

export const SHORTCUT_CONFIG_NAME = 'shortcut.config.json';
// export const SHORTCUT_CONFIG_PATH = resolve(APP_ROOT_PATh, NOTA_DIR_NAME, SHORTCUT_CONFIG_NAME);
export const SHORTCUT_CONFIG_PATH = 'NA'; // FIX

export interface IShortcutRegistration {
    /**
     * The id of the command.
     */
    commandID: string;

    /**
     * The id of the `when`.
     */
    whenID: string;

    /**
     * The shortcut to be registered.
     */
    shortcut: Shortcut;

    /**
     * The callback to tell when the shortcut should be turned on or off.
     */
    when: Register<boolean> | null;

    /**
     * The command to be excuated when shorcut invokes.
     */
    command: (serviceProvider: IServiceProvider) => void;

    /**
     * Overrides the shortcut.
     */
    override: boolean;

    /**
     * Activates the shortcut by default.
     */
    activate: boolean;
}

/**
 * @internal Mapping data structure stored in {@link IShortcutService}.
 */
interface __IShortcutRegistration {
    commandID: string;
    whenID: string;
    emitter: PauseableEmitter<IInstantiationService>;
    when: IDisposable | null;
}

/**
 * @description A simple interface used in the file {@link SHORTCUT_CONFIG_NAME}.
 */
export interface IShortcutConfiguration {
    cmd: string;
    key: string;
    when: string;
}

export const IShortcutService = createDecorator<IShortcutService>('shortcut-service');

export interface IShortcutService {
    
    /**
     * All the registered shortcuts will be removed.
     */
    dispose(): void;
    
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

export class ShortcutService implements IDisposable, IShortcutService {

    // [fields]

    private disposables: DisposableManager;
    
    /**
     * mapping from 
     *  {@link IShortcutRegistration.commandID} to 
     *  {@link IShortcutRegistration.Shortcut}.
     */
    private idMap: Map<string, Shortcut>;

    /**
     * mapping from hash value of 
     *  {@link IShortcutRegistration.Shortcut} to
     *  {@link __IShortcutRegistration}.
     */
    private map: Map<number, __IShortcutRegistration>;
    
    // [constructor]

    constructor(
        @IKeyboardService keyboardService: IKeyboardService,
        @IIpcService ipcService: IIpcService,
        @IWorkbenchService workbenchService: IWorkbenchService,
        @IInstantiationService private readonly instantiaionService: IInstantiationService,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        this.disposables = new DisposableManager();
        this.idMap = new Map();
        this.map = new Map();
        
        keyboardService.onKeydown(e => {
            const shortcut = new Shortcut(e.ctrl, e.shift, e.alt, e.meta, e.key);
            const val = hash(shortcut.toString());
            const cache = this.map.get(val);
            if (cache !== undefined) {
                cache.emitter.fire(this.instantiaionService);
            }
        });

        /**
         * // TODO: more commands
         * Once the majority
         */
        workbenchService.onDidFinishLayout(() => this.__registerShortcuts());
        ipcService.onApplicationClose(async () => this.__onApplicationClose());
    }

    // [methods]

    public dispose(): void {
        this.map.forEach(cache => {
            cache.emitter.dispose();
            if (cache.when) {
                cache.when.dispose();
            }
        });
        this.map.clear();
        this.disposables.dispose();
    }

    public register(registration: IShortcutRegistration): IDisposable {

        // hash the shortcut into a number for fast future map searching.
        const hashVal = hash(registration.shortcut.toString());
        let cache = this.map.get(hashVal);
        
        // if the shortcut is never registered, we create one.
        if (cache === undefined) {
            cache = {
                commandID: registration.commandID,
                whenID: registration.whenID,
                emitter: new PauseableEmitter(registration.activate),
                when: registration.when ? registration.when((on: boolean) => {
                    if (on) cache!.emitter.resume();
                    else cache!.emitter.pause();
                }) : null,
            };
            
            this.map.set(hashVal, cache);
            this.idMap.set(registration.commandID, registration.shortcut);
        }

        // overrides the shortcut
        else if (registration.override) {
            const newVal = hash(registration.shortcut.toString());
            this.map.delete(hashVal);
            this.map.set(newVal, cache);
            this.idMap.set(registration.commandID, registration.shortcut);
        }

        return cache.emitter.registerListener(registration.command);
    }

    public unRegister(commandID: string): boolean {
        const shortcut = this.idMap.get(commandID);
        if (shortcut === undefined) {
            return false;
        }

        const val = hash(shortcut.toString());
        const cache = this.map.get(val);
        if (cache) {
            cache.emitter.dispose();
            if (cache.when) {
                cache.when.dispose();
            }
            
            this.idMap.delete(commandID);
            return this.map.delete(val);
        }
        
        return false;
    }

    // [private helper methods]

    private async __registerShortcuts(): Promise<void> {
        
        const uri = URI.fromFile(SHORTCUT_CONFIG_PATH);
        
        /**
         * if {@link SHORTCUT_CONFIG_NAME} is found, we read the configuration 
         * into memory.
         */
        if (await this.fileService.exist(uri)) {
            
            const buffer = await this.fileService.readFile(uri);
            const configuration = JSON.parse(buffer.toString());
            
            configuration.forEach(({cmd, key, when}: IShortcutConfiguration) => {
                
                const registered = this.idMap.get(cmd);

                // check if the id exists
                if (registered === undefined) {
                    // TODO: log: `invalid command id`
                    return;
                }

                // check if the shortcut is valid
                const newShortcut: Shortcut = Shortcut.fromString(key);
                if (newShortcut.equal(Shortcut.None)) {
                    // TODO: log: `invalid shortcut`
                    return;
                }
                
                // same shortcut, we ignore this
                if (newShortcut.equal(registered)) {
                    return;
                }

                const registeredHash = hash(registered.toString());
                const newShortcutHash = hash(newShortcut.toString());

                // update shortcut hash mapping
                const cache = this.map.get(registeredHash)!;
                this.map.delete(registeredHash);

                this.idMap.set(cmd, newShortcut);
                this.map.set(newShortcutHash, cache);
            });
            
        } else {
            // TODO: log (info): `file not found`
        }

    }

    private async __onApplicationClose(): Promise<void> {

        const uri = URI.fromFile(SHORTCUT_CONFIG_PATH);
        const array = Array.from(this.idMap, ([id, shortcut]: [string, Shortcut]): IShortcutConfiguration => {
            return {
                cmd: id,
                key: shortcut.toString(),
                when: this.map.get(hash(shortcut.toString()))!.whenID,
            };
        });

        try {
            await this.fileService.writeFile(
                uri, 
                DataBuffer.fromString(JSON.stringify(array, null, 2)), 
                { create: true, overwrite: true, unlock: true }
            );
        } catch (err) {
            // TODO: use logService
        }

    }
}