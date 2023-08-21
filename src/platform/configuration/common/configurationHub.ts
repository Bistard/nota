import { Disposable, IDisposable } from "src/base/common/dispose";
import { InitProtector, tryOrDefault } from "src/base/common/error";
import { Emitter, Event } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { IJsonSchemaValidateResult, JsonSchemaValidator } from "src/base/common/json";
import { ILogService } from "src/base/common/logger";
import { mixin, strictEquals } from "src/base/common/util/object";
import { DeepReadonly, Dictionary } from "src/base/common/util/type";
import { IRawConfigurationChangeEvent, IConfigurationRegistrant, IConfigurationSchema, IRawSetConfigurationChangeEvent } from "src/platform/configuration/common/configurationRegistrant";
import { ConfigurationStorage, IConfigurationStorage } from "src/platform/configuration/common/configurationStorage";
import { IFileService } from "src/platform/files/common/fileService";
import { REGISTRANTS } from "src/platform/registrant/common/registrant";
import { ConfigurationModuleType, IComposedConfiguration, IConfigurationCompareResult, IConfigurationModule, IDefaultConfigurationModule, IUserConfigurationModule, Section } from "src/platform/configuration/common/configuration";
import { UnbufferedScheduler } from "src/base/common/util/async";
import { errorToMessage } from "src/base/common/error";

const Registrant = REGISTRANTS.get(IConfigurationRegistrant);

/**
 * @class A {@link DefaultConfiguration} is a class representing the default 
 * configuration of the application. It derives the default configurations from
 * the {@link IConfigurationRegistrant}.
 * 
 * @note Has type {@link ConfigurationModuleType.Default}.
 * @note After the initialization of the module, it will automatically keep 
 * itself updated in response to any changes in the schema registrations of 
 * {@link IConfigurationRegistrant}. 
 */
export class DefaultConfiguration extends Disposable implements IDefaultConfigurationModule {

    // [fields]

    public readonly type = ConfigurationModuleType.Default;

    private _storage: IConfigurationStorage;
    private readonly _initProtector: InitProtector;

    // [events]

    private readonly _onDidConfigurationChange = this.__register(new Emitter<IRawConfigurationChangeEvent>());
    public readonly onDidConfigurationChange = this._onDidConfigurationChange.registerListener;

    // [constructor]

    constructor() {
        super();
        this._storage = this.__register(new ConfigurationStorage());
        this._initProtector = new InitProtector();
    }

    // [public methods]

    public getConfiguration(): IConfigurationStorage {
        return this._storage;
    }

    public init(): void {
        this._initProtector.init('[DefaultConfiguration] Cannot initialize twice.');
        this.__resetDefaultConfigurations();
        this.__register(Registrant.onDidConfigurationChange(e => this.__onRegistrantConfigurationChange(e)));
    }

    public reload(): void {
        this.__resetDefaultConfigurations();
    }

    // [private helper methods]

    private __resetDefaultConfigurations(): void {
        this._storage = new ConfigurationStorage();
        const schemas = Registrant.getConfigurationSchemas();
        this.__updateDefaultConfigurations(Object.keys(schemas), schemas);
    }

    private __onRegistrantConfigurationChange(e: IRawSetConfigurationChangeEvent): void {
        const properties = Array.from(e.properties);
        this.__updateDefaultConfigurations(properties, Registrant.getConfigurationSchemas());
        this._onDidConfigurationChange.fire({ properties: properties });
    }

    private __updateDefaultConfigurations(keys: string[], schemas: Dictionary<string, IConfigurationSchema>): void {
        for (const key of keys) {
            const schema = schemas[key];

            if (schema) {
                /** Make sure do not override the original value. */
                const originalValue = tryOrDefault(undefined, () => this._storage.get(key));

                /** Set default value for 'null'. */
                const newValue = mixin(originalValue, schema.type === 'null' ? null : schema.default, true);
                this._storage.set(key, newValue);
            } else {
                this._storage.delete(key);
            }
        }
    }
}

/**
 * @class A {@link UserConfiguration} represents the user configuration that 
 * will be treated as overrides to {@link DefaultConfiguration}. It obtains the
 * configuration by reading files from the disk.
 * 
 * @note Has type {@link ConfigurationModuleType.User}.
 * @note After the initialization of the module, it will automatically keep 
 * itself updated in response to any changes in the corresponding files from the
 * disk.
 */
export class UserConfiguration extends Disposable implements IUserConfigurationModule {

    // [fields]

    public readonly type = ConfigurationModuleType.User;

    private readonly _initProtector: InitProtector;

    private readonly _userResource: URI;
    private readonly _validator: UserConfigurationValidator;

    private _configuration: IConfigurationStorage;

    // [event]

    private readonly _onDidConfigurationChange = this.__register(new Emitter<void>());
    public readonly onDidConfigurationChange = this._onDidConfigurationChange.registerListener;

