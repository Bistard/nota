import { Disposable, IDisposable } from "src/base/common/dispose";
import { tryOrDefault } from "src/base/common/error";
import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { UnbufferedScheduler } from "src/base/common/util/async";
import { IConfigurationRegistrant, IRawConfigurationChangeEvent } from "src/code/platform/configuration/common/configurationRegistrant";
import { ConfigurationHub, ConfigurationType, DefaultConfiguration, UserConfiguration } from "src/code/platform/configuration/common/configurationHub";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";
import { DeepReadonly } from "src/base/common/util/type";

export const IConfigurationService = createService<IConfigurationService>('configuration-service');

// TODO
export interface IConfigurationService extends IDisposable {

    readonly onDidConfigurationChange: Register<IConfigurationChangeEvent>;
    init(): Promise<void>;
    get<T>(section: string | undefined, defaultValue?: T): DeepReadonly<T>; // FIX: should not provide 'defaultValue'.
    set(section: string, value: any): void;
    delete(section: string): void;
}

/**
 * @class // TODO
 */
export class MainConfigurationService extends Disposable implements IConfigurationService {

    // [fields]

    private readonly _registrant = REGISTRANTS.get(IConfigurationRegistrant);

    private readonly _defaultConfiguration: DefaultConfiguration;
    private readonly _userConfiguration: UserConfiguration;

    private _configurationHub: ConfigurationHub;

    // [event]

    private readonly _onDidConfigurationChange = this.__register(new Emitter<IConfigurationChangeEvent>());
    public readonly onDidConfigurationChange = this._onDidConfigurationChange.registerListener;

    // [constructor]

    constructor(
        userResource: URI,
        @IFileService fileService: IFileService,
        @ILogService logService: ILogService,
    ) {
        super();

        // initialization
        {
            this._defaultConfiguration = new DefaultConfiguration();
            this._userConfiguration = new UserConfiguration(userResource, fileService, logService);
            
            this._configurationHub = this.__reloadConfigurationHub();
        }

        // register listeners
        {
            // default configuration reload
            this.__register(this._defaultConfiguration.onDidConfigurationChange(e => this.__onDefaultConfigurationChange(e)));

            // user configuration reload
            this.__register(this._userConfiguration.onDidConfigurationChange(e => userScheduler.schedule()));
            const userScheduler = this.__register(new UnbufferedScheduler<void>(
                100, // wait for a moment to avoid excessive reloading
                async () => {
                    await this._userConfiguration.reload();
                    this.__onUserConfigurationChange();
                },
            ));

            // catch configuration registration errors and log out
            this.__register(this._registrant.onErrorRegistration(e => logService.warn(`The configuration registration fails: ${JSON.stringify(e)}.`)));
        }
    }

    // [public methods]

    public async init(): Promise<void> {
        await Promise.all([this._defaultConfiguration.init(), this._userConfiguration.init()]);
        this._configurationHub = this.__reloadConfigurationHub();
    }

    public get<T>(section: string | undefined, defaultValue?: T): DeepReadonly<T> {
        return tryOrDefault<any>(defaultValue ?? undefined!, () => this._configurationHub.get(section));
    }

    public set(section: string, value: any): void {
        this._configurationHub.set(section, value);
    }

    public delete(section: string): void {
        this._configurationHub.delete(section);
    }

    // [private helper methods]

    private __onDefaultConfigurationChange({ properties }: IRawConfigurationChangeEvent): void {
        const current = this._defaultConfiguration.getConfiguration();
        const change = this._configurationHub.compareAndUpdateConfiguration(ConfigurationType.Default, current, properties);
        this.__onConfigurationChange(change, ConfigurationType.Default);
    }

    private __onUserConfigurationChange(): void {
        const current = this._userConfiguration.getConfiguration();
        const change = this._configurationHub.compareAndUpdateConfiguration(ConfigurationType.Default, current, undefined);
        this.__onConfigurationChange(change, ConfigurationType.User);
    }

    private __onConfigurationChange(change: IRawConfigurationChangeEvent, type: ConfigurationType): void {
        const event = new ConfigurationChangeEvent(change, type);
        this._onDidConfigurationChange.fire(event);
    }

    private __reloadConfigurationHub(): ConfigurationHub {
        return new ConfigurationHub(
            this._defaultConfiguration.getConfiguration(),
            this._userConfiguration.getConfiguration(),
        );
    }
}

export interface IConfigurationChangeEvent {
    readonly type: ConfigurationType;
    readonly properties: Set<string>;
    affect(section: string): boolean;
}

export class ConfigurationChangeEvent implements IConfigurationChangeEvent {

    // [fields]

    readonly properties = new Set<string>();

    // [constructor]

    constructor(
        change: IRawConfigurationChangeEvent,
        public readonly type: ConfigurationType,
    ) {
        for (const key of change.properties) {
			this.properties.add(key);
		}
    }

    // [public methods]

    public affect(section: string): boolean {
        for (const key of this.properties) {
            if (section.startsWith(key)) {
                return true;
            }
        }
        return false;
    }
}