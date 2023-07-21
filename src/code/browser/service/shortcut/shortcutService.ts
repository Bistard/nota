import { Disposable, IDisposable } from "src/base/common/dispose";
import { DataBuffer } from "src/base/common/file/buffer";
import { URI } from "src/base/common/file/uri";
import { Shortcut, ShortcutHash } from "src/base/common/keyboard";
import { IKeyboardService } from "src/code/browser/service/keyboard/keyboardService";
import { IFileService } from "src/platform/files/common/fileService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { ILogService } from "src/base/common/logger";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/platform/lifecycle/browser/browserLifecycleService";
import { IShortcutItem, IShortcutRegistrant, IShortcutRegistration, IShortcutWithCommandRegistration, ShortcutWeight } from "src/code/browser/service/shortcut/shortcutRegistrant";
import { REGISTRANTS } from "src/platform/registrant/common/registrant";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { Emitter, Register } from "src/base/common/event";
import { IContextService } from "src/platform/context/common/contextService";
import { ICommandService } from "src/platform/command/common/commandService";
import { ContextKeyDeserializer } from "src/platform/context/common/contextKeyExpr";

export const SHORTCUT_CONFIG_NAME = 'shortcut.config.json';
export const IShortcutService = createService<IShortcutService>('shortcut-service');

export interface ShortcutTriggerEvent {

    /**
     * The command that binds to the shortcut.
     */
    readonly commandID: string;

    /**
     * The pressed shortcut.
     */
    readonly shortcut: Shortcut;
}

/**
 * An interface describes each shortcut when reading from the configuration 
 * files.
 */
interface IShortcutConfiguration {
    readonly commandID: string;
    readonly shortcut: string;
    readonly when: string;
    readonly weight: ShortcutWeight;
}

/**
 * An interface only for {@link ShortcutService}.
 */
export interface IShortcutService extends Disposable, IShortcutRegistrant, IService {

    /**
     * Fires when one of the registered shortcut is pressed.
     */
    readonly onDidTrigger: Register<ShortcutTriggerEvent>;

    /**
     * // TODO
     */
    reloadConfiguration(): Promise<void>;
}

export class ShortcutService extends Disposable implements IShortcutService {

    _serviceMarker: undefined;

    // [event]

    private readonly _onDidTrigger = this.__register(new Emitter<ShortcutTriggerEvent>());
    public readonly onDidTrigger = this._onDidTrigger.registerListener;

    // [field]

    private readonly _shortcutRegistrant = REGISTRANTS.get(IShortcutRegistrant);

    /** The resource of the shortcut configuration. */
    private readonly _resource: URI;

    // [constructor]

    constructor(
        @IKeyboardService keyboardService: IKeyboardService,
        @ILifecycleService lifecycleService: IBrowserLifecycleService,
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
        @IContextService private readonly contextService: IContextService,
        @ICommandService private readonly commandService: ICommandService,
    ) {
        super();
        this._resource = URI.join(environmentService.appConfigurationPath, SHORTCUT_CONFIG_NAME);

        // listen to keyboard events
        this.__register(keyboardService.onKeydown(e => {
            const pressed = new Shortcut(e.ctrl, e.shift, e.alt, e.meta, e.key);

            const candidates = this._shortcutRegistrant.findShortcut(pressed);
            let shortcut: IShortcutItem | undefined;

            for (const candidate of candidates) {
                if (this.contextService.contextMatchExpr(candidate.when)) {
                    if (!shortcut) {
                        shortcut = candidate;
                        continue;
                    }

                    // the candidate weight is higher than the current one.
                    if (candidate.weight < shortcut.weight) {
                        shortcut = candidate;
                    }
                }
            }

            // no valid registered shortcuts can be triggered
            if (!shortcut) {
                return;
            }

            // executing the coressponding command
            this.commandService.executeCommand(shortcut.commandID, ...(shortcut.commandArgs ?? []))
                .catch();
        }));

        // When the browser side is ready, we update registrations by reading from disk.
        lifecycleService.when(LifecyclePhase.Ready).then(() => this.__readConfigurationFromDisk());
        lifecycleService.onWillQuit((e) => e.join(this.__onApplicationClose()));
    }

