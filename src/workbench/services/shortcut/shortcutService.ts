import { Disposable, IDisposable } from "src/base/common/dispose";
import { DataBuffer } from "src/base/common/files/buffer";
import { URI } from "src/base/common/files/uri";
import { Shortcut } from "src/base/common/keyboard";
import { IKeyboardService } from "src/workbench/services/keyboard/keyboardService";
import { IFileService } from "src/platform/files/common/fileService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { ILogService } from "src/base/common/logger";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/platform/lifecycle/browser/browserLifecycleService";
import { IShortcutReference, IShortcutRegistrant, ShortcutWeight } from "src/workbench/services/shortcut/shortcutRegistrant";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { Emitter, Register } from "src/base/common/event";
import { IContextService } from "src/platform/context/common/contextService";
import { ICommandService } from "src/platform/command/common/commandService";
import { ContextKeyDeserializer } from "src/platform/context/common/contextKeyExpr";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { AsyncResult, Result, err, ok } from "src/base/common/result";
import { FileOperationError } from "src/base/common/files/file";
import { errorToMessage } from "src/base/common/utilities/panic";
import { trySafe } from "src/base/common/error";
import { Strings } from "src/base/common/utilities/string";

export const SHORTCUT_CONFIG_NAME = 'shortcut.config.json';
export const IShortcutService = createService<IShortcutService>('shortcut-service');

export interface IShortcutTriggerEvent {

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
export interface IShortcutService extends IDisposable, IService {

    /**
     * Fires when one of the registered shortcut is pressed.
     */
    readonly onDidTrigger: Register<IShortcutTriggerEvent>;

    /**
     * // TODO
     */
    reloadConfiguration(): Promise<void>;
}

export class ShortcutService extends Disposable implements IShortcutService {

    declare _serviceMarker: undefined;

    // [event]

    private readonly _onDidTrigger = this.__register(new Emitter<IShortcutTriggerEvent>());
    public readonly onDidTrigger = this._onDidTrigger.registerListener;

    // [field]

    /** The resource of the shortcut configuration. */
    private readonly _resource: URI;
    private readonly _shortcutRegistrant: IShortcutRegistrant;

    // [constructor]

    constructor(
        @IKeyboardService keyboardService: IKeyboardService,
        @ILifecycleService lifecycleService: IBrowserLifecycleService,
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
        @IContextService private readonly contextService: IContextService,
        @ICommandService private readonly commandService: ICommandService,
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        super();
        this._shortcutRegistrant = registrantService.getRegistrant(RegistrantType.Shortcut);

        this._resource = URI.join(environmentService.appConfigurationPath, SHORTCUT_CONFIG_NAME);

        // listen to keyboard events
        this.__register(keyboardService.onKeydown(e => {
            const pressed = new Shortcut(e.ctrl, e.shift, e.alt, e.meta, e.key);

            const candidates = this._shortcutRegistrant.findShortcut(pressed);
            let shortcut: IShortcutReference | undefined;

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

            // executing the corresponding command
            trySafe(
                () => this.commandService.executeCommand<any>(shortcut.commandID, ...(shortcut.commandArgs ?? [])),
                {
                    onError: err => logService.error('[ShortcutService]', `Error encounters. Executing shortcut '${pressed.toString()}' with command '${shortcut?.commandID}'`, err)
                }
            );
        }));

        // When the browser side is ready, we update registrations by reading from disk.
        lifecycleService.when(LifecyclePhase.Ready).then(() => this.__readConfigurationFromDisk());
        this.__register(lifecycleService.onWillQuit((e) => e.join(this.__onApplicationClose())));
    }

    // [public methods]

    public async reloadConfiguration(): Promise<void> {

    }

    // [private helper methods]

    private async __onApplicationClose(): Promise<void> {
        const keybindingRegistrations = this._shortcutRegistrant.getAllShortcutRegistrations();
        const keybindings: IShortcutConfiguration[] = [];

        // Serialize all the keybinding
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

        return Strings.stringifySafe2(keybindings, undefined, 4).toAsync()
            .andThen(raw => this.fileService.writeFile(
                this._resource,
                DataBuffer.fromString(raw),
                { create: true, overwrite: true, unlock: true }
            ))
            .match(
                () => this.logService.info('ShortcutService', 'shortcut configuration saved.', { WindowID: this.environmentService.windowID, at: URI.toString(this._resource) }),
                (error) => this.logService.error('ShortcutService', 'shortcut configuration failed to save.', error, { at: URI.toString(this._resource) }),
            );
    }

    private __readConfigurationFromDisk(): AsyncResult<void, Error> {

        this.logService.debug('ShortcutService', `Loading shortcut configuration at: ${URI.toString(this._resource)}`);

        return this.fileService.exist(this._resource)
        .andThen<DataBuffer | void, FileOperationError>(exist => {
            if (!exist) {
                this.logService.debug('ShortcutService', `shortcut configuration cannot found at: ${URI.toString(this._resource)}`);
                return ok();
            }

            return this.fileService.readFile(this._resource);
        })
        .andThen<IShortcutConfiguration[] | void, SyntaxError>(buffer => {
            if (!buffer) {
                return ok();
            }

            const content = buffer.toString();
            if (!content.length) {
                return ok();
            }

            return Strings.jsonParseSafe<IShortcutConfiguration[]>(content);
        })
        .andThen(configuration => {
            if (!configuration) {
                return ok();
            }
            
            this.logService.debug('ShortcutService', `Shortcut configuration loaded successfully at: ${URI.toString(this._resource)}.`);

            for (const { commandID, shortcut: name, when, weight } of configuration) {
                const load = this.__loadCommandBy(commandID, name, when, weight);
                load.match(
                    () => this.logService.trace('ShortcutService', `Shortcut registered: '${commandID} (${name})'`),
                    (error) => this.logService.warn('ShortcutService', `Shortcut failed to register: '${commandID} (${name})'.`, { error: error })
                );
            }

            return ok();
        });
    }

    private __loadCommandBy(commandID: string, name: string, when: string, weight: ShortcutWeight): Result<void, Error> {
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
                this.logService.info('ShortcutService', `The shortcut '${commandID} (${name})' that binds with the command '${commandID}' that is already registered.`, { commandID: commandID, name: name, });
            }

            return ok();
        }

        // Register the shortcut into the memory
        try {
            const deserializedWhen = ContextKeyDeserializer.deserialize(when);
            this._shortcutRegistrant.register2(
                commandID, {
                shortcut: shortcut,
                when: deserializedWhen,
                weight: weight,
                commandArgs: [], // review
            });
        } catch (error) {
            return err(new Error(errorToMessage(error)));
        }

        return ok();
    }
}