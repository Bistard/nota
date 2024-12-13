import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { DeepReadonly } from "src/base/common/utilities/type";
import { IConfigurationStorage } from "src/platform/configuration/common/configurationStorage";
import { IConfigurationChangeEvent } from "src/platform/configuration/common/abstractConfigurationService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IRawConfigurationChangeEvent } from "src/platform/configuration/common/configurationRegistrant";
import { URI } from "src/base/common/files/uri";
import { AsyncResult, Result } from "src/base/common/result";

export const APP_DIR_NAME = '.wisp';
export const APP_CONFIG_NAME = 'app.config.json';

/**
 * A {@link Section} refers to a string composed of multiple substrings linked 
 * together by the period ('.') symbol.
 * @example 
 * 'workspace.notebook.ifAutoSave'
 * 'path1.path2.path3'
 * 'root'
 */
export type Section = string;

export const IConfigurationService = createService<IConfigurationService>('configuration-service');

export interface IConfigurationService extends IDisposable, IService {

    /**
     * The path to the application configuration path.
     */
    readonly appConfigurationPath: URI;

    /**
     * Fires when the configuration has changed. Any of {@link ConfigurationModuleType}
     * type of update will trigger this event.
     */
    readonly onDidConfigurationChange: Register<IConfigurationChangeEvent>;

    /**
     * Initialize the configuration service.
     */
    init(): AsyncResult<void, Error>;

    /**
     * @description Get the configuration by the given section.
     * @param section The {@link Section} string of the required configuration.
     * @param defaultValue Default value will be returned if the section is not 
     * provided.
     * 
     * @panic An `undefined` will be returned if the section is invalid and the 
     * default is not provided.
     * @note If section is not provided, the whole configuration will be returned.
     * @note You may not change the value of the return value directly. Use `set` 
     * instead.
     */
    get<T>(section: Section | undefined, defaultValue?: T): DeepReadonly<T>;

    /**
     * @description Set the configuration by the given value under the provided 
     * section.
     * @param section The {@link Section} string of the required configuration.
     * @param value The new value of the configuration.
     * @param options The options for update.
     * 
     * @panic If the section is invalid.
     * 
     * @note If section is null, it overrides the entire configuration.
     * @note If value is `Undefined` and the section corresponding schema 
     * provides a default value will be used for set.
     */
    set(section: Section, value: any, options: IConfigurationUpdateOptions): Promise<void>;

    /**
     * @description Delete the configuration under the provided section.
     * @param section The {@link Section} string of the required configuration.
     * @param options The options for update.
     * 
     * @panic If the section is invalid.
     */
    delete(section: Section, options: IConfigurationUpdateOptions): Promise<void>;

    /**
     * @description Saves the configuration.
     */
    save(): AsyncResult<void, Error>;
}

export interface IConfigurationServiceOptions {

    readonly appConfiguration: {
        readonly path: URI;
    };
}

export interface IConfigurationUpdateOptions {

    /**
     * Your target module for update.
     */
    readonly type: ConfigurationModuleType;
}

export interface IConfigurationCompareResult {
    readonly added: Section[];
    readonly deleted: Section[];
    readonly changed: Section[];
}

/**
 * A list of different types of {@link IConfigurationModule}.
 */
export const enum ConfigurationModuleType {
    Default = 1,
    User,
    Memory,
}

export function ConfigurationModuleTypeToString(type: any): string {
    switch (type) {
        case ConfigurationModuleType.Default: return 'Default';
        case ConfigurationModuleType.User: return 'User';
        case ConfigurationModuleType.Memory: return 'Memory';
        default: return 'Unknown';
    }
}

/**
 * A {@link IConfigurationModule} signifies a model that encompasses certain 
 * specific configuration aspects.
 * 
 * @note Double initialization will throw an exception.
 * @note The model does not support direct configuration modifications.
 */
export interface IConfigurationModule<TType extends ConfigurationModuleType, TOnDidChangeEvent> extends IDisposable {

    readonly type: TType;

    /**
     * Fires when the configuration changes.
     */
    readonly onDidConfigurationChange: Register<TOnDidChangeEvent>;

    /**
     * @description Returns the configuration.
     */
    getConfiguration(): IConfigurationStorage;

    /**
     * @description Initializes the configuration.
     * @note This method should not invoke `onDidConfigurationChange`.
     */
    init(): Result<void, Error> | AsyncResult<void, Error>;

    /**
     * @description Reloads the configuration.
     */
    reload(): Result<void, Error> | AsyncResult<void, Error>;
}

export interface IDefaultConfigurationModule extends IConfigurationModule<ConfigurationModuleType.Default, IRawConfigurationChangeEvent> {

    /**
     * Fires when the configuration changes.
     * @note This fires when the default configuration changes in memory.
     */
    readonly onDidConfigurationChange: Register<IRawConfigurationChangeEvent>;
}

export interface IUserConfigurationModule extends IConfigurationModule<ConfigurationModuleType.User, void> {
    
    /**
     * Fires when the configuration changes.
     * @note This fires when the the user configuration changes in disk.
     */
    readonly onDidConfigurationChange: Register<void>;

    /**
     * Fires whenever the configuration is reloaded completely.
     */
    readonly onDidConfigurationLoaded: Register<IConfigurationStorage>;

    /**
     * Resolves when the latest configuration changes is applied to the 
     * configuration file.
     * @note This only resolves once.
     */
    readonly onLatestConfigurationFileChange: Promise<void>;
}