    // [constructor]

    constructor(
        userResource: URI,
        private readonly fileService: IFileService,
        private readonly logService: ILogService,
    ) {
        super();
        this._initProtector = new InitProtector();

        this._userResource = userResource;
        this._configuration = new ConfigurationStorage();
        this._validator = this.__register(new UserConfigurationValidator());

        // register listeners
        {
            this.__register(this._validator.onUnknownConfiguration(unknownKey => this.logService.warn(`[UserConfiguration] Cannot identify the configuration: '${unknownKey}' from the source '${URI.toString(this._userResource, true)}'.`)));
            this.__register(this._validator.onInvalidConfiguration(result => this.logService.warn(`[UserConfiguration] encounter invalid configuration: ${result}.`)));

            // configuration updation
            this.__register(this.fileService.watch(userResource));
            Event.filter(this.fileService.onDidResourceChange, e => e.wrap().match(userResource))(() => reloadScheduler.schedule());

            const reloadScheduler = this.__register(new UnbufferedScheduler<void>(
                100, // wait for a moment to avoid excessive reloading
                async () => {
                    await this.reload();
                    this._onDidConfigurationChange.fire();
                },
            ));
        }
    }

    // [public methods]

    public getConfiguration(): IConfigurationStorage {
        return this._configuration;
    }

    public async init(): Promise<void> {
        this._initProtector.init('[UserConfiguration] Cannot initialize twice.');
        return this.__loadConfiguration();
    }

    public async reload(): Promise<void> {
        return this.__loadConfiguration();
    }

    // [private helper methods]

    private async __loadConfiguration(): Promise<void> {

        let raw: string;
        try {
            raw = (await this.fileService.readFile(this._userResource)).toString();
        } catch (err) {
            throw new Error(`[UserConfiguration] Cannot load configuration at '${URI.toString(this._userResource, true)}'.\nThe cause is: ${errorToMessage(err)}`);
        }

        const unvalidated = tryOrDefault<object>(
            {},
            () => JSON.parse(raw),
            () => this.logService.error(`Cannot initialize user configuration at '${URI.toString(this._userResource, true)}'`),
        );

        const validated = this._validator.validate(unvalidated);
        this._configuration = new ConfigurationStorage(Object.keys(validated), validated);
    }
}

class UserConfigurationValidator implements IDisposable {

    // [fields]

    private readonly _onUnknownConfiguration = new Emitter<string>();
    public readonly onUnknownConfiguration = this._onUnknownConfiguration.registerListener;

    private readonly _onInvalidConfiguration = new Emitter<IJsonSchemaValidateResult>();
    public readonly onInvalidConfiguration = this._onInvalidConfiguration.registerListener;

    // [constructor]

    constructor() { }

    // [public methods]

    public validate(rawConfiguration: object): object {
        const schemas = Registrant.getConfigurationSchemas();
        const validatedConfiguration = this.__validate(rawConfiguration, schemas);
        return validatedConfiguration;
    }

    public dispose(): void {
        this._onUnknownConfiguration.dispose();
    }

    // [private helper methods]

    private __validate(rawConfiguration: object, schemas: Dictionary<string, IConfigurationSchema>): object {
        const validated: object = {};

        for (const key in rawConfiguration) {
            const value = rawConfiguration[key];
            const schema = schemas[key];

            if (!schema) {
                this._onUnknownConfiguration.fire(key);
                continue;
            }

            const result = JsonSchemaValidator.validate(value, schema);
            if (!result.valid) {
                this._onInvalidConfiguration.fire(result);
                continue;
            }

            validated[key] = value;
        }

        return validated;
    }
}

interface IConfigurationHubBase {

    inspect(): IComposedConfiguration;

    /**
     * @description Replace the reference to a {@link IConfigurationStorage} 
     * with a new one based on the specified module type.
     * @param type The type of the module that needs to be updated.
     * @param newConfiguration The reference to the new configuration.
     */
    updateConfiguration(type: ConfigurationModuleType, newConfiguration: IConfigurationStorage): void;

    /**
     * @description An enhanced version of '{@link updateConfiguration}' that 
     * compares the existing and new configuration modules and returns the 
     * comparison result.
     * @param type The type of the module that needs to be updated.
     * @param newConfiguration The new configuration reference.
     * @param changedKeys This parameter is provided if the client already knows 
     * the comparison result.
     */
    compareAndUpdateConfiguration(type: ConfigurationModuleType, newConfiguration: IConfigurationStorage, changedKeys: Section[] | undefined): IRawConfigurationChangeEvent;
}

class ConfigurationHubBase implements IConfigurationHubBase {

    // [fields]

    private _composedConfiguration?: IConfigurationStorage;
    private readonly _configurationMapping: Dictionary<ConfigurationModuleType, string>;

    // [constructor]

