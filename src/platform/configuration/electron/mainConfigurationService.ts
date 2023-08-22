import { IConfigurationServiceOptions, IConfigurationUpdateOptions, Section } from "src/platform/configuration/common/configuration";
import { AbstractConfigurationService } from "src/platform/configuration/common/abstractConfigurationService";
import { ILogService } from "src/base/common/logger";
import { IInstantiationService, InstantiationRequiredParameters } from "src/platform/instantiation/common/instantiation";
import { MainUserConfiguration } from "src/platform/configuration/electron/userConfiguration";

export class MainConfigurationService extends AbstractConfigurationService {

    // [constructor]

    constructor(
        options: IConfigurationServiceOptions,
        @IInstantiationService instantiationService: IInstantiationService,
        @ILogService logService: ILogService,
    ) {
        super(options, instantiationService, logService);
    }

    // [protected methods]

    protected override __createUserConfiguration(...args: InstantiationRequiredParameters<typeof MainUserConfiguration>): MainUserConfiguration {
        return this.instantiationService.createInstance(MainUserConfiguration, ...args);
    }

    // [public methods]

    public set(section: Section, value: any, options?: IConfigurationUpdateOptions): Promise<void> {
        return Promise.reject(new Error('[ConfigurationService] does not support `set`'));
    }

    public delete(section: Section, options?: IConfigurationUpdateOptions): Promise<void> {
        return Promise.reject(new Error('[ConfigurationService] does not support `Delete`'));
    }
}