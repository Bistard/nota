import { IConfigurationServiceOptions, IConfigurationUpdateOptions, Section } from "src/platform/configuration/common/configuration";
import { AbstractConfigurationService } from "src/platform/configuration/common/abstractConfigurationService";
import { ILogService } from "src/base/common/logger";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

export class MainConfigurationService extends AbstractConfigurationService {

    // [constructor]

    constructor(
        options: IConfigurationServiceOptions,
        @IInstantiationService instantiationService: IInstantiationService,
        @ILogService logService: ILogService,
    ) {
        super(options, instantiationService, logService);
    }

    // [public methods]

    public set(section: Section, value: any, options?: IConfigurationUpdateOptions): Promise<void> {
        return Promise.reject(new Error('[ConfigurationService] does not support `set`'));
    }

    public delete(section: Section, options?: IConfigurationUpdateOptions): Promise<void> {
        return Promise.reject(new Error('[ConfigurationService] does not support `Delete`'));
    }

    public async save(): Promise<void> {
        return Promise.reject(new Error('[ConfigurationService] does not support `save`'));
    }
}