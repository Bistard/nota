import { Disposable, IDisposable } from "src/base/common/dispose";
import { InitProtector, tryOrDefault } from "src/base/common/error";
import { Emitter, Event } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { IJsonSchemaValidateResult, JsonSchemaValidator } from "src/base/common/json";
import { ILogService } from "src/base/common/logger";
import { strictEquals } from "src/base/common/util/object";
import { DeepReadonly, Dictionary } from "src/base/common/util/type";
import { IRawConfigurationChangeEvent, IConfigurationSchema, IConfigurationRegistrant } from "src/platform/configuration/common/configurationRegistrant";
import { ConfigurationStorage, IConfigurationStorage } from "src/platform/configuration/common/configurationStorage";
import { IFileService } from "src/platform/files/common/fileService";
import { ConfigurationModuleType, IComposedConfiguration, IConfigurationCompareResult, IUserConfigurationModule, Section } from "src/platform/configuration/common/configuration";
import { UnbufferedScheduler } from "src/base/common/util/async";
import { errorToMessage } from "src/base/common/error";
import { DataBuffer } from "src/base/common/file/buffer";
import { FileOperationErrorType, FileSystemProviderError } from "src/base/common/file/file";
import { DefaultConfiguration } from "src/platform/configuration/common/defaultConfiguration";
import { REGISTRANTS } from "src/platform/registrant/common/registrant";

type LoadConfigurationResult = 
  | { readonly ifLoaded: false, readonly raw: IConfigurationStorage }
  | { readonly ifLoaded: true, readonly raw: string };

type SetupConfigurationResult = 
  | { readonly ifLoaded: false, readonly validated: IConfigurationStorage }
  | { readonly ifLoaded: true, readonly validated: object };

/**
 * @class A {@link UserConfiguration} represents the user configuration that 
 * will be treated as overrides to {@link DefaultConfiguration}. It obtains the
 * configuration by reading from the corresponding file.
 * 
 * @note Has type {@link ConfigurationModuleType.User}.
 * @note After the initialization of the module, it will automatically keep 
 * itself updated in response to any changes from the corresponding file.
 * @note However, the synchronous behavior of updating from configuration to 
 * file has been abstracted away.
 */
export class UserConfiguration extends Disposable implements IUserConfigurationModule {
    
    // [fields]

    public readonly type = ConfigurationModuleType.User;
    
    protected readonly _userResource: URI;
    protected _configuration: IConfigurationStorage;

    private readonly _initProtector: InitProtector;
    private readonly _validator: UserConfigurationValidator;

    // [event]

    private readonly _onDidConfigurationChange = this.__register(new Emitter<void>());
    public readonly onDidConfigurationChange = this._onDidConfigurationChange.registerListener;

    protected readonly _onDidConfigurationLoaded = this.__register(new Emitter<IConfigurationStorage>());
    public readonly onDidConfigurationLoaded = this._onDidConfigurationLoaded.registerListener;

    get onLatestConfigurationFileChange(): Promise<void> {
        return Event.toPromise(this._onDidConfigurationChange.registerListener);
    }

    // [constructor]

    constructor(
        userResource: URI,
        @IFileService protected readonly fileService: IFileService,
        @ILogService protected readonly logService: ILogService,
    ) {
        super();
        this._initProtector = new InitProtector();
        
        this._userResource = userResource;
        this._configuration = this.__register(new ConfigurationStorage());
        this._validator = this.__register(new UserConfigurationValidator());
    }

    // [public methods]

    public getConfiguration(): IConfigurationStorage {
        return this._configuration;
    }

    public async init(): Promise<void> {
        this._initProtector.init('[UserConfiguration] Cannot initialize twice.');

        this.__registerListeners();

        return this.__reloadConfiguration();
    }

    public async reload(): Promise<void> {
        return this.__reloadConfiguration();
    }

    // [private helper methods]

