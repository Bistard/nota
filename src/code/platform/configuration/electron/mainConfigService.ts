import { Disposable, IDisposable } from "src/base/common/dispose";
import { URI } from "src/base/common/file/uri";
import { ILogService, LogLevel } from "src/base/common/logger";
import { ConfigCollection, IConfigCollection } from "src/code/platform/configuration/common/configCollection";
import { BuiltInConfigScope, ConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { GLOBAL_CONFIG_FILE_NAME, USER_CONFIG_FILE_NAME } from "src/code/platform/configuration/electron/configService";
import { IEnvironmentService } from "src/code/platform/environment/common/environment";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";

export const IMainConfigService = createDecorator<IConfigService>('configuration-service');

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
    init(): Promise<void>;
}

/**
 * // TODO Configuration
 */
export class MainConfigService extends Disposable implements IConfigService, IDisposable {

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

    // [private helper methods]
}