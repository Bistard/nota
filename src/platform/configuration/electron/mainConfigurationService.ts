import { IConfigurationUpdateOptions, Section } from "src/platform/configuration/common/configuration";
import { AbstractConfigurationService } from "src/platform/configuration/common/abstractConfigurationService";

export class MainConfigurationService extends AbstractConfigurationService {

    // [public methods]

    public set(section: Section, value: any): Promise<void>;
    public set(section: Section, value: any, options: IConfigurationUpdateOptions): Promise<void>;
    public set(section: Section, value: any, options?: IConfigurationUpdateOptions): Promise<void> {
        return Promise.reject(new Error('[ConfigurationService] does not support `set`'));
    }

    public delete(section: Section): Promise<void>;
    public delete(section: Section, options?: IConfigurationUpdateOptions): Promise<void> {
        return Promise.reject(new Error('[ConfigurationService] does not support `Delete`'));
    }
}