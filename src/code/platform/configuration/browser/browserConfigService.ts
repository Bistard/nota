import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { AbstractConfigService, IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { ConfigCollection, ConfigCollectionOpts } from "src/code/platform/configuration/common/configCollection";
import { BuiltInConfigScope, ConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { USER_CONFIG_FILE_NAME } from "src/code/platform/configuration/electron/configService";
import { IEnvironmentService } from "src/code/platform/environment/common/environment";
import { IFileService } from "src/code/platform/files/common/fileService";

export class BrowserConfigService extends AbstractConfigService implements IConfigService {

    constructor(
        @IEnvironmentService environmentService: IEnvironmentService,
        @IFileService fileService: IFileService,
        @ILogService logService: ILogService,
    ) {
        // collection construction
        const collectionOpts: ConfigCollectionOpts = {
            resourceProvider: (scope: ConfigScope) => {
                switch (scope) {
                    case BuiltInConfigScope.User:
                        return URI.join(environmentService.appConfigurationPath, USER_CONFIG_FILE_NAME);
                    default:
                        throw new Error(`unknown scope of configuration: ${scope}`);
                }
            },
            builtIn: [BuiltInConfigScope.User],
        };
        const collection = new ConfigCollection(collectionOpts, fileService, logService);
        super(collection, logService);
    }
}