import { strictEquals } from "src/base/common/utilities/object";
import { DeepReadonly, Dictionary } from "src/base/common/utilities/type";
import { IRawConfigurationChangeEvent } from "src/platform/configuration/common/configurationRegistrant";
import { ConfigurationStorage, IConfigurationStorage, IReadonlyConfigurationStorage } from "src/platform/configuration/common/configurationStorage";
import { ConfigurationModuleType, IConfigurationCompareResult, Section } from "src/platform/configuration/common/configuration";
import { panic } from "src/base/common/utilities/panic";
import { Disposable } from "src/base/common/dispose";

interface IConfigurationHubBase {

    /**
     * @description Returns the internal configuration storage.
     */
    inspect(): IReadonlyConfigurationStorage;

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

class ConfigurationHubBase extends Disposable implements IConfigurationHubBase {

    // [fields]

    private _composedConfiguration?: IConfigurationStorage;
    private readonly _configurationMapping: Dictionary<ConfigurationModuleType, string>;

    // [constructor]

    constructor(
        protected _defaultConfiguration: IConfigurationStorage,
        protected _userConfiguration: IConfigurationStorage,
        protected _memoryConfiguration: IConfigurationStorage = new ConfigurationStorage(),
    ) {
        super();
        this._composedConfiguration = undefined;
        this.__register(this._memoryConfiguration);
        this._configurationMapping = {
            [ConfigurationModuleType.Default]: '_defaultConfiguration',
            [ConfigurationModuleType.User]: '_userConfiguration',
            [ConfigurationModuleType.Memory]: '_memoryConfiguration',
        };
    }

    // [public methods]

    public inspect(): IConfigurationStorage {
        return this.__getComposedConfiguration();
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
            this._composedConfiguration = this.__register(this._defaultConfiguration.clone());
            const userConfigurationWithMemory = this.__register(this._userConfiguration.clone());
            userConfigurationWithMemory.merge(this._memoryConfiguration, false);
            this._composedConfiguration.merge(userConfigurationWithMemory, true);
            this.release(userConfigurationWithMemory);
        }
        return this._composedConfiguration;
    }

    protected __dropComposedConfiguration(): void {
        if (this._composedConfiguration) {
            this.release(this._composedConfiguration);
            this._composedConfiguration = undefined;
        }
    }

    // [private helper methods]

    private __getConfigurationWithType(type: ConfigurationModuleType): string {
        const configuration = this._configurationMapping[type];
        if (!configuration) {
            panic(`Cannot find configuration with type '${type}'.`);
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
        this._memoryConfiguration.set(section, value);
        this.__dropComposedConfiguration();
    }

    public deleteInMemory(section: Section): void {
        this.setInMemory(section, undefined);
    }
}
