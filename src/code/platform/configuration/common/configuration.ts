import { IConfigStorage } from "src/code/platform/configuration/common/configStorage";

export const NOTA_DIR_NAME = '.nota';
export const DEFAULT_CONFIG_NAME = 'user.config.json';
export const USER_CONFIG_NAME = DEFAULT_CONFIG_NAME;
export const APP_CONFIG_NAME = 'nota.config.json';

export interface IComposedConfiguration {
    default: IConfigStorage;
    user: IConfigStorage;
}

export interface IConfigurationCompareResult {
    added: string[];
    deleted: string[];
    changed: string[];
}