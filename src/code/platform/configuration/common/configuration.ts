import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { DeepReadonly } from "src/base/common/util/type";
import { IConfigurationStorage } from "src/code/platform/configuration/common/configurationStorage";
import { IConfigurationChangeEvent } from "src/code/platform/configuration/common/configurationService";
import { createService } from "src/code/platform/instantiation/common/decorator";

export const IConfigurationService = createService<IConfigurationService>('configuration-service');

// TODO
export interface IConfigurationService extends IDisposable {

    readonly onDidConfigurationChange: Register<IConfigurationChangeEvent>;
    init(): Promise<void>;
    get<T>(section: string | undefined, defaultValue?: T): DeepReadonly<T>; // FIX: should not provide 'defaultValue'.
    
    // FIX: those two should not be supported
    set(section: string, value: any): void;
    delete(section: string): void;
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
    added: string[];
    deleted: string[];
    changed: string[];
}
