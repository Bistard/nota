import { Emitter, Register, SignalEmitter } from "src/base/common/event";
import { IJsonSchema } from "src/base/common/json";
import { Arrays } from "src/base/common/util/array";
import { Dictionary } from "src/base/common/util/type";
import { createRegistrant, RegistrantType } from "src/code/platform/registrant/common/registrant";

export const IConfigRegistrant = createRegistrant<IConfigRegistrant>(RegistrantType.Configuration);

export type IConfigurationSchema = IJsonSchema & {

    scope?: ConfigurationScope;
}

export interface IConfigurationUnit {

    /**
     * The identifier of the configuration.
     */
    readonly id: string;

    /**
     * The description of the configuration.
     */
    readonly description?: string;

    /**
     * The configuration schemas.
     */
    readonly properties: Dictionary<string, IConfigurationSchema>;
}

export const enum ConfigurationScope {
    
    /**
     * The scope exclusive to program modifications.
     */
    Application = 'Application',
    
    /**
     * The scope permitting both program and user modifications.
     */
    User = 'User',

    /**
     * The scope allowing program, user, and third-party modifications.
     */
    Extension = 'Extension',
}

export interface IRawConfigChangeEvent {
    
    /**
     * Unique names of the configurations that are changed.
     */
    readonly properties: ReadonlySet<string>;
}

/**
 * An interface only for {@link ConfigRegistrant}.
 */
export interface IConfigRegistrant {
    
    /**
     * This event fires whenever a set of configurations has changed.
     */
    readonly onDidConfigurationChange: Register<IRawConfigChangeEvent>;

    /**
     * @description Registers default configuration(s).
     */
    registerConfigurations(configuration: IConfigurationUnit | IConfigurationUnit[]): void;

    /**
     * @description Unregisters default configuration(s).
     */
    unregisterConfigurations(configuration: IConfigurationUnit | IConfigurationUnit[]): void;

    /**
     * @description Updates the existing set of default configurations by adding 
     * and removing configurations.
     */
    updateConfigurations(configurations: { add: IConfigurationUnit[], remove: IConfigurationUnit[] }): void;

    /**
     * @description Returns all the registered configurations.
     */
    getConfigurations(): IConfigurationUnit[];

    /**
     * Returns all the configuration schemas.
     * @returns {Dictionary<string, IConfigurationSchema>} A dictionary containing all the configuration schemas.
     */
    getConfigurationSchemas(): Dictionary<string, IConfigurationSchema>;
}


/**
 * @class The {@link ConfigRegistrant} class is responsible for managing the 
 * registration of schema of configurations, but it doesn't directly handle the 
 * updating of configuration values. 
 * 
 * The actual values of configurations are managed by {@link ConfigurationService}.
 */
@IConfigRegistrant
class ConfigRegistrant implements IConfigRegistrant {

    // [event]

    private readonly _onDidConfigurationChange = new Emitter<IRawConfigChangeEvent>();
    public readonly onDidConfigurationChange = this._onDidConfigurationChange.registerListener;
    
    // [field]

    private readonly _registeredUnits: IConfigurationUnit[];
    
    private readonly _allConfigurations: Dictionary<string, IConfigurationSchema>;
    private readonly _applicationScopedConfigurations: Dictionary<string, IConfigurationSchema>;
    private readonly _userScopedConfigurations: Dictionary<string, IConfigurationSchema>;
    private readonly _extensionScopedConfigurations: Dictionary<string, IConfigurationSchema>;

    // [constructor]

    constructor() {
        this._onDidConfigurationChange = new SignalEmitter([], undefined!);

        this._registeredUnits = [];
        this._allConfigurations = {};
        this._applicationScopedConfigurations = {};
        this._userScopedConfigurations = {};
        this._extensionScopedConfigurations = {};
    }

    // [public methods]

    public registerConfigurations(configurations: IConfigurationUnit | IConfigurationUnit[]): void {
        const registered = new Set<string>();
        
        if (!Array.isArray(configurations)) {
            configurations = [configurations];
        }

        for (const configuration of configurations) {
            this.__registerConfiguration(configuration, registered, true);
        }

        this._onDidConfigurationChange.fire({ properties: registered });
    }

    public unregisterConfigurations(configurations: IConfigurationUnit | IConfigurationUnit[]): void {
        const unregistered = new Set<string>();

        if (!Array.isArray(configurations)) {
            configurations = [configurations];
        }

        for (const configuration of configurations) {
            this.__unregisterConfiguration(configuration, unregistered);
        }

        this._onDidConfigurationChange.fire({ properties: unregistered });
    }

    public updateConfigurations({ add, remove }: { add: IConfigurationUnit[]; remove: IConfigurationUnit[]; }): void {
        const changed = new Set<string>();

        for (const rm of remove) {
            this.__unregisterConfiguration(rm, changed);
        }

        for (const ad of add) {
            this.__registerConfiguration(ad, changed, false);
        }

        this._onDidConfigurationChange.fire({ properties: changed });
    }

    public getConfigurations(): IConfigurationUnit[] {
        return this._registeredUnits;
    }

    public getConfigurationSchemas(): Dictionary<string, IConfigurationSchema> {
        return this._allConfigurations;
    }

    // [private helper methods]

    private __registerConfiguration(configuration: IConfigurationUnit, bucket: Set<string>, validate: boolean = true): void {
        this.__validateAndRegisterConfiguration(configuration, bucket, validate);
        this._registeredUnits.push(configuration);
        this.__registerScopedConfiguration(configuration);
    }

    private __validateAndRegisterConfiguration(configuration: IConfigurationUnit, bucket: Set<string>, validate: boolean): void {
        const schemas = configuration.properties;
        for (const key in schemas) {
            const schema = schemas[key]!;

            // invalidate schema, should not be registered.
            if (validate && this.__validateSchema(schema) === false) {
                delete schemas[key];
                continue;
            }

            // actual register
            this._allConfigurations[key] = schema;
            bucket.add(key);
        }
    }

    private __registerScopedConfiguration(configuration: IConfigurationUnit): void {
        const schemas = configuration.properties;
        if (schemas) {
            for (const key in schemas) {
                const schema = schemas[key]!;
                this.__registerScopedSchema(key, schema);
            }
        }
    }

    private __registerScopedSchema(key: string, schema: IConfigurationSchema): void {
        switch (schema.scope) {
			case ConfigurationScope.Application:
				this._applicationScopedConfigurations[key] = schema;
				break;
			case ConfigurationScope.User:
				this._userScopedConfigurations[key] = schema;
				break;
			case ConfigurationScope.Extension:
				this._extensionScopedConfigurations[key] = schema;
				break;
		}
    }

    private __unregisterScopedSchema(key: string, scope?: ConfigurationScope): void {
        switch (scope) {
			case ConfigurationScope.Application:
				delete this._applicationScopedConfigurations[key];
				break;
			case ConfigurationScope.User:
				delete this._userScopedConfigurations[key];
				break;
			case ConfigurationScope.Extension:
				delete this._extensionScopedConfigurations[key];
				break;
		}
    }

    private __validateSchema(schema: IConfigurationSchema): boolean {
        // noop for now
        return true;
    }

    private __unregisterConfiguration(configuration: IConfigurationUnit, bucket: Set<string>): void {
        const schemas = configuration.properties;
        
        for (const key in schemas) {
            delete this._allConfigurations[key];
            this.__unregisterScopedSchema(key, configuration.properties[key]?.scope);
            bucket.add(key);
        }

        Arrays.remove(this._registeredUnits, configuration);
    }
}