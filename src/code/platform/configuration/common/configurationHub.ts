import { Disposable, IDisposable } from "src/base/common/dispose";
import { tryOrDefault } from "src/base/common/error";
import { Emitter, Event } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { IJsonSchemaValidateResult, JsonSchemaValidator } from "src/base/common/json";
import { ILogService } from "src/base/common/logger";
import { mixin, strictEquals } from "src/base/common/util/object";
import { Dictionary } from "src/base/common/util/type";
import { IRawConfigurationChangeEvent, IConfigurationRegistrant, IConfigurationSchema, IRawSetConfigurationChangeEvent } from "src/code/platform/configuration/common/configurationRegistrant";
import { ConfigStorage, IConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { IFileService } from "src/code/platform/files/common/fileService";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";
import { IComposedConfiguration, IConfigurationCompareResult } from "src/code/platform/configuration/common/configuration";

const Registrant = REGISTRANTS.get(IConfigurationRegistrant);

/**
 * A list of different types of configurations that are stored inside 
 * {@link ConfigurationHub}.
 */
export const enum ConfigurationType {
    Default = 1,
    User,
}

export interface IConfiguration {
    // TODO
}

export class DefaultConfiguration extends Disposable implements IConfiguration {

    // [fields]

    private _storage: IConfigStorage;
    private _initialized: boolean;

    // [events]

    private readonly _onDidConfigurationChange = this.__register(new Emitter<IRawConfigurationChangeEvent>());
    public readonly onDidConfigurationChange = this._onDidConfigurationChange.registerListener;

    // [constructor]

    constructor() {
        super();
        this._storage = this.__register(new ConfigStorage());
        this._initialized = false;
    }

    // [public methods]

    get configuration(): IConfigStorage {
        return this._storage;
    }

    public init(): void {
        if (this._initialized) {
            throw new Error('Cannot initialize DefaultConfiguration twice.');
        }
        this._initialized = true;
        this.__resetConfigurations();
        this.__register(Registrant.onDidConfigurationChange(e => this.__onRegistrantConfigurationChange(e)));
    }

    public reload(): void {
        this.__resetConfigurations();
    }

    // [private helper methods]

    private __resetConfigurations(): void {
        this._storage = new ConfigStorage();
        const schemas = Registrant.getConfigurationSchemas();
        this.__updateConfigurations(Object.keys(schemas), schemas);
    }
    
    private __onRegistrantConfigurationChange(e: IRawSetConfigurationChangeEvent): void {
        const properties = Array.from(e.properties);
        this.__updateConfigurations(properties, Registrant.getConfigurationSchemas());
        this._onDidConfigurationChange.fire({ properties: properties });
    }

    private __updateConfigurations(keys: string[], schemas: Dictionary<string, IConfigurationSchema>): void {
        for (const key of keys) {
            const schema = schemas[key];
            
            if (schema) {
                // Make sure do not override the original value.
                const originalValue = tryOrDefault(undefined, () => this._storage.get(key));
                this._storage.set(key, mixin(originalValue, schema.default, true));
            } else {
                this._storage.delete(key);
            }
        }
    }
}

export class UserConfiguration extends Disposable implements IConfiguration {
    
    // [fields]

    private _initialized: boolean;

    private readonly _userResource: URI;
    private readonly _validator: UserConfigurationValidator;
    
    private _configuration: IConfigStorage;

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
        this._initialized = false;
        
        this._userResource = userResource;
        this._configuration = new ConfigStorage();
        this._validator = this.__register(new UserConfigurationValidator());
        
        // register listeners
        {
            this.__register(this._validator.onUnknownConfiguration(unknownKey => this.logService.warn(`Cannot identify the configuration: '${unknownKey}' a '${URI.toString(this._userResource)}'`)));
            this.__register(this._validator.onInvalidConfiguration(result => {
                // TODO
            }));

            // configuration updation
            this.__register(this.fileService.watch(userResource));
            Event.filter(this.fileService.onDidResourceChange, e => e.wrap().match(userResource))(() => this._onDidConfigurationChange.fire());
        }
    }

    // [public methods]

    get configuration(): IConfigStorage {
        return this._configuration;
    }

    public async init(): Promise<void> {
        if (this._initialized) {
            throw new Error('Cannot initialize DefaultConfiguration twice.');
        }
        this._initialized = true;
        return this.__loadConfiguration();
    }

    public async reload(): Promise<void> {
        return this.__loadConfiguration();
    }

    // [private helper methods]

    private async __loadConfiguration(): Promise<void> {
        const raw = (await this.fileService.readFile(this._userResource)).toString();

        const unvalidated = tryOrDefault<object>(
            {}, 
            () => JSON.parse(raw), 
            () => this.logService.error(`Cannot initialize user configuration at '${URI.toString(this._userResource)}'`),
        );
        
        const validated = this._validator.validate(unvalidated);
        this._configuration = new ConfigStorage(undefined, validated);
    }
}

