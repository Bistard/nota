import { Disposable, IDisposable } from "src/base/common/dispose";
import { InitProtector, errorToMessage, tryOrDefault } from "src/base/common/error";
import { Emitter, Event } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { FileSystemProviderError, FileOperationErrorType } from "src/base/common/file/file";
import { URI } from "src/base/common/file/uri";
import { IJsonSchemaValidateResult, JsonSchemaValidator } from "src/base/common/json";
import { ILogService } from "src/base/common/logger";
import { UnbufferedScheduler } from "src/base/common/util/async";
import { Dictionary } from "src/base/common/util/type";
import { IUserConfigurationModule, ConfigurationModuleType } from "src/platform/configuration/common/configuration";
import { IConfigurationRegistrant, IConfigurationSchema } from "src/platform/configuration/common/configurationRegistrant";
import { IConfigurationStorage, ConfigurationStorage } from "src/platform/configuration/common/configurationStorage";
import { DefaultConfiguration } from "src/platform/configuration/common/configurationModules/defaultConfiguration";
import { IFileService } from "src/platform/files/common/fileService";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";

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

    private readonly _registrant: IConfigurationRegistrant;
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
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        super();
        this._initProtector = new InitProtector();
        this._registrant = registrantService.getRegistrant(RegistrantType.Configuration);
        
        this._userResource = userResource;
        this._configuration = this.__register(new ConfigurationStorage());
        this._validator = this.__register(new UserConfigurationValidator(this._registrant));
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
        this.__register(this._validator.onInvalidConfiguration(result => this.logService.warn(`[UserConfiguration] encounter invalid configuration: ${JSON.stringify(result)}.`)));

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
        catch (err: unknown) {

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
        const defaultConfiguration = DefaultConfiguration.createDefaultConfigurationStorage(this._registrant);
        const raw = defaultConfiguration.toJSON();

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

    private readonly _Registrant: IConfigurationRegistrant;

    // [constructor]

    constructor(registrant: IConfigurationRegistrant) {
        this._Registrant = registrant;
    }

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

        for (const key in rawConfiguration) {
            const value = rawConfiguration[key];
            const schema = schemas[key];

            if (!schema) {
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