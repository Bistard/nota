import { Disposable, IDisposable } from "src/base/common/dispose";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { ConfigCollection } from "src/code/platform/configuration/common/configCollection";
import { BuiltInConfigScope, ConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { GLOBAL_CONFIG_FILE_NAME, USER_CONFIG_FILE_NAME } from "src/code/platform/configuration/electron/configService";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";

export const IConfigService = createDecorator<IConfigService>('configuration-service');

class ResourceProvider {

    constructor(
        private readonly configDir: URI,
    ) {}

    get(scope: ConfigScope): URI {
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
 export interface IConfigService {   
    init(): Promise<void>;
}

/**
 * // TODO Configuration
 */
export class MainConfigService extends Disposable implements IConfigService, IDisposable {

    // [field]

    private readonly _configurations: ConfigCollection;

    // [constructor]

    constructor(
        configDirectory: URI,
        @IFileService fileService: IFileService,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        const provider = new ResourceProvider(configDirectory);
        this._configurations = new ConfigCollection(provider.get, fileService);
    }

    // [public methods]

    public async init(): Promise<void> {
        this.logService.trace('Main#MainConfigService#initializing...');
        return this._configurations.init();
    }

    // [private helper methods]
}