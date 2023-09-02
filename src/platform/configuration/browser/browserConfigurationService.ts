import { ConfigurationModuleType, ConfigurationModuleTypeToString, IConfigurationServiceOptions, IConfigurationUpdateOptions, Section } from "src/platform/configuration/common/configuration";
import { AbstractConfigurationService } from "src/platform/configuration/common/abstractConfigurationService";
import { ILogService } from "src/base/common/logger";
import { IRawConfigurationChangeEvent } from "src/platform/configuration/common/configurationRegistrant";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IFileService } from "src/platform/files/common/fileService";
import { DataBuffer } from "src/base/common/files/buffer";
import { URI } from "src/base/common/files/uri";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";

export class BrowserConfigurationService extends AbstractConfigurationService {

    // [fields]

    // [constructor]

    constructor(
        options: IConfigurationServiceOptions,
        @IInstantiationService instantiationService: IInstantiationService,
        @IFileService private readonly fileService: IFileService,
        @ILogService logService: ILogService,
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        super(options, instantiationService, logService, registrantService);
    }

    // [public methods]

    public async set(section: Section, value: any, options?: IConfigurationUpdateOptions): Promise<void> {
        await this.__updateConfiguration(section, value, options);
    }

    public async delete(section: Section, options?: IConfigurationUpdateOptions): Promise<void> {
        await this.__updateConfiguration(section, undefined, options);
    }

    public async save(): Promise<void> {
        if (!this.isInit) {
            return;
        }

        const jsonData = this._configurationHub.inspect().toJSON();
        try {
            await this.fileService.writeFile(this.appConfigurationPath, DataBuffer.fromString(jsonData), { create: true, overwrite: true });
            this.logService.info(`[BrowserConfigurationService] Successfully save configuration at '${URI.toString(this.appConfigurationPath)}'.`);
        } catch (error: unknown) {
            this.logService.error(`[BrowserConfigurationService] Cannot save configuration at '${URI.toString(this.appConfigurationPath)}'.`);
        }
    }

    // [private helper methods]

    private async __updateConfiguration(section: Section, value: unknown, options?: IConfigurationUpdateOptions): Promise<void> {
        const module = options?.type;

        if (module === ConfigurationModuleType.Default) {
            throw new Error(`[BrowserConfigurationService] cannot update configuration wtih module type: '${ConfigurationModuleTypeToString(module)}'`);
        }

        if (module === ConfigurationModuleType.Memory) {
            this.__updateInMemoryConfiguration(section, value);
        }
        else if (module === ConfigurationModuleType.User) {
            await this.__updateUserConfiguration(section, value);
        }
        else {
            throw new Error(`[BrowserConfigurationService] cannot update configuration with unknown module type: '${ConfigurationModuleTypeToString(module)}'`);
        }
    }

    /**
     * @description Since we are modifying only in memory, the modules inside 
     * the {@link ConfigurationHub} are not able to notify the on configuration
     * change event, we must fire it manually.
     */
    private __updateInMemoryConfiguration(section: Section, value: unknown): void {
        this._configurationHub.setInMemory(section, value);
        const rawEvent: IRawConfigurationChangeEvent = { properties: [section] };
        this.__onConfigurationChange(rawEvent, ConfigurationModuleType.Memory);
    }

    /**
     * @description The base class already handles the on configuration change 
     * event.
     */
    private async __updateUserConfiguration(section: Section, value: unknown): Promise<void> {
        const configuration = this._userConfiguration.getConfiguration();
        configuration.set(section, value);

        // make sure the changes are applied to the file
        return this._userConfiguration.onLatestConfigurationFileChange;
    }
}
