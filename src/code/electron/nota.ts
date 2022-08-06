import { Disposable } from "src/base/common/dispose";
import { ILogService } from "src/base/common/logger";
import { IGlobalConfigService, IUserConfigService } from "src/code/common/service/configService/configService";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { IInstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/enviroment/common/environment";
import { IMainLifeCycleService } from "src/code/platform/lifeCycle/electron/mainLifeCycleService";

export interface INotaInstance {
    run(): Promise<void>;
}

/**
 * @class // TODO
 */
export class NotaInstance extends Disposable implements INotaInstance {

    // [fields]

    // [constructor]

    constructor(
        @IInstantiationService private readonly mainInstantiationService: IInstantiationService,
        @IEnvironmentService private readonly environmentService: IMainEnvironmentService,
        @IMainLifeCycleService private readonly lifeCycleService: IMainLifeCycleService,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IGlobalConfigService private readonly globalConfigService: IGlobalConfigService,
        @IUserConfigService private readonly userConfigService: IUserConfigService
    ) {
        super();
    }

    // [public methods]

    /**
     * // TODO
     */
    public async run(): Promise<void> {
        
    }

    // [private helper methods]

}