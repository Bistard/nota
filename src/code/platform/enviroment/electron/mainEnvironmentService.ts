import { getCurrTimeStamp } from "src/base/common/date";
import { join } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { memoize } from "src/base/common/memoization";
import { NOTA_DIR_NAME } from "src/code/common/service/configService/configService";
import { IMainEnvironmentService } from "src/code/platform/enviroment/common/environment";

export interface IEnvironmentOpts {
    readonly isPackaged: boolean;
    readonly userHomePath: string;
    readonly tmpDirPath: string;
    readonly appRootPath: string;
}

/**
 * @class A {@link IEnvironmentService} that used in main process. Storing the
 * basic and essential native enviroment related information.
 */
export class MainEnvironmentService implements IMainEnvironmentService {

    constructor(
        private readonly args: any, // REVIEW: for later design
        private readonly opts: IEnvironmentOpts
    ) {}

    @memoize
    get mode(): "develop" | "release" { return this.opts.isPackaged ? 'release' : 'develop'; }

    @memoize
    get userHomePath(): URI { return URI.fromFile(this.opts.userHomePath); }

    @memoize
    get tmpDirPath(): URI { return URI.fromFile(this.opts.tmpDirPath); }

    @memoize
    get appRootPath(): URI { return URI.fromFile(this.opts.appRootPath); }

    @memoize
    get logPath(): URI { return URI.fromFile(join(this.opts.appRootPath, NOTA_DIR_NAME, 'log', getCurrTimeStamp().replace(/-|:| |\./g, ''))); }

    @memoize
    get appSettingPath(): URI { return URI.fromFile(join(this.opts.appRootPath, NOTA_DIR_NAME)); }
}

