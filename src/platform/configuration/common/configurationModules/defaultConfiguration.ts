import { Disposable } from "src/base/common/dispose";
import { InitProtector, tryOrDefault } from "src/base/common/error";
import { Emitter } from "src/base/common/event";
import { mixin } from "src/base/common/util/object";
import { Dictionary } from "src/base/common/util/type";
import { IDefaultConfigurationModule, ConfigurationModuleType } from "src/platform/configuration/common/configuration";
import { IConfigurationRegistrant, IRawConfigurationChangeEvent, IRawSetConfigurationChangeEvent, IConfigurationSchema } from "src/platform/configuration/common/configurationRegistrant";
import { IConfigurationStorage, ConfigurationStorage } from "src/platform/configuration/common/configurationStorage";
import { REGISTRANTS } from "src/platform/registrant/common/registrant";

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
        this._storage = DefaultConfiguration.createDefaultConfigurationStorage();
        this.__register(Registrant.onDidConfigurationChange(e => this.__onRegistrantConfigurationChange(e)));
    }

    public reload(): void {
        this._storage = DefaultConfiguration.createDefaultConfigurationStorage();
    }

    // [private methods]

    private __onRegistrantConfigurationChange(e: IRawSetConfigurationChangeEvent): void {
        const properties = Array.from(e.properties);
        DefaultConfiguration.__updateDefaultConfigurations(this._storage, properties, Registrant.getConfigurationSchemas());
        this._onDidConfigurationChange.fire({ properties: properties });
    }

    // [static methods]

    /**
     * @description Create a new {@link IConfigurationStorage} that 
     * @returns 
     */
    public static createDefaultConfigurationStorage(): IConfigurationStorage {
        const storage = new ConfigurationStorage();
        const schemas = Registrant.getConfigurationSchemas();
        this.__updateDefaultConfigurations(storage, Object.keys(schemas), schemas);
        return storage;
    }

    private static __updateDefaultConfigurations(storage: IConfigurationStorage, keysForUpdate: string[], schemas: Dictionary<string, IConfigurationSchema>): void {
        for (const key of keysForUpdate) {
            const schema = schemas[key];

            // make sure the new key has corresponding schema
            if (schema) {
                // Make sure do not override the original value
                const originalValue = tryOrDefault(undefined, () => storage.get(key));

                const newValue = mixin(originalValue, this.__getDefaultValueFromSchema(schema), true);
                storage.set(key, newValue);
            } else {
                storage.delete(key);
            }
        }
    }

    private static __getDefaultValueFromSchema(schema: IConfigurationSchema): (typeof schema.default | null) {
        if (schema.type === 'null') {
            return null;
        }
        
        if (schema.type !== 'object') {
            return schema.default;
        }

        // schema type is 'object'
        // if the default value of the schema is provided, we simply return it.
        if (schema.default) {
            return schema.default;
        }

        /**
         * If default is not provided, we try to build a corresponding default 
         * value from its schema.
         */
        return this.__extractDefaultValueFromObjectSchema(schema);
    }

    protected static __extractDefaultValueFromObjectSchema(schema: IConfigurationSchema & { type: 'object' }): object | undefined {
        const result: any = {};

        if (!schema || typeof schema !== 'object') {
            return result;
        }

        for (const key in schema.properties) {
            const value = schema.properties[key]!;

            // Handle the nested case
            if (value.type === 'object') {
                result[key] = this.__extractDefaultValueFromObjectSchema(value);
            } 
            // make sure `null` type is sets to `null`
            else {
                result[key] = value.type === 'null' ? null : value.default;
            }
        }

        return result;
    }
}