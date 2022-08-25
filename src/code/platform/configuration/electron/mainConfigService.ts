import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { AbstractConfigService, APP_CONFIG_NAME, IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { ConfigCollection, ConfigCollectionOpts } from "src/code/platform/configuration/common/configCollection";
import { BuiltInConfigScope, ConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { IEnvironmentService } from "src/code/platform/environment/common/environment";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IMainLifecycleService } from "src/code/platform/lifeCycle/electron/mainLifecycleService";

export class MainConfigService extends AbstractConfigService implements IConfigService {

    constructor(
        @IEnvironmentService environmentService: IEnvironmentService,
        @IFileService fileService: IFileService,
        @ILogService logService: ILogService,
        @IMainLifecycleService lifecycleService: IMainLifecycleService,
    ) {
        // collection construction
        const collectionOpts: ConfigCollectionOpts = {
            resourceProvider: (scope: ConfigScope) => {
                switch (scope) {
                    case BuiltInConfigScope.Application:
                        return URI.join(environmentService.appConfigurationPath, APP_CONFIG_NAME);
                    default:
                        throw new Error(`unknown scope of configuration: ${scope}`);
                }
            },
            builtIn: [BuiltInConfigScope.Application],
        };
        const collection = new ConfigCollection(collectionOpts, fileService, logService);
        super(collection, fileService, logService, lifecycleService);
    }

    
}