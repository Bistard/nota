import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { IJsonSchema } from "src/base/common/json";
import { Arrays } from "src/base/common/utilities/array";
import { panic } from "src/base/common/utilities/panic";
import { Dictionary, isObject } from "src/base/common/utilities/type";
import { Section } from "src/platform/configuration/common/configuration";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";
import { sharedApplicationConfigurationRegister, sharedEditorConfigurationRegister, sharedNavigationViewConfigurationRegister, sharedWorkbenchConfigurationRegister, sharedWorkspaceConfigurationRegister } from "src/workbench/services/workbench/configuration.register";

export type IConfigurationSchema = IJsonSchema & {

    scope?: ConfigurationScope;
};

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

export interface IRawSetConfigurationChangeEvent {

    /**
     * Unique names of the configurations that are changed.
     */
    readonly properties: ReadonlySet<Section>;
}

export interface IRawConfigurationChangeEvent {

    /**
     * Names of the configurations that are changed.
     */
    readonly properties: Section[];
}

export interface IConfigurationRegisterErrorEvent {

    /**
     * The error message.
     */
    readonly message: string;

    /**
     * The error schema.
     */
    readonly schema: IConfigurationSchema;
}

/**
 * An interface only for {@link ConfigurationRegistrant}.
 */
export interface IConfigurationRegistrant extends IRegistrant<RegistrantType.Configuration> {

    /**
     * This event fires whenever a set of configurations has changed.
     * 
     * @note When registering an array of {@link IConfigurationUnit}, this event 
     * will only fires once.
     */
    readonly onDidConfigurationChange: Register<IRawSetConfigurationChangeEvent>;

    /**
     * The event fires whenever a key of from the incoming {@link IConfigurationUnit}
     * encounters an error.
     * 
     * @note The key from that unit will be omitted, but the unit will still
     * be registered.
     */
    readonly onErrorRegistration: Register<IConfigurationRegisterErrorEvent>;

    /**
     * @description Registers default configuration(s).
     * 
     * @note Might modify the provided configuration unit.
     * @note Any keys that encounters an error when registering will be removed.
     * But the unit will still be registered.
     */
    registerConfigurations(configuration: IConfigurationUnit | IConfigurationUnit[]): void;

    /**
     * @description Unregister default configuration(s).
     */
    unregisterConfigurations(configuration: IConfigurationUnit | IConfigurationUnit[]): void;

    // TODO: registerOverrideConfiguration()
    // TODO: unregisterOverrideConfiguration()
    // TODO: getOverrideConfigurations()

    /**
     * @description Updates the existing set of default configurations by adding 
     * and removing configurations.
     */
    updateConfigurations(configurations: { add: IConfigurationUnit[], remove: IConfigurationUnit[]; }): void;

    /**
     * @description Returns all the registered configuration units.
     */
    getConfigurationUnits(): IConfigurationUnit[];

    /**
     * Returns all the configuration schemas.
     * @returns {Dictionary<string, IConfigurationSchema>} A dictionary containing all the configuration schemas.
     */
    getConfigurationSchemas(): Dictionary<string, IConfigurationSchema>;
}


/**
 * @class The {@link ConfigurationRegistrant} class is responsible for managing the 
 * registration of schema of configurations, but it doesn't directly handle the 
 * updating of configuration values. 
 * 
 * The actual values of configurations are managed by {@link ConfigurationService}.
 */
export class ConfigurationRegistrant extends Disposable implements IConfigurationRegistrant {

    public readonly type = RegistrantType.Configuration;

    // [event]

    private readonly _onDidConfigurationChange = this.__register(new Emitter<IRawSetConfigurationChangeEvent>());
    public readonly onDidConfigurationChange = this._onDidConfigurationChange.registerListener;

    private readonly _onErrorRegistration = this.__register(new Emitter<IConfigurationRegisterErrorEvent>());
    public readonly onErrorRegistration = this._onErrorRegistration.registerListener;

    // [field]

    private readonly _registeredUnits: IConfigurationUnit[];

    private readonly _allConfigurations: Dictionary<string, IConfigurationSchema>;
    private readonly _applicationScopedConfigurations: Dictionary<string, IConfigurationSchema>;
    private readonly _userScopedConfigurations: Dictionary<string, IConfigurationSchema>;
    private readonly _extensionScopedConfigurations: Dictionary<string, IConfigurationSchema>;

    // [constructor]

    constructor() {
        super();
        this._registeredUnits = [];
        this._allConfigurations = {};
        this._applicationScopedConfigurations = {};
        this._userScopedConfigurations = {};
        this._extensionScopedConfigurations = {};
    }

    // [public methods]