export class UserConfigurationValidator implements IDisposable {

    // [fields]

    private readonly _onUnknownConfiguration = new Emitter<string>();
    public readonly onUnknownConfiguration = this._onUnknownConfiguration.registerListener;

    private readonly _onInvalidConfiguration = new Emitter<IJsonSchemaValidateResult>();
    public readonly onInvalidConfiguration = this._onInvalidConfiguration.registerListener;

    // [constructor]

    constructor() {}

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

class ConfigurationHubBase {

    // [fields]

    private _composedConfiguration?: IConfigStorage;
    private readonly _configurationMapping: Dictionary<ConfigurationType, string>;

    // [constructor]

    constructor(
        protected _defaultConfiguration: IConfigStorage,
        protected _userConfiguration: IConfigStorage,
        protected _memoryConfiguration: IConfigStorage = new ConfigStorage(),
    ) {
        this._composedConfiguration = undefined;
        this._configurationMapping = {
            [ConfigurationType.Default]: '_defaultConfiguration',
            [ConfigurationType.User]: '_userConfiguration',
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

    public updateConfiguration(type: ConfigurationType, newConfiguration: IConfigStorage): void {
        const configuration = this.__getConfigurationWithType(type);
        this[configuration] = newConfiguration;
        this.__dropComposedConfiguration();
    }

    public compareAndUpdateConfiguration(type: ConfigurationType, newConfiguration: IConfigStorage, changedKeys: string[] | undefined): IRawConfigurationChangeEvent {
        
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

    protected __getComposedConfiguration(): IConfigStorage {
        if (!this._composedConfiguration) {
            (this._composedConfiguration = this._defaultConfiguration.clone()).merge([this._userConfiguration, this._memoryConfiguration]);
        }
        return this._composedConfiguration;
    }

    protected __dropComposedConfiguration(): void {
        this._composedConfiguration = undefined;
    }

    // [private helper methods]

    private __getConfigurationWithType(type: ConfigurationType): string {
        const configuration = this._configurationMapping[type];
        if (!configuration) {
            throw new Error(`Cannot find configuration with type '${type}'.`);
        }
        return configuration;
    }

    private __compareConfiguration(oldConfiguration: IConfigStorage, newConfiguration: IConfigStorage): IConfigurationCompareResult {
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
 * // TODO
 */
export interface IConfigurationHub {
    get<T>(section: string | undefined): T;
    set(section: string, value: any): void;
    delete(section: string): void;
    inspect(): IComposedConfiguration;
    updateConfiguration(type: ConfigurationType, newConfiguration: IConfigStorage): void;
    compareAndUpdateConfiguration(type: ConfigurationType, newConfiguration: IConfigStorage, changedKeys: string[] | undefined): IRawConfigurationChangeEvent;
}

export class ConfigurationHub extends ConfigurationHubBase implements IConfigurationHub {

    // [constructor]

    constructor(
        defaultConfiguration: IConfigStorage,
        userConfiguration: IConfigStorage,
        memoryConfiguration: IConfigStorage = new ConfigStorage(),
    ) {
        super(defaultConfiguration, userConfiguration, memoryConfiguration);
    }

    // [public methods]

    public get<T>(section: string | undefined): T {
        const configuration = this.__getComposedConfiguration();
        return configuration.get(section);
    }

    public set(section: string, value: any): void {
        if (value === undefined) {
            this._memoryConfiguration.delete(section);
        } else {
            this._memoryConfiguration.set(section, value);
        }
        this.__dropComposedConfiguration();
    }

    public delete(section: string): void {
        this.set(section, undefined);
    }
}