    private __registerListeners(): void {
        this.__register(this._validator.onUnknownConfiguration(unknownKey => this.logService.warn(`[UserConfiguration] Cannot identify the configuration: '${unknownKey}' from the source '${URI.toString(this._userResource, true)}'.`)));
        this.__register(this._validator.onInvalidConfiguration(result => this.logService.warn(`[UserConfiguration] encounter invalid configuration: ${result}.`)));

        // configuration updation from the file
        this.__syncConfigurationFromFileOnChange();

        // configuration update into the file
        this.__syncConfigurationToFileOnChange(this._configuration);

        // fires the event when the configuration is constructed too
        this._onDidConfigurationLoaded.fire(this._configuration);
    }

    private async __reloadConfiguration(): Promise<void> {
        const result = await this.__loadConfiguration();
        
        if (result.ifLoaded) {
            /**
             * The configuration is loaded correctly, we need to validate the 
             * loaded configuration.
             */
            const validated = this.__validateConfiguration(result.raw);
            this.__setupConfiguration({ ifLoaded: true, validated });

            this._onDidConfigurationChange.fire();
        } 
        else {
            /**
             * We are creating a new user configuration, there is no need to 
             * validate.
             */
            this.__setupConfiguration({ ifLoaded: false, validated: result.raw });
        }
    }

    private async __loadConfiguration(): Promise<LoadConfigurationResult> {
        let raw: string | IConfigurationStorage;

        // try to read the user configuration
        try {
            raw = (await this.fileService.readFile(this._userResource)).toString();
            return { ifLoaded: true, raw };
        } 
        catch (err) {
            // throw any errors that we are not expecting
            if (!(err instanceof FileSystemProviderError && err.code === FileOperationErrorType.FILE_NOT_FOUND)) {
                throw new Error(`[UserConfiguration] Cannot load configuration at '${URI.toString(this._userResource, true)}'. The cause is: ${errorToMessage(err)}`);
            }
            
            // expecting file not found, we create a new user configuration.
            await this.fileService.writeFile(this._userResource, DataBuffer.alloc(0), { create: true, overwrite: true });
            raw = await this.__createNewConfiguration();
            return { ifLoaded: false, raw };
        }

        // should not be reached
    }

    private async __createNewConfiguration(): Promise<IConfigurationStorage> {
        const defaultConfiguration = DefaultConfiguration.resetDefaultConfigurations();
        const raw = JSON.stringify(defaultConfiguration.model, null, 4);

        // keep update to the file
        await this.fileService.createFile(this._userResource, DataBuffer.fromString(raw), { overwrite: true });        
        return defaultConfiguration;
    }

    private __validateConfiguration(raw: string): object {
        const unvalidated = tryOrDefault<object>(
            {},
            () => JSON.parse(raw),
            () => this.logService.error(`Cannot initialize user configuration at '${URI.toString(this._userResource, true)}'`),
        );
        const validated = this._validator.validate(unvalidated);
        return validated;
    }

    private __setupConfiguration(result: SetupConfigurationResult): void {
        // dispose the old configuration
        this._configuration.dispose();

        // fill into the new configuration
        let configuration: IConfigurationStorage;
        if (result.ifLoaded) {
            configuration = new ConfigurationStorage(Object.keys(result.validated), result.validated);
        } else {
            configuration = result.validated;
        }

        this._configuration = configuration;
        this.__syncConfigurationToFileOnChange(configuration);

        this._onDidConfigurationLoaded.fire(configuration);
    }

    private __syncConfigurationFromFileOnChange(): void {
        this.__register(this.fileService.watch(this._userResource));
        this.__register(Event.filter(this.fileService.onDidResourceChange, e => e.wrap().match(this._userResource))(() => reloadScheduler.schedule()));
        const reloadScheduler = this.__register(new UnbufferedScheduler<void>(
            100, // wait for a moment to avoid excessive reloading
            async () => await this.reload()
        ));
    }

    private __syncConfigurationToFileOnChange(configuration: IConfigurationStorage): void {
        /**
         * Following a file write, an additional configuration reload 
         * from the file occurs. This step is redundant as the in-memory 
         * configuration already matches the file content.
         * 
         * This is hacky and a little slow, but it makes sure the job is done.
         */ 
        this.__register(configuration.onDidChange(async () => {
            await this.fileService.writeFile(
                this._userResource, 
                DataBuffer.fromString(JSON.stringify(configuration.model, null, 4)), 
                { create: true, overwrite: true },
            )
            .catch(err => {
                throw err;
            });
        }));
    }
}

