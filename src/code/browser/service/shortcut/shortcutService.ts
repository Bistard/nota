import { Disposable, IDisposable } from "src/base/common/dispose";
import { DataBuffer } from "src/base/common/file/buffer";
import { URI } from "src/base/common/file/uri";
import { Shortcut } from "src/base/common/keyboard";
import { IKeyboardService } from "src/code/browser/service/keyboard/keyboardService";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { ILogService } from "src/base/common/logger";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/code/platform/lifeCycle/browser/browserLifecycleService";
import { IShortcutConfiguration, IShortcutRegistrant, IShortcutRegistrantFriendship, IShortcutRegistration } from "src/code/browser/service/shortcut/shortcutRegistrant";
import { Registrants } from "src/code/platform/registrant/common/registrant";
import { IBrowserEnvironmentService, IEnvironmentService } from "src/code/platform/environment/common/environment";

export const SHORTCUT_CONFIG_NAME = 'shortcut.config.json';
export const IShortcutService = createDecorator<IShortcutService>('shortcut-service');

export interface IShortcutService extends IDisposable {
    register(registration: IShortcutRegistration): IDisposable;
    unRegister(commandID: string): boolean;
}

export class ShortcutService extends Disposable implements IShortcutService {

    // [event]

    get onDidPress() { return this._registrant.onDidPress; }

    // [field]

    private _resource: URI;
    private readonly _registrant = <IShortcutRegistrantFriendship>Registrants.get(IShortcutRegistrant);

    // [constructor]

    constructor(
        @IKeyboardService keyboardService: IKeyboardService,
        @ILifecycleService lifecycleService: IBrowserLifecycleService,
        @IInstantiationService instantiaionService: IInstantiationService,
        @IBrowserEnvironmentService environmentService: IEnvironmentService,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        this._resource = URI.join(environmentService.appConfigurationPath, SHORTCUT_CONFIG_NAME);
        
        // listen to keyboard events
        this.__register(keyboardService.onKeydown(e => {
            const shortcut = new Shortcut(e.ctrl, e.shift, e.alt, e.meta, e.key);
            this._registrant.onShortcutPress(shortcut, instantiaionService);
        }));
        
        // When the browser side is ready, we update registrations by reading from disk.
        lifecycleService.when(LifecyclePhase.Ready).then(() => this.__registerFromDisk());
        lifecycleService.onWillQuit((e) => e.join(this.__onApplicationClose()));
    }

    // [public methods]

    public register(registration: IShortcutRegistration): IDisposable {
        return this._registrant.register(registration);
    }

    public unRegister(commandID: string): boolean {
        return this._registrant.unRegister(commandID);
    }
    
    // [private helper methods]

    private async __registerFromDisk(): Promise<void> {

        if (await this.fileService.exist(this._resource)) {

            // read shortcut configuration into memory
            const buffer = await this.fileService.readFile(this._resource);
            const configuration: IShortcutConfiguration[] = JSON.parse(buffer.toString());
            this.logService.debug(`shortcut configuration loaded at ${this._resource.toString()}`);
            
            // loop each one and try to load it into memory
            configuration.forEach(({ commandID, shortcut, whenID }) => {
                const registered = this._registrant.getShortcut(commandID);

                // check if the shortcut is valid
                const newShortcut: Shortcut = Shortcut.fromString(shortcut);
                if (newShortcut.equal(Shortcut.None)) {
                    this.logService.warn(`Invalid shortcut registration from the configuration at ${this._resource.toString()}: ${commandID} - ${shortcut}.`);
                    return;
                }
                
                // same shortcut, we ignore it
                if (registered && newShortcut.equal(registered)) {
                    return;
                }

                // we update this shortcut by overriding.
                // TODO: should get correct from contextService
                this._registrant.register({
                    commandID: commandID,
                    whenID: whenID,
                    shortcut: newShortcut,
                    when: null,
                    command: () => {},
                    override: true,
                    activate: true,
                });
            });
        } else {
            this.logService.debug(`shortcut configuration cannot found at ${this._resource.toString()}`);
        }
    }

    private async __onApplicationClose(): Promise<void> {

        try {
            const bindings = this._registrant.getAllShortcutBindings();
            await this.fileService.writeFile(
                this._resource, 
                DataBuffer.fromString(JSON.stringify(bindings, null, 4)), 
                { create: true, overwrite: true, unlock: true }
            );
            this.logService.trace(`Window#shortcutService#saved at ${this._resource.toString()}`);
        } 
        catch (err) {
            this.logService.error(`ShortcutService failed to save at ${this._resource.toString()}`, err);
        }
    }
}