import { ConfigurationModuleType, IConfigurationUpdateOptions, Section } from "src/code/platform/configuration/common/configuration";
import { AbstractConfigurationService } from "src/code/platform/configuration/common/abstractConfigurationService";

export class BrowserConfigurationService extends AbstractConfigurationService {

    // [public methods]

    public async set(section: Section, value: any): Promise<void>;
    public async set(section: Section, value: any, options: IConfigurationUpdateOptions): Promise<void>;
    public async set(section: Section, value: any, options?: IConfigurationUpdateOptions): Promise<void> {
        this.__updateConfiguration(section, value, options);
    }

    public async delete(section: Section): Promise<void>;
    public async delete(section: Section, options?: IConfigurationUpdateOptions): Promise<void> {
        this.__updateConfiguration(section, undefined, options);
    }

    // [private helper methods]

    private __updateConfiguration(section: Section, value: any, options?: IConfigurationUpdateOptions): void {
        const module = options?.type;

        if (module === ConfigurationModuleType.Default) {
			throw new Error(`[BrowserConfigurationService] Invalid configuration module for updation: ${module}`);
		}

		if (module === ConfigurationModuleType.Memory) {
            this._configurationHub.setInMemory(section, value);
            // TODO: trigger configuration change event
			return;
		}

        if (module === ConfigurationModuleType.User) {
            // TODO
            return;
        }
    }
}