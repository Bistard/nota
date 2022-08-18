import { BuiltInConfigScope, ConfigScope, ExtensionConfigScope, IConfigRegistrant } from "src/code/platform/configuration/common/configRegistrant";
import { ConfigStorage, IConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { Registrants } from "src/code/platform/registrant/common/registrant";

/**
 * An interface only for {@link ConfigCollection}.
 */
export interface IConfigCollection {

    readonly applicationConfiguration: IConfigStorage;
    readonly userConfiguration: IConfigStorage;
    
    /**
     * @description Returns a deep-copyed storage that contains all the built-in
     * and extension configurations. The outest section name is their registered
     * config type. See {@link ConfigScope}.
     */
    inspect(): IConfigStorage;

    /**
     * @description Get specific configuration with the given scope for narrowing 
     * down purpose.
     */
    get<T>(scope: ConfigScope, section?: string): T;
}

/**
 * // TODO
 */
export class ConfigCollection implements IConfigCollection {

    // [field]

    private readonly _registrant: IConfigRegistrant = Registrants.get(IConfigRegistrant);
    
    private readonly _configurations: Map<BuiltInConfigScope, IConfigStorage>;
    private readonly _extensionConfigurations: Map<ExtensionConfigScope, IConfigStorage>;
    
    private readonly _appConfiguration: IConfigStorage;
    private readonly _userConfiguration: IConfigStorage;

    // [constructor]

    constructor(
        appConfiguration?: IConfigStorage,
        userConfiguration?: IConfigStorage,
    ) {
        // built-in
        this._configurations = new Map();
        this._appConfiguration  = appConfiguration  ?? this._registrant.getDefaultBuiltIn(BuiltInConfigScope.Application);
        this._userConfiguration = userConfiguration ?? this._registrant.getDefaultBuiltIn(BuiltInConfigScope.User);
        this._configurations.set(BuiltInConfigScope.Application, this._appConfiguration);
        this._configurations.set(BuiltInConfigScope.User, this._userConfiguration);

        // extension
        this._extensionConfigurations = new Map();
        for (const [key, extensionConfiguration] of this._registrant.getAllDefaultExtensions()) {
            this._extensionConfigurations.set(key, extensionConfiguration);
        }
    }

    // [getter]

    get applicationConfiguration(): IConfigStorage {
        return this._appConfiguration;
    }
    
    get userConfiguration(): IConfigStorage {
        return this._userConfiguration;
    }

    // [public methods]

    public get<T>(scope: ConfigScope, section?: string): T {
        const configuration = 
            (this._configurations.get(<BuiltInConfigScope>scope) 
            ?? this._extensionConfigurations.get(<ExtensionConfigScope>scope)
        );
        if (!configuration) {
            throw new Error(`Provided configuration scope does not exist: ${scope}`);
        }
        return configuration.get(section);
    }

    public inspect(): IConfigStorage {
        const allConfiguration = new ConfigStorage();
        for (const [type, configuration] of this._configurations) {
            allConfiguration.set(type, configuration.model);
        }
        return allConfiguration;
    }

    // [private helper methods]

}