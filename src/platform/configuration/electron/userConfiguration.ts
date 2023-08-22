import { DataBuffer } from "src/base/common/file/buffer";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { UserConfiguration } from "src/platform/configuration/common/configurationHub";
import { IFileService } from "src/platform/files/common/fileService";

export class MainUserConfiguration extends UserConfiguration {

    constructor(
        userResource: URI,
        @IFileService fileService: IFileService,
        @ILogService logService: ILogService,
    ) {
        super(userResource, fileService, logService);

        this.onDidConfigurationLoaded(configuration => {

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
        });
    }
}