class UserConfigurationValidator implements IDisposable {

    // [fields]

    private readonly _onUnknownConfiguration = new Emitter<string>();
    public readonly onUnknownConfiguration = this._onUnknownConfiguration.registerListener;

    private readonly _onInvalidConfiguration = new Emitter<IJsonSchemaValidateResult>();
    public readonly onInvalidConfiguration = this._onInvalidConfiguration.registerListener;

    private readonly _Registrant = REGISTRANTS.get(IConfigurationRegistrant);

    // [constructor]

    constructor() { }

    // [public methods]

    public validate(rawConfiguration: object): object {
        const schemas = this._Registrant.getConfigurationSchemas();
        const validatedConfiguration = this.__validate(rawConfiguration, schemas);
        return validatedConfiguration;
    }

    public dispose(): void {
        this._onUnknownConfiguration.dispose();
    }

    // [private helper methods]

    private __validate(rawConfiguration: object, schemas: Dictionary<string, IConfigurationSchema>): object {
        const validated: object = {};

        // console.log('[UserConfigurationValidator]');
        // console.log('schemas:', schemas);
        // console.log('rawConfiguration:', rawConfiguration);

        for (const key in rawConfiguration) {
            const value = rawConfiguration[key];
            const schema = schemas[key];

            if (!schema) {
                // console.log('on unknown configuration:', { key, value }); // review
                this._onUnknownConfiguration.fire(key);
                continue;
            }

            const result = JsonSchemaValidator.validate(value, schema);
            if (!result.valid) {
                this._onInvalidConfiguration.fire(result);
                continue;
            }

            validated[key] = value;
        }

        return validated;
    }
}

interface IConfigurationHubBase {

    inspect(): IComposedConfiguration;

    /**
     * @description Replace the reference to a {@link IConfigurationStorage} 
     * with a new one based on the specified module type.
     * @param type The type of the module that needs to be updated.
     * @param newConfiguration The reference to the new configuration.
     */
    updateConfiguration(type: ConfigurationModuleType, newConfiguration: IConfigurationStorage): void;

    /**
     * @description An enhanced version of '{@link updateConfiguration}' that 
     * compares the existing and new configuration modules and returns the 
     * comparison result.
     * @param type The type of the module that needs to be updated.
     * @param newConfiguration The new configuration reference.
     * @param changedKeys This parameter is provided if the client already knows 
     * the comparison result.
     */
    compareAndUpdateConfiguration(type: ConfigurationModuleType, newConfiguration: IConfigurationStorage, changedKeys: Section[] | undefined): IRawConfigurationChangeEvent;
}

class ConfigurationHubBase implements IConfigurationHubBase {

    // [fields]

    private _composedConfiguration?: IConfigurationStorage;
    private readonly _configurationMapping: Dictionary<ConfigurationModuleType, string>;

    // [constructor]

    constructor(
        protected _defaultConfiguration: IConfigurationStorage,
        protected _userConfiguration: IConfigurationStorage,
        protected _memoryConfiguration: IConfigurationStorage = new ConfigurationStorage(),
    ) {
        this._composedConfiguration = undefined;
        this._configurationMapping = {
            [ConfigurationModuleType.Default]: '_defaultConfiguration',
            [ConfigurationModuleType.User]: '_userConfiguration',
            [ConfigurationModuleType.Memory]: '_memoryConfiguration',
        };
    }

    // [public methods]

    public inspect(): IComposedConfiguration {
        return {
            default: this._defaultConfiguration,
            user: this._userConfiguration,
        };
    }

    // [public update methods]

    public updateConfiguration(type: ConfigurationModuleType, newConfiguration: IConfigurationStorage): void {
        const configuration = this.__getConfigurationWithType(type);
        this[configuration] = newConfiguration;
        this.__dropComposedConfiguration();
    }

