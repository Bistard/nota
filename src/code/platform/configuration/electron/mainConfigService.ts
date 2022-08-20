import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { AbstractConfigService, GLOBAL_CONFIG_FILE_NAME, IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { ConfigCollection, ConfigCollectionOpts } from "src/code/platform/configuration/common/configCollection";
import { BuiltInConfigScope, ConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { IEnvironmentService } from "src/code/platform/environment/common/environment";
import { IFileService } from "src/code/platform/files/common/fileService";

export class MainConfigService extends AbstractConfigService implements IConfigService {

    constructor(
        @IEnvironmentService environmentService: IEnvironmentService,
        @IFileService fileService: IFileService,
        @ILogService logService: ILogService,
    ) {
        // collection construction
        const collectionOpts: ConfigCollectionOpts = {
            resourceProvider: (scope: ConfigScope) => {
                switch (scope) {
                    case BuiltInConfigScope.Application:
                        return URI.join(environmentService.appConfigurationPath, GLOBAL_CONFIG_FILE_NAME);
                    default:
                        throw new Error(`unknown scope of configuration: ${scope}`);
                }
            },
            builtIn: [BuiltInConfigScope.Application],
        };
        const collection = new ConfigCollection(collectionOpts, fileService, logService);
        super(collection, logService);
    }
}