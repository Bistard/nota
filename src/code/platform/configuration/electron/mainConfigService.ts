import { Disposable, IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ILogService, LogLevel } from "src/base/common/logger";
import { ConfigCollection, IConfigCollection } from "src/code/platform/configuration/common/configCollection";
import { BuiltInConfigScope, ConfigScope, IScopeConfigChangeEvent } from "src/code/platform/configuration/common/configRegistrant";
import { GLOBAL_CONFIG_FILE_NAME, USER_CONFIG_FILE_NAME } from "src/code/platform/configuration/electron/configService";
import { IEnvironmentService } from "src/code/platform/environment/common/environment";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";

export const IConfigService = createDecorator<IConfigService>('configuration-service');

class ResourceProvider {
    constructor(private readonly configDir: URI) {}
    
    public get(scope: ConfigScope): URI {
        switch (scope) {
            case BuiltInConfigScope.Application:
                return URI.join(this.configDir, GLOBAL_CONFIG_FILE_NAME);
            case BuiltInConfigScope.User:
                return URI.join(this.configDir, USER_CONFIG_FILE_NAME);
            default:
                throw new Error(`unknown scope of configuration: ${scope}`);
        }
    }
}

/**
 * A base interface for all config-service.
 */
export interface IConfigService extends IDisposable {
    /**
     * Fires when any of the configuration is changed.
     */
    onDidChange: Register<IScopeConfigChangeEvent>;
    
    /**
     * @description Returns a deep-copyed object that contains all the built-in
     * and extension configurations. The outest property name is their 
     * registered configuration type. See {@link ConfigScope}.
     */
    inspect(): any;

    /**
     * @description Get specific configuration with the given scope.
     * @note If section is not provided, the whole configuration will be 
     * returned.
     * 
     * @throws An exception will be thrown if the section is invalid.
     */
    get<T>(scope: ConfigScope, section?: string): T;
    
    /**
     * @description Set specific configuration with the given scope.
     * @param scope The scope of the configuration.
     * @param section The section directs to the update configuration. If not
     *                provided, the whole configuration under that scope will
     *                be replaced.
     * @param configuration The actual configuraion data.
     * 
     * @throws An exception will be thrown if the section is invalid.
     */
    set(scope: ConfigScope, section: string | null, configuration: any): void;

    /**
     * @description Delete configuration at given section with the given scope.
     * @param scope The scope of the configuration.
     * @param section The section directs to the update configuration.
     * @returns A boolean indicates if the operation successed.
     * 
     * @throws An exception will be thrown if the section is invalid.
     */
    delete(scope: ConfigScope, section: string): boolean;
}

export interface IMainConfigService extends IConfigService {   
    /**
     * @description Initialize all the registered configurations in 
     * {@link IConfigRegistrant} with the updatest resource from the disk.
     */
    init(): Promise<void>;
}

/**
 * // TODO Configuration
 */
export class MainConfigService extends Disposable implements IMainConfigService, IDisposable {

    // [event]
    
    get onDidChange(): Register<IScopeConfigChangeEvent> { return this._configurations.onDidChange; }

    // [field]

    private readonly _configurations: IConfigCollection;

    // [constructor]

    constructor(
        @IEnvironmentService private readonly environmentService: IEnvironmentService,
        @IFileService fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        const provider = new ResourceProvider(environmentService.appConfigurationPath);
        this._configurations = new ConfigCollection((scope) => provider.get(scope), fileService, logService);
        this.__register(this._configurations);
    }

    // [public methods]

    public async init(): Promise<void> {
        this.logService.trace('Main#MainConfigService#initializing...');
        return this._configurations.init().then(() => {
            if (this.environmentService.logLevel === LogLevel.TRACE) {
                this.logService.trace('All Configurations:\n', this._configurations.inspect().model);
            }
            this.logService.info(`All configurations loaded successfully.`);
        });
    }

    public get<T>(scope: unknown, section?: string | undefined): T {
        return this._configurations.get(scope, section);
    }

    public set(scope: unknown, section: string | null, configuration: any): void {
        this._configurations.set(scope, section, configuration);
    }

    public delete(scope: unknown, section: string): boolean {
        return this._configurations.delete(scope, section);
    }

    public inspect(): any {
        return this._configurations.inspect().model;
    }

    // [private helper methods]
}