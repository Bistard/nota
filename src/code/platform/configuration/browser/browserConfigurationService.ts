import { ConfigurationModuleType, IConfigurationUpdateOptions, Section } from "src/code/platform/configuration/common/configuration";
import { AbstractConfigurationService } from "src/code/platform/configuration/common/abstractConfigurationService";
import { URI } from "src/base/common/file/uri";
import { IFileService } from "src/code/platform/files/common/fileService";
import { ILogService } from "src/base/common/logger";
import { Disposable } from "src/base/common/dispose";
import { Queue } from "src/base/common/util/array";

export class BrowserConfigurationService extends AbstractConfigurationService {

    // [fields]

    private readonly _configurationEditing: ConfigurationEditing;

    // [constructor]

    constructor(
        appConfigurationPath: URI,
        @IFileService fileService: IFileService,
        @ILogService logService: ILogService,
    ) {
        super(appConfigurationPath, fileService, logService);
        this._configurationEditing = new ConfigurationEditing();
    }

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

            // TODO: trigger configuration change event
            return;
        }
    }

    private __onConfigurationPartialChange(): void {

    }
}

class ConfigurationEditing extends Disposable {

    // [fields]

    private readonly _queue: Queue<void>;

    // [constructor]

    constructor() {
        super();
        this._queue = new Queue();
    }

    // [public methods]

}