    // [public methods]

    public register(registration: IShortcutRegistration): IDisposable {
        return this._shortcutRegistrant.register(registration);
    }

    public isRegistered(shortcut: number | Shortcut, commandID: string): boolean {
        return this._shortcutRegistrant.isRegistered(shortcut, commandID);
    }

    public registerWithCommand(registration: IShortcutWithCommandRegistration): IDisposable {
        return this._shortcutRegistrant.registerWithCommand(registration);
    }

    public findShortcut(shortcut: Shortcut | ShortcutHash): IShortcutItem[] {
        return this._shortcutRegistrant.findShortcut(shortcut);
    }

    public getAllShortcutRegistrations(): Map<number, IShortcutItem[]> {
        return this._shortcutRegistrant.getAllShortcutRegistrations();
    }

    public async reloadConfiguration(): Promise<void> {

    }

    // [private helper methods]

    private async __onApplicationClose(): Promise<void> {
        try {
            const keybindingRegistrations = this._shortcutRegistrant.getAllShortcutRegistrations();

            const keybindings: IShortcutConfiguration[] = [];

            for (const [hashcode, shortcuts] of keybindingRegistrations) {
                const name = Shortcut.fromHashcode(hashcode).toString();
                for (const shortcut of shortcuts) {
                    keybindings.push({
                        shortcut: name,
                        commandID: shortcut.commandID,
                        when: shortcut.when?.serialize() ?? '',
                        weight: shortcut.weight,
                    });
                }
            }

            await this.fileService.writeFile(
                this._resource,
                DataBuffer.fromString(JSON.stringify(keybindings, null, 4)),
                { create: true, overwrite: true, unlock: true }
            );
            this.logService.info(`Window ID - ${this.environmentService.windowID} - shortcut configuration saved at ${URI.toString(this._resource)}`);
        }
        catch (err) {
            this.logService.error(`Window ID - ${this.environmentService.windowID} - shortcut configuration failed to save at ${URI.toString(this._resource)}`, err);
        }
    }

    private async __readConfigurationFromDisk(): Promise<void> {

        try {

            // check if the configuration exists
            const exist = await this.fileService.exist(this._resource);
            if (!exist) {
                this.logService.debug(`shortcut configuration cannot found at ${URI.toString(this._resource)}`);
                return;
            }

            // read shortcut configuration into memory
            const rawContent = (await this.fileService.readFile(this._resource)).toString();

            // empty body
            if (!rawContent.length) {
                return;
            }

            // try to parse it
            const configuration: IShortcutConfiguration[] = JSON.parse(rawContent);
            this.logService.debug(`shortcut configuration loaded at ${URI.toString(this._resource)}`);

            // loop each one and try to load it into memory
            for (const { commandID, shortcut: name, when, weight } of configuration) {
                const shortcut = Shortcut.fromString(name);

                /**
                 * Checks if the shortcut read from the configuration that is 
                 * already registered.
                 */
                if (this._shortcutRegistrant.isRegistered(shortcut, commandID)) {

                    /**
                     * Only log out for the external extension level to given 
                     * the third party to have the chance to be notified.
                     */
                    if (weight === ShortcutWeight.ExternalExtension) {
                        this.logService.info(`The shortcut '${commandID} (${name})' that binds with the command '${commandID}' that is already registered.`);
                    }
                    continue;
                }

                /**
                 * Register the shortcut into the memory.
                 */
                try {
                    const deserializedWhen = ContextKeyDeserializer.deserialize(when);
                    this._shortcutRegistrant.register({
                        commandID: commandID,
                        shortcut: shortcut,
                        when: deserializedWhen,
                        weight: weight,
                        commandArgs: undefined, // review
                    });
                } catch (err) {
                    this.logService.warn(`The shortcut '${commandID} (${name})' failed to register.`);
                    continue;
                }
            }
        } catch (err) {
            this.logService.error(`Failed to load the shortcut configuration at ${URI.toString(this._resource)}.`);
        }
    }
}