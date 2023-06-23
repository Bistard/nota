import { Disposable } from "src/base/common/dispose";
import { tryOrDefault } from "src/base/common/error";
import { Emitter } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { IConfigurationRegistrant, IRawConfigurationChangeEvent } from "src/code/platform/configuration/common/configurationRegistrant";
import { ConfigurationHub, DefaultConfiguration, UserConfiguration } from "src/code/platform/configuration/common/configurationHub";
import { IFileService } from "src/code/platform/files/common/fileService";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";
import { DeepReadonly } from "src/base/common/util/type";
import { APP_CONFIG_NAME, ConfigurationModuleType, ConfigurationModuleTypeToString, IConfigurationService, IConfigurationUpdateOptions, Section } from "src/code/platform/configuration/common/configuration";

export abstract class AbstractConfigurationService extends Disposable implements IConfigurationService {

    _serviceMarker: undefined;

    // [fields]

    protected readonly _registrant = REGISTRANTS.get(IConfigurationRegistrant);

    protected _initialized: boolean;
    protected readonly _configurationPath: URI;
    
    protected readonly _defaultConfiguration: DefaultConfiguration;
    protected readonly _userConfiguration: UserConfiguration;

    protected _configurationHub: ConfigurationHub;

    // [event]

    protected readonly _onDidConfigurationChange = this.__register(new Emitter<IConfigurationChangeEvent>());
    public readonly onDidConfigurationChange = this._onDidConfigurationChange.registerListener;

    // [constructor]

    constructor(
        appConfigurationPath: URI,
        @IFileService fileService: IFileService,
        @ILogService protected readonly logService: ILogService,
    ) {
        super();

        // initialization
        {
            this._initialized = false;
            this._configurationPath = appConfigurationPath;
            
            this._defaultConfiguration = new DefaultConfiguration();
            this._userConfiguration = new UserConfiguration(URI.join(appConfigurationPath, APP_CONFIG_NAME), fileService, logService);
            
            this._configurationHub = this.__reloadConfigurationHub();
        }

        // register listeners
        {
            // default configuration reload
            this.__register(this._defaultConfiguration.onDidConfigurationChange(e => this.__onDefaultConfigurationChange(e)));

            // user configuration reload
            this.__register(this._userConfiguration.onDidConfigurationChange(() => this.__onUserConfigurationChange()));

            // catch configuration registration errors and log out
            this.__register(this._registrant.onErrorRegistration(e => logService.warn(`The configuration registration fails: ${JSON.stringify(e)}.`)));
        }
    }

    // [public methods]

    public async init(): Promise<void> {
        if (this._initialized) {
            throw new Error(`[ConfigurationService] cannot be initialized twice.`);
        }
        this._initialized = true;

        this.logService.trace(`[ConfigurationService] initializing at configuration path'${URI.toString(this._configurationPath, true)}'...`);

        await Promise.all([this._defaultConfiguration.init(), this._userConfiguration.init()]);
        this._configurationHub = this.__reloadConfigurationHub();

        this.logService.trace(`[ConfigurationService] initialized.`);
    }

    public get<T>(section: Section | undefined, defaultValue?: T): DeepReadonly<T> {
        return tryOrDefault<any>(defaultValue ?? undefined!, () => this._configurationHub.get(section));
    }

    public abstract set(section: Section, value: any): Promise<void>;
    public abstract set(section: Section, value: any, options: IConfigurationUpdateOptions): Promise<void>;
    public abstract set(section: Section, value: any, options?: IConfigurationUpdateOptions): Promise<void>;

    public abstract delete(section: Section): Promise<void>;
    public abstract delete(section: Section, options?: IConfigurationUpdateOptions): Promise<void>;

    // [private helper methods]

    private __onDefaultConfigurationChange({ properties }: IRawConfigurationChangeEvent): void {
        const current = this._defaultConfiguration.getConfiguration();
        const change = this._configurationHub.compareAndUpdateConfiguration(ConfigurationModuleType.Default, current, properties);
        this.__onConfigurationChange(change, ConfigurationModuleType.Default);
    }

    private __onUserConfigurationChange(): void {
        const current = this._userConfiguration.getConfiguration();
        const change = this._configurationHub.compareAndUpdateConfiguration(ConfigurationModuleType.User, current, undefined);
        this.__onConfigurationChange(change, ConfigurationModuleType.User);
    }

    private __onConfigurationChange(change: IRawConfigurationChangeEvent, type: ConfigurationModuleType): void {
        this.logService.trace(`[ConfigurationService] onConfigurationChange with type '${ConfigurationModuleTypeToString(type)}'.`);
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

/**
 * An interface only for {@link ConfigurationChangeEvent}.
 */
export interface IConfigurationChangeEvent {
    
    /**
     * The type of configuration module that has changed.
     */
    readonly type: ConfigurationModuleType;
    
    /**
     * The changed configuration property keys.
     */
    readonly properties: Set<Section>;
    
    /**
     * @description Check if the given section finds an exact match in the 
     * changing events.
     * @param section The given section.
     */
    affect(section: Section): boolean;

    /**
     * @description Check if the given section finds an exact match or find a 
     * child of the section in the changing events.
     * @param section The given section.
     */
    match(section: Section): boolean;
}

export class ConfigurationChangeEvent implements IConfigurationChangeEvent {

    // [fields]

    readonly properties = new Set<Section>();

    // [constructor]

    constructor(
        private readonly change: IRawConfigurationChangeEvent,
        public readonly type: ConfigurationModuleType,
    ) {
        for (const key of change.properties) {
			this.properties.add(key);
		}
    }

    // [public methods]

    public affect(section: Section): boolean {
        for (const key of this.change.properties) {
            if (section.startsWith(key)) {
                return true;
            }
        }
        return false;
    }

    public match(section: Section): boolean {
        return this.properties.has(section);
    }
}