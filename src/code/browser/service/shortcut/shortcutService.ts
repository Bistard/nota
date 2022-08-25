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

export const SHORTCUT_CONFIG_NAME = 'shortcut.config.json';
// export const SHORTCUT_CONFIG_PATH = resolve(APP_ROOT_PATh, NOTA_DIR_NAME, SHORTCUT_CONFIG_NAME);
export const SHORTCUT_CONFIG_PATH = 'NA'; // FIX

export const IShortcutService = createDecorator<IShortcutService>('shortcut-service');

export interface IShortcutService extends IDisposable {
    register(registration: IShortcutRegistration): IDisposable;
    unRegister(commandID: string): boolean;
}

export class ShortcutService extends Disposable implements IShortcutService {

    // [event]

    get onDidPress() { return this._registrant.onDidPress; }

    // [field]

    private readonly _registrant = <IShortcutRegistrantFriendship>Registrants.get(IShortcutRegistrant);

    // [constructor]

    constructor(
        @IKeyboardService keyboardService: IKeyboardService,
        @ILifecycleService lifecycleService: IBrowserLifecycleService,
        @IInstantiationService instantiaionService: IInstantiationService,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        
        
        // listen to keyboard events
        this.__register(keyboardService.onKeydown(e => {
            const shortcut = new Shortcut(e.ctrl, e.shift, e.alt, e.meta, e.key);
            this._registrant.onShortcutPress(shortcut, instantiaionService);
        }));
        
        // When the browser side is ready, we update registrations by reading from disk.
        lifecycleService.when(LifecyclePhase.Ready).then(() => this.__registerFromDisk());
        lifecycleService.onWillQuit(() => this.__onApplicationClose());
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

        const uri = URI.fromFile(SHORTCUT_CONFIG_PATH);
        
        /**
         * if {@link SHORTCUT_CONFIG_NAME} is found, we read the configuration 
         * into memory.
         */
        if (await this.fileService.exist(uri)) {
            
            const buffer = await this.fileService.readFile(uri);
            const configuration: IShortcutConfiguration[] = JSON.parse(buffer.toString());
            this.logService.debug(`shortcut configuration loaded at ${uri.toString()}`);
            
            configuration.forEach(({ commandID, shortcut, whenID }) => {
                
                const registered = this._registrant.getShortcut(commandID);

                // check if the shortcut is valid
                const newShortcut: Shortcut = Shortcut.fromString(shortcut);
                if (newShortcut.equal(Shortcut.None)) {
                    this.logService.warn(`Invalid shortcut registration from the configuration at ${uri.toString()}: ${commandID} - ${shortcut}.`);
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
            this.logService.debug(`shortcut configuration cannot found at ${uri.toString()}`);
        }
    }

    private async __onApplicationClose(): Promise<void> {

        const uri = URI.fromFile(SHORTCUT_CONFIG_PATH);
        try {
            const bindings = this._registrant.getAllShortcutBindings();
            await this.fileService.writeFile(
                uri, 
                DataBuffer.fromString(JSON.stringify(bindings, null, 2)), 
                { create: true, overwrite: true, unlock: true }
            );
            this.logService.trace(`Window#shortcutService#saved at ${uri.toString()}`);
        } 
        catch (err) {
            this.logService.error(`ShortcutService failed to save at ${uri.toString()}`, err);
        }
    }
}