import { IConfigurationServiceOptions, IConfigurationUpdateOptions, Section } from "src/platform/configuration/common/configuration";
import { AbstractConfigurationService } from "src/platform/configuration/common/abstractConfigurationService";
import { ILogService } from "src/base/common/logger";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";

export class MainConfigurationService extends AbstractConfigurationService {

    // [constructor]

    constructor(
        options: IConfigurationServiceOptions,
        @IInstantiationService instantiationService: IInstantiationService,
        @ILogService logService: ILogService,
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        super(options, instantiationService, logService, registrantService);
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