    constructor(
        protected _defaultConfiguration: IConfigurationStorage,
        protected _userConfiguration: IConfigurationStorage,
        protected _memoryConfiguration: IConfigurationStorage = new ConfigurationStorage(),
    ) {
        this._composedConfiguration = undefined;
        this._configurationMapping = {
            [ConfigurationModuleType.Default]: '_defaultConfiguration',
            [ConfigurationModuleType.User]: '_userConfiguration',
            [ConfigurationModuleType.Memory]: '_memoryConfiguration',
        };
    }

    // [public methods]

    public inspect(): IComposedConfiguration {
        return {
            default: this._defaultConfiguration,
            user: this._userConfiguration,
        };
    }

    // [public update methods]

    public updateConfiguration(type: ConfigurationModuleType, newConfiguration: IConfigurationStorage): void {
        const configuration = this.__getConfigurationWithType(type);
        this[configuration] = newConfiguration;
        this.__dropComposedConfiguration();
    }

    public compareAndUpdateConfiguration(type: ConfigurationModuleType, newConfiguration: IConfigurationStorage, changedKeys?: Section[]): IRawConfigurationChangeEvent {

        // If we do not know what keys are changed, we need to find them by ourself.
        if (!changedKeys) {
            const configuration = this.__getConfigurationWithType(type);
            const { added, deleted, changed } = this.__compareConfiguration(this[configuration], newConfiguration);
            changedKeys = [...added, ...deleted, ...changed];
        }

        this.updateConfiguration(type, newConfiguration);
        return { properties: changedKeys };
    }

    // [protected helper methods]

    protected __getComposedConfiguration(): IConfigurationStorage {
        if (!this._composedConfiguration) {
            (this._composedConfiguration = this._defaultConfiguration.clone()).merge([this._userConfiguration, this._memoryConfiguration]);
        }
        return this._composedConfiguration;
    }

    protected __dropComposedConfiguration(): void {
        this._composedConfiguration = undefined;
    }

    // [private helper methods]

    private __getConfigurationWithType(type: ConfigurationModuleType): string {
        const configuration = this._configurationMapping[type];
        if (!configuration) {
            throw new Error(`Cannot find configuration with type '${type}'.`);
        }
        return configuration;
    }

    private __compareConfiguration(oldConfiguration: IConfigurationStorage, newConfiguration: IConfigurationStorage): IConfigurationCompareResult {
        const { sections: oldKeys } = oldConfiguration;
        const { sections: newKeys } = newConfiguration;


        const added = newKeys.filter(key => oldKeys.indexOf(key) === -1);
        const deleted = oldKeys.filter(key => newKeys.indexOf(key) === -1);

        const changed: string[] = [];
        for (const oldKey of oldKeys) {
            if (newKeys.indexOf(oldKey) !== -1) {
                const oldVal = oldConfiguration.get(oldKey);
                const newVal = newConfiguration.get(oldKey);
                if (!strictEquals(oldVal, newVal)) {
                    changed.push(oldKey);
                }
            }
        }

        return { added, deleted, changed };
    }
}

/**
 * An interface only for {@link ConfigurationHub}.
 */
export interface IConfigurationHub extends IConfigurationHubBase {

    /**
     * @description Fetch the configuration at the given {@link Section}.
     * @param section The provided {@link Section} of the configuration.
     * @returns A read-only configuration.
     * 
     * @throws An exception will be thrown if the section is invalid.
     * @note If section is not provided, the whole configuration will be returned.
     * @note Direct modifications to the return value are not permitted. Utilize 
     * `set` instead.
     */
    get<T>(section: Section | undefined): DeepReadonly<T>;

    setInMemory(section: Section, value: any): void;
    deleteInMemory(section: Section): void;
}

/**
 * @class A {@link ConfigurationHub} serves as the unified command center for a 
 * variety of configuration modules.  It encapsulates a collection of references 
 * to {@link IConfigurationStorage} instances. The hub provides convenient APIs 
 * for retrieving and modifying configurations across all configuration modules.
 */
export class ConfigurationHub extends ConfigurationHubBase implements IConfigurationHub {

    // [constructor]

    constructor(
        defaultConfiguration: IConfigurationStorage,
        userConfiguration: IConfigurationStorage,
        memoryConfiguration: IConfigurationStorage = new ConfigurationStorage(),
    ) {
        super(defaultConfiguration, userConfiguration, memoryConfiguration);
    }

    // [public methods]

    public get<T>(section: Section | undefined): DeepReadonly<T> {
        const configuration = this.__getComposedConfiguration();
        return configuration.get(section);
    }

    public setInMemory(section: Section, value: any): void {
        value = (value ?? null); // turn 'undefined' to 'null'
        this._memoryConfiguration.set(section, value);
        }
        this.__dropComposedConfiguration();
    }

    public deleteInMemory(section: Section): void {
        this.setInMemory(section, undefined);
    }
}
