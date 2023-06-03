import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { DeepReadonly } from "src/base/common/util/type";
import { IConfigurationStorage } from "src/code/platform/configuration/common/configurationStorage";
import { IConfigurationChangeEvent } from "src/code/platform/configuration/common/configurationService";
import { createService } from "src/code/platform/instantiation/common/decorator";

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

export interface IConfigurationService extends IDisposable {

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
     * 
     * @throws An exception will be thrown if the section is invalid.
     * @note If section is not provided, the whole configuration will be returned.
     * @note You may not change the value of the return value directly. Use set 
     * instead.
     */
    get<T>(section: Section | undefined, defaultValue?: T): DeepReadonly<T>; // FIX: should not provide 'defaultValue' API
    
    /**
     * @description Set the configuration by the given value under the provided 
     * section.
     * @param section The {@link Section} string of the required configuration.
     * @param value The new value of the configuration.
     * 
     * @throws An exception will be thrown if the section is invalid.
     * @note If section is null, it overries the entire configuration.
     */
    set(section: Section, value: any): void;

    /**
     * @description Delete the configuration under the provided section.
     * @param section The {@link Section} string of the required configuration.
     */
    delete(section: Section): void;
}

export const NOTA_DIR_NAME = '.nota';
export const DEFAULT_CONFIG_NAME = 'user.config.json';
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
