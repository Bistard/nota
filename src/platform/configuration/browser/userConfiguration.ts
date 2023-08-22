import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { UserConfiguration } from "src/platform/configuration/common/configurationHub";
import { IFileService } from "src/platform/files/common/fileService";

export class BrowserUserConfiguration extends UserConfiguration {

    constructor(
        userResource: URI,
        @IFileService fileService: IFileService,
        @ILogService logService: ILogService,
    ) {
        super(userResource, fileService, logService);
    }
}