    public compareAndUpdateConfiguration(type: ConfigurationModuleType, newConfiguration: IConfigurationStorage, changedKeys?: Section[]): IRawConfigurationChangeEvent {

        // If we do not know what keys are changed, we need to find them by ourself.
        if (!changedKeys) {
            const configuration = this.__getConfigurationWithType(type);
            const { added, deleted, changed } = this.__compareConfiguration(this[configuration], newConfiguration);
            changedKeys = [...added, ...deleted, ...changed];
        }

        this.updateConfiguration(type, newConfiguration);
        return { properties: changedKeys };
    }

    // [protected helper methods]

    protected __getComposedConfiguration(): IConfigurationStorage {
        if (!this._composedConfiguration) {
            this._composedConfiguration = this._defaultConfiguration.clone();
            
            const userConfigurationWithMemory = this._userConfiguration.clone();
            userConfigurationWithMemory.merge(this._memoryConfiguration, false);
            
            this._composedConfiguration.merge(userConfigurationWithMemory, true);
        }
        return this._composedConfiguration;
    }

    protected __dropComposedConfiguration(): void {
        this._composedConfiguration = undefined;
    }

    // [private helper methods]

    private __getConfigurationWithType(type: ConfigurationModuleType): string {
        const configuration = this._configurationMapping[type];
        if (!configuration) {
            throw new Error(`Cannot find configuration with type '${type}'.`);
        }
        return configuration;
    }

    private __compareConfiguration(oldConfiguration: IConfigurationStorage, newConfiguration: IConfigurationStorage): IConfigurationCompareResult {
        const { sections: oldKeys } = oldConfiguration;
        const { sections: newKeys } = newConfiguration;


        const added = newKeys.filter(key => oldKeys.indexOf(key) === -1);
        const deleted = oldKeys.filter(key => newKeys.indexOf(key) === -1);

        const changed: string[] = [];
        for (const oldKey of oldKeys) {
            if (newKeys.indexOf(oldKey) !== -1) {
                const oldVal = oldConfiguration.get(oldKey);
                const newVal = newConfiguration.get(oldKey);
                if (!strictEquals(oldVal, newVal)) {
                    changed.push(oldKey);
                }
            }
        }

        return { added, deleted, changed };
    }
}

/**
 * An interface only for {@link ConfigurationHub}.
 */
export interface IConfigurationHub extends IConfigurationHubBase {

    /**
     * @description Fetch the configuration at the given {@link Section}.
     * @param section The provided {@link Section} of the configuration.
     * @returns A read-only configuration.
     * 
     * @throws An exception will be thrown if the section is invalid.
     * @note If section is not provided, the whole configuration will be returned.
     * @note Direct modifications to the return value are not permitted. Utilize 
     * `set` instead.
     */
    get<T>(section: Section | undefined): DeepReadonly<T>;

    setInMemory(section: Section, value: any): void;
    deleteInMemory(section: Section): void;
}

/**
 * @class A {@link ConfigurationHub} serves as the unified command center for a 
 * variety of configuration modules.  It encapsulates a collection of references 
 * to {@link IConfigurationStorage} instances. The hub provides convenient APIs 
 * for retrieving and modifying configurations across all configuration modules.
 */
export class ConfigurationHub extends ConfigurationHubBase implements IConfigurationHub {

    // [constructor]

    constructor(
        defaultConfiguration: IConfigurationStorage,
        userConfiguration: IConfigurationStorage,
        memoryConfiguration: IConfigurationStorage = new ConfigurationStorage(),
    ) {
        super(defaultConfiguration, userConfiguration, memoryConfiguration);
    }

    // [public methods]

    public get<T>(section: Section | undefined): DeepReadonly<T> {
        const configuration = this.__getComposedConfiguration();
        return configuration.get(section);
    }

    public setInMemory(section: Section, value: any): void {
        this._memoryConfiguration.set(section, value);
        this.__dropComposedConfiguration();
    }

    public deleteInMemory(section: Section): void {
        this.setInMemory(section, undefined);
    }
}
