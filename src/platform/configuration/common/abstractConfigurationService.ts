import { Disposable } from "src/base/common/dispose";
import { InitProtector, tryOrDefault } from "src/base/common/error";
import { AsyncResult, ok } from "src/base/common/result";
import { Emitter } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { IConfigurationRegistrant, IRawConfigurationChangeEvent } from "src/platform/configuration/common/configurationRegistrant";
import { ConfigurationHub } from "src/platform/configuration/common/configurationHub";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { DeepReadonly, Mutable } from "src/base/common/utilities/type";
import { ConfigurationModuleType, ConfigurationModuleTypeToString, IConfigurationService, IConfigurationServiceOptions, IConfigurationUpdateOptions, Section } from "src/platform/configuration/common/configuration";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { DefaultConfiguration } from "src/platform/configuration/common/configurationModules/defaultConfiguration";
import { UserConfiguration } from "src/platform/configuration/common/configurationModules/userConfiguration";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";

export abstract class AbstractConfigurationService extends Disposable implements IConfigurationService {

    declare _serviceMarker: undefined;

    // [fields]

    protected readonly _registrant: IConfigurationRegistrant;

    protected readonly _initProtector: InitProtector;

    protected readonly _defaultConfiguration: DefaultConfiguration;
    protected readonly _userConfiguration: UserConfiguration;

    protected readonly _configurationHub: ConfigurationHub;

    // [event]

    protected readonly _onDidConfigurationChange = this.__register(new Emitter<IConfigurationChangeEvent>());
    public readonly onDidConfigurationChange = this._onDidConfigurationChange.registerListener;

    // [constructor]

    constructor(
        protected readonly options: IConfigurationServiceOptions,
        @IInstantiationService protected readonly instantiationService: IInstantiationService,
        @ILogService protected readonly logService: ILogService,
        @IRegistrantService private readonly registrantService: IRegistrantService,
    ) {
        super();
        this.logService.debug('ConfigurationService', 'Constructing...');

        // initialization
        {
            this._registrant = this.registrantService.getRegistrant(RegistrantType.Configuration);

            this._initProtector = new InitProtector();

            this.logService.debug('ConfigurationService', 'Constructing `DefaultConfiguration`...');
            this._defaultConfiguration = this.instantiationService.createInstance(DefaultConfiguration);
            
            this.logService.debug('ConfigurationService', 'Constructing `UserConfiguration`...');
            this._userConfiguration = this.instantiationService.createInstance(UserConfiguration, this.appConfigurationPath);

            this._configurationHub = this.__reloadConfigurationHub();
        }

        // register listeners
        {
            // default configuration self reload
            this.__register(this._defaultConfiguration.onDidConfigurationChange(e => this.__onDefaultConfigurationChange(e)));
            
            // catch configuration registration errors and log out
            this.__register(this._registrant.onErrorRegistration(e => logService.warn('ConfigurationService', 'The configuration registration fails.', { event: e })));
            
            // user configuration self reload
            this.__register(this._userConfiguration.onDidConfigurationChange(() => this.__onUserConfigurationChange()));

        }
    }

    // [public methods]

    get isInit(): boolean {
        return this._initProtector.isInit;
    }

    get appConfigurationPath(): URI {
        return this.options.appConfiguration.path;
    }

    public init(): AsyncResult<void, Error> {
        
        return this._initProtector.init('cannot be initialized twice.')
        .toAsync()
        
        // configuration initialization
        .andThen(() => {
            this.logService.debug('ConfigurationService', `initializing at '${URI.toString(this.options.appConfiguration.path, true)}'...`);

            return this._defaultConfiguration.init()
                .toAsync()
                .andThen(() => this._userConfiguration.init());
        })
        /**
         * After configurations are initialized, we need to reload it to make 
         * sure everything is updated.
         */
        .andThen(() => {
            (<Mutable<ConfigurationHub>>this._configurationHub) = this.__reloadConfigurationHub();
            this.logService.debug('ConfigurationService', 'initialized successfully.');
            return ok();
        });
    }

    public get<T>(section: Section | undefined, defaultValue?: T): DeepReadonly<T> {
        return tryOrDefault<any>(defaultValue ?? undefined!, () => this._configurationHub.get(section));
    }

    // [abstract methods]

    public abstract set(section: Section, value: any, options?: IConfigurationUpdateOptions): Promise<void>;
    public abstract delete(section: Section, options?: IConfigurationUpdateOptions): Promise<void>;
    public abstract save(): AsyncResult<void, Error>;

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

    protected __onConfigurationChange(change: IRawConfigurationChangeEvent, type: ConfigurationModuleType): void {
        this.logService.debug('ConfigurationService', `Configuration changes. Details:`, { type: ConfigurationModuleTypeToString(type), configurationKeys: change.properties });
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
     * 
     * @example
     * // changed properties: ['section1.section2']
     * // match('section1') => false
     * // match('section1.section2') => true
     * // match('section1.section2.section3') => false
     */
    match(section: Section): boolean;

    /**
     * @description Check if the given section finds an exact match or find a 
     * parent of the section in the changing events.
     * @param section The given section.
     * 
     * @example
     * // changed properties: ['section1.section2']
     * // match('section1') => false
     * // match('section1.section2') => true
     * // match('section1.section2.section3') => true
     */
    affect(section: Section): boolean;
}

export class ConfigurationChangeEvent implements IConfigurationChangeEvent {

    // [fields]

    public readonly properties = new Set<Section>();

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