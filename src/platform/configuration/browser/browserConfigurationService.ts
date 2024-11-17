import { ConfigurationModuleType, ConfigurationModuleTypeToString, IConfigurationServiceOptions, IConfigurationUpdateOptions, Section } from "src/platform/configuration/common/configuration";
import { AbstractConfigurationService } from "src/platform/configuration/common/abstractConfigurationService";
import { ILogService } from "src/base/common/logger";
import { IRawConfigurationChangeEvent } from "src/platform/configuration/common/configurationRegistrant";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IFileService } from "src/platform/files/common/fileService";
import { DataBuffer } from "src/base/common/files/buffer";
import { URI } from "src/base/common/files/uri";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { Arrays } from "src/base/common/utilities/array";
import { IJsonSchemaValidateResult, JsonSchemaValidator } from "src/base/common/json";
import { AsyncResult, err, ok } from "src/base/common/result";
import { panic } from "src/base/common/utilities/panic";

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
        this.logService.debug('BrowserConfigurationService', 'Constructed.');
    }

    // [public methods]

    public async set(section: Section, value: any, options: IConfigurationUpdateOptions): Promise<void> {
        await this.__updateConfiguration(section, value, options);
    }

    public async delete(section: Section, options: IConfigurationUpdateOptions): Promise<void> {
        await this.__updateConfiguration(section, undefined, options);
    }

    public save(): AsyncResult<void, Error> {
        if (!this.isInit) {
            return AsyncResult.ok();
        }

        const jsonData = this._configurationHub.inspect().toJSON().unwrap();
        return this.fileService.writeFile(this.appConfigurationPath, DataBuffer.fromString(jsonData), { create: true, overwrite: true })
        .orElse(error => {
            this.logService.error('BrowserConfigurationService', `Cannot save configuration.`, error, { at: URI.toString(this.appConfigurationPath) });
            return err(error);
        })
        .andThen(() => {
            return ok(this.logService.info('BrowserConfigurationService', `Successfully save configuration at :${URI.toString(this.appConfigurationPath)}`));
        });
    }

    // [private helper methods]

    private async __updateConfiguration(section: Section, value: unknown, options: IConfigurationUpdateOptions): Promise<void> {
        const module = options?.type;

        if (module === ConfigurationModuleType.Default) {
            panic(`[BrowserConfigurationService] cannot update the configuration with module type: '${ConfigurationModuleTypeToString(module)}'`);
        }

        /**
         * Before update the configuration, we need to ensure two things based 
         * on the configuration schemas:
         *   1. The section is valid.
         *   2. The value is valid.
         */
        if (!this.__validateConfigurationUpdateInSection(section)) {
            panic(`[BrowserConfigurationService] cannot update the configuration because the section is invalid: ${section}`);
        }

        // ignore value check when deleting the configuration
        const updateResult = this.__validateConfigurationUpdateInValue(section, value);
        if (value !== undefined  && !updateResult.valid) {
            panic(`[BrowserConfigurationService] cannot update the configuration because the value does not match its schema: ${value}. Reason: ${updateResult.errorMessage}. IsDeprecated: ${updateResult.deprecatedMessage ?? false}`);
        }
        
        /**
         * Updates the configuration based on its target module type.
         */
        if (module === ConfigurationModuleType.Memory) {
            this.__updateInMemoryConfiguration(section, value);
        }
        else if (module === ConfigurationModuleType.User) {
            await this.__updateUserConfiguration(section, value);
        }
        else {
            panic(`[BrowserConfigurationService] cannot update configuration with unknown module type: '${ConfigurationModuleTypeToString(module)}'`);
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

    private __validateConfigurationUpdateInSection(section: Section): boolean {
        // section validation
        const validSections = this._defaultConfiguration.getConfiguration().sections;
        return Arrays.exist(validSections, section);
    }
    
    private __validateConfigurationUpdateInValue(section: Section, value: unknown): IJsonSchemaValidateResult {
        // value validation
        const getFirstSection = (section: string): string => {
            const endIdx = section.indexOf('.');
            return endIdx === -1 ? section : section.substring(0, endIdx);
        };
        const firstKey = getFirstSection(section);
        
        const schemas = this._registrant.getConfigurationSchemas();
        const correspondingSchema = schemas[firstKey];
        if (!correspondingSchema) {
            return { valid: false, errorMessage: 'no corresponding schema' };
        }
        
        return JsonSchemaValidator.validate(value, correspondingSchema);
    }
}
