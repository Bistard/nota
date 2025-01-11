import { Disposable } from "src/base/common/dispose";
import { InitProtector, tryOrDefault } from "src/base/common/error";
import { AsyncResult, err, ok } from "src/base/common/result";
import { Emitter, Event } from "src/base/common/event";
import { DataBuffer } from "src/base/common/files/buffer";
import { FileOperationErrorType, FileOperationError } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { IJsonSchemaValidateResult, JsonSchemaValidator } from "src/base/common/json";
import { ILogService } from "src/base/common/logger";
import { UnbufferedScheduler } from "src/base/common/utilities/async";
import { Dictionary } from "src/base/common/utilities/type";
import { IUserConfigurationModule, ConfigurationModuleType } from "src/platform/configuration/common/configuration";
import { IConfigurationRegistrant, IConfigurationSchema } from "src/platform/configuration/common/configurationRegistrant";
import { IConfigurationStorage, ConfigurationStorage } from "src/platform/configuration/common/configurationStorage";
import { DefaultConfiguration } from "src/platform/configuration/common/configurationModules/defaultConfiguration";
import { IFileService } from "src/platform/files/common/fileService";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { Time } from "src/base/common/date";
import { Strings } from "src/base/common/utilities/string";

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

    public init(): AsyncResult<void, Error> {
        return this._initProtector.init('[UserConfiguration] Cannot initialize twice.').toAsync()
        .andThen(() => {
            this.__registerListeners();
            return this.__reloadConfiguration();
        });
    }

    public reload(): AsyncResult<void, Error> {
        return this.__reloadConfiguration();
    }

    // [private helper methods]

    private __registerListeners(): void {
        this.__register(this._validator.onUnknownConfiguration(unknownKey => this.logService.warn('UserConfiguration', 'Cannot identify the configuration.', { unknownKey: unknownKey, from: URI.toString(this._userResource, true) })));
        this.__register(this._validator.onInvalidConfiguration(result => this.logService.warn('UserConfiguration', 'encounter invalid configuration.', { invalid: result })));

        // configuration update from the file
        this.__syncConfigurationFromFileOnChange();

        // configuration update into the file
        this.__syncConfigurationToFileOnChange(this._configuration);

        // fires the event when the configuration is constructed too
        this._onDidConfigurationLoaded.fire(this._configuration);
    }

    private __reloadConfiguration(): AsyncResult<void, Error> {
        return this.__loadConfiguration()
        .andThen(load => {
            if (load.ifLoaded) {
                /**
                 * The configuration is loaded correctly, we need to validate the 
                 * loaded configuration.
                 */
                const validated = this.__validateConfiguration(load.raw);
                this.__setupConfiguration({ ifLoaded: true, validated: validated });
                this._onDidConfigurationChange.fire();
            } 
            else {
                /**
                 * We are creating a new user configuration, there is no need to 
                 * validate.
                 */
                this.__setupConfiguration({ ifLoaded: false, validated: load.raw });
                this._onDidConfigurationLoaded.fire(this._configuration);
            }
    
            return ok();
        });
    }

    private __loadConfiguration(): AsyncResult<LoadConfigurationResult, Error> {
        
        return this.fileService.readFile(this._userResource)
        .andThen<LoadConfigurationResult, FileOperationError>(buffer => {
            // read successfully, simply return it.
            const raw: string = buffer.toString();
            return ok({ ifLoaded: true, raw });
        })
        .orElse(error => {
            // unexpected error
            if (error.code !== FileOperationErrorType.FILE_NOT_FOUND) {
                return err(error);
            }

            // expecting file not found, we create a new user configuration.
            return this.__createNewConfiguration()
                .map(config => { return { ifLoaded: false, raw: config }; });
        });
    }

    private __createNewConfiguration(): AsyncResult<IConfigurationStorage, FileOperationError> {
        const defaultConfiguration = DefaultConfiguration.createDefaultConfigurationStorage(this._registrant);
        const raw = defaultConfiguration.toJSON().unwrap();

        // keep update to the file
        return this.fileService.createFile(this._userResource, DataBuffer.fromString(raw), { overwrite: true })
            .map(() => defaultConfiguration);
    }

    private __validateConfiguration(raw: string): object {
        const invalidated = tryOrDefault<object>(
            {},
            () => JSON.parse(raw),
            error => this.logService.error('UserConfiguration', 'Cannot initialize user configuration.', error, { at: URI.toString(this._userResource, true) }),
        );
        const validated = this._validator.validate(invalidated);
        return validated;
    }

    private __setupConfiguration(result: SetupConfigurationResult): void {
        // dispose the old configuration
        this.release(this._configuration);

        // fill into the new configuration
        let configuration: IConfigurationStorage;
        if (result.ifLoaded) {
            configuration = new ConfigurationStorage(Object.keys(result.validated), result.validated);
        } else {
            configuration = result.validated;
        }

        this._configuration = this.__register(configuration);
        this.__syncConfigurationToFileOnChange(configuration);
    }

    private __syncConfigurationFromFileOnChange(): void {
        this.fileService.watch(this._userResource).unwrap().then(cancel => this.__register(cancel));
        this.__register(Event.filter(this.fileService.onDidResourceChange, e => e.wrap().match(this._userResource))(() => reloadScheduler.schedule()));
        const reloadScheduler = this.__register(new UnbufferedScheduler<void>(
            Time.ms(100), // wait for a moment to avoid excessive reloading
            async () => {
                return await this.reload();
            }
        ));
    }

    private __syncConfigurationToFileOnChange(configuration: IConfigurationStorage): void {
        /**
         * Following a file write, an additional configuration reload from the 
         * file occurs. This step is redundant as the in-memory configuration 
         * already matches the file content.
         * 
         * This is hacky and a little slow, but it makes sure the job is done.
         */ 
        this.__register(configuration.onDidChange(async () => {
            const stringify = Strings.stringifySafe(
                configuration.model, 
                () => this.logService.error('UserConfiguration', 'Failed to stringify the configuration. Replacing with empty string.'), 
                undefined, 
                4,
            );
            const buffer = DataBuffer.fromString(stringify);
            await this.fileService.writeFile(this._userResource, buffer, { create: true, overwrite: true })
                .match(
                    () => {},
                    error => this.logService.error('UserConfiguration', 'Cannot sync configuration to the file.', error, { at: URI.toString(this._userResource) })
                );
        }));
    }
}

/**
 * @class Validates whether the given object fits the configuration schema.
 */
class UserConfigurationValidator extends Disposable {

    // [fields]

    private readonly _onUnknownConfiguration = this.__register(new Emitter<string>());
    public readonly onUnknownConfiguration = this._onUnknownConfiguration.registerListener;

    private readonly _onInvalidConfiguration = this.__register(new Emitter<IJsonSchemaValidateResult>());
    public readonly onInvalidConfiguration = this._onInvalidConfiguration.registerListener;

    private readonly _registrant: IConfigurationRegistrant;

    // [constructor]

    constructor(registrant: IConfigurationRegistrant) {
        super();
        this._registrant = registrant;
    }

    // [public methods]

    public validate(rawConfiguration: object): object {
        const schemas = this._registrant.getConfigurationSchemas();
        const validatedConfiguration = this.__validate(rawConfiguration, schemas);
        return validatedConfiguration;
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