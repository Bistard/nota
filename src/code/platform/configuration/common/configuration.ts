import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { DeepReadonly } from "src/base/common/util/type";
import { IConfigurationStorage } from "src/code/platform/configuration/common/configurationStorage";
import { IConfigurationChangeEvent } from "src/code/platform/configuration/common/configurationService";
import { IMicroService, createService } from "src/code/platform/instantiation/common/decorator";

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

export interface IConfigurationService extends IDisposable, IMicroService {

    /**
     * Fires whenever the configuraion has changed.
     */
    readonly onDidConfigurationChange: Register<IConfigurationChangeEvent>;
    
    /**
     * Initialize the configuration service.
     */
    init(): Promise<void>;

    /**
     * @description Get the configuration by the given section.
     * @param section The {@link Section} string of the required configuration.
     * @param defaultValue Default value will be returned if the section is not 
     * provided.
     * 
     * @throws An `undefined` will be returned if the section is invalid and the 
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
     * @param options The options for updation.
     * 
     * @throws An exception will be thrown if the section is invalid.
     * @note If section is null, it overries the entire configuration.
     */
    set(section: Section, value: any): Promise<void>;
    set(section: Section, value: any, options: IConfigurationUpdateOptions): Promise<void>;

    /**
     * @description Delete the configuration under the provided section.
     * @param section The {@link Section} string of the required configuration.
     * @param options The options for updation.
     * 
     * @throws An exception will be thrown if the section is invalid.
     */
    delete(section: Section): Promise<void>;
    delete(section: Section, options: IConfigurationUpdateOptions): Promise<void>;
}

export interface IConfigurationUpdateOptions {

    /**
     * Your target module for updation.
     */
    readonly type: ConfigurationModuleType;
}

export const NOTA_DIR_NAME = '.nota';

/** @deprecated */
export const DEFAULT_CONFIG_NAME = 'user.config.json';
/** @deprecated */
export const USER_CONFIG_NAME = DEFAULT_CONFIG_NAME;
export const APP_CONFIG_NAME = 'nota.config.json';

export interface IComposedConfiguration {
    default: IConfigurationStorage;
    user: IConfigurationStorage;
}

export interface IConfigurationCompareResult {
    added: Section[];
    deleted: Section[];
    changed: Section[];
}

/**
 * A list of different types of {@link IConfigurationModule}.
 */
export const enum ConfigurationModuleType {
    Default = 1,
    User,
    Memory,
}

export function ConfigurationModuleTypeToString(type: ConfigurationModuleType): string {
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
 * @note The model does not support direct configuraiton modifications.
 */
export interface IConfigurationModule<TType extends ConfigurationModuleType, TOnChangeEvent> extends IDisposable {
    
    readonly type: TType;

    /**
     * Fires when the configuration chanages.
     */
    readonly onDidConfigurationChange: Register<TOnChangeEvent>;

    /**
     * @description Returns the configuration.
     */
    getConfiguration(): IConfigurationStorage;

    /**
     * @description Initializes the configuration.
     * @note This method should not invoke `onDidConfigurationChange`.
     */
    init(): void | Promise<void>;

    /**
     * @description Reloads the configuration.
     */
    reload(): void | Promise<void>;
}