    public initRegistrations(provider: IServiceProvider): void {
        
        /**
         * Since the {@link ConfigurationRegistrant} is constructed in both main
         * and renderer process. Do not register here unless it is shared in 
         * both processes.
         */
        [
            sharedApplicationConfigurationRegister,
            sharedWorkbenchConfigurationRegister,
            sharedNavigationViewConfigurationRegister,
            sharedWorkspaceConfigurationRegister,
            sharedEditorConfigurationRegister,
        ]
        .forEach(register => register(provider));
    }

    public registerConfigurations(configurations: IConfigurationUnit | IConfigurationUnit[]): void {
        const registered = new Set<string>();

        if (!Array.isArray(configurations)) {
            configurations = [configurations];
        }

        if (Arrays.matchAny(this._registeredUnits, configurations, (registered, toBeRegistered) => registered === toBeRegistered)) {
            panic('[ConfigurationRegistrant] Cannot register configuration unit that is already registered.');
        }

        for (const configuration of configurations) {
            this.__registerConfiguration(configuration, registered, true);
        }

        if (registered.size > 0) {
            this._onDidConfigurationChange.fire({ properties: registered });
        }
    }

    public unregisterConfigurations(configurations: IConfigurationUnit | IConfigurationUnit[]): void {
        const unregistered = new Set<string>();

        if (!Array.isArray(configurations)) {
            configurations = [configurations];
        }

        for (const configuration of configurations) {
            this.__unregisterConfiguration(configuration, unregistered);
        }

        if (unregistered.size > 0) {
            this._onDidConfigurationChange.fire({ properties: unregistered });
        }
    }

    public updateConfigurations({ add, remove }: { add: IConfigurationUnit[]; remove: IConfigurationUnit[]; }): void {
        const changed = new Set<string>();

        for (const rm of remove) {
            this.__unregisterConfiguration(rm, changed);
        }

        for (const ad of add) {
            this.__registerConfiguration(ad, changed, false);
        }

        if (changed.size > 0) {
            this._onDidConfigurationChange.fire({ properties: changed });
        }
    }

    public getConfigurationUnits(): IConfigurationUnit[] {
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
            if (validate) {
                const validateMessage = this.__validateRegistration(key, schema);
                if (validateMessage) {
                    delete schemas[key];
                    this._onErrorRegistration.fire({ message: validateMessage, schema: schema });
                    continue;
                }
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

    private __validateRegistration(key: string, schema: IConfigurationSchema): string {

        // cannot register an empty property
        if (!key.trim()) {
            return 'Cannot register an empty property';
        }

        // cannot register duplicate properties
        if (this.getConfigurationSchemas()[key] !== undefined) {
            return `Cannot register the schema with id '${schema.id ?? '[unknown]'}', the property name '${key}' is already registered.`;
        }

        // type check: default value
        const defaultTypeCheck = (schema: IConfigurationSchema): string => {

            // ignore: null or default value not provided
            if (schema.type === 'null' || schema.default === undefined) {
                schema.default = undefined;
                return '';
            }

            if (schema.default instanceof RegExp || schema.default instanceof Date) {
                return `The type of the default value cannot be RegExp or Date.`;
            }

            const defaultType = typeof schema.default;

            // wrong match
            if (['bigint', 'function', 'symbol'].includes(defaultType)) {
                return `The type of the default value '${defaultType}' does not match the schema type '${schema.type}'.`;
            }

            // match: array and object
            if (defaultType === 'object') {
                if (!((schema.type === 'array' && Array.isArray(schema.default)) || (schema.type === 'object' && isObject(schema.default)))) {
                    return `The type of the default value '${defaultType}' does not match the schema type '${schema.type}'.`;
                }
            }

            // match: number, string, boolean
            else if (defaultType !== schema.type) {
                return `The type of the default value '${defaultType}' does not match the schema type '${schema.type}'.`;
            }

            // recursive match: object
            if (schema.type === 'object' && schema.properties) {
                for (const child of Object.values(schema.properties)) {
                    const errorMessage = defaultTypeCheck(child);
                    if (errorMessage) {
                        return errorMessage;
                    }
                }
            }

            // recursive match: array
            else if (schema.type === 'array') {
                if (!schema.items) {
                    return '';
                }

                if (!Array.isArray(schema.items)) {
                    return defaultTypeCheck(schema.items);
                }

                for (const child of schema.items) {
                    const errorMessage = defaultTypeCheck(child);
                    if (errorMessage) {
                        return errorMessage;
                    }
                }
            }

            return '';
        };

        const errorMessage = defaultTypeCheck(schema);
        if (errorMessage) {
            return errorMessage;
        }

        return '';
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