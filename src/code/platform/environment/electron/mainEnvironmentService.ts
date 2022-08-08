import { app } from "electron";
import { getCurrTimeStamp } from "src/base/common/date";
import { join } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { ILogService, LogLevel, parseToLogLevel } from "src/base/common/logger";
import { memoize } from "src/base/common/memoization";
import { NOTA_DIR_NAME } from "src/code/common/service/configService/configService";
import { ICLIArguments } from "src/code/platform/environment/common/argument";
import { getAllEnvironments, IMainEnvironmentService } from "src/code/platform/environment/common/environment";

export interface IEnvironmentOpts {
    isPackaged?: boolean;
    userHomePath?: string;
    tmpDirPath?: string;
    appRootPath?: string;
    userDataPath?: string;
}

/**
 * @class A {@link IEnvironmentService} that used in main process. Storing the
 * basic and essential native enviroment related information.
 * 
 * @note The service will also take in CLI as environment parameter (eg. 
 * `process.argv`, see more from {@link ICLIArguments}).
 */
export class MainEnvironmentService implements IMainEnvironmentService {

    constructor(
        private readonly CLIArgv: ICLIArguments,
        private readonly opts: IEnvironmentOpts,
        @ILogService private readonly logService: ILogService,
    ) {
        opts.isPackaged = opts.isPackaged ?? app.isPackaged;
        opts.userHomePath = opts.userHomePath ?? app.getPath('home')
        opts.tmpDirPath = opts.tmpDirPath ?? app.getPath('temp');
        opts.appRootPath = opts.appRootPath ?? app.getAppPath();
        opts.userDataPath = opts.userDataPath ?? app.getPath('userData');
        
        this.logService.trace(`Environment loaded:\n${getAllEnvironments(this).map(enviro => `\t${enviro}`).join('\n')}`);
    }

    get mode(): "develop" | "release" { return this.opts.isPackaged ? 'release' : 'develop'; }

    @memoize
    get logLevel(): LogLevel { return parseToLogLevel(this.CLIArgv['log']); }

    @memoize
    get userHomePath(): URI { return URI.fromFile(this.opts.userHomePath!); }

    @memoize
    get tmpDirPath(): URI { return URI.fromFile(this.opts.tmpDirPath!); }

    @memoize
    get appRootPath(): URI { return URI.fromFile(this.opts.appRootPath!); }

    @memoize
    get logPath(): URI { return URI.fromFile(join(this.opts.appRootPath!, NOTA_DIR_NAME, 'log', getCurrTimeStamp().replace(/-|:| |\./g, ''))); }

    @memoize
    get appConfigurationPath(): URI { return URI.fromFile(join(this.opts.appRootPath!, NOTA_DIR_NAME)); }

    @memoize
    get userDataPath(): URI { return URI.fromFile(this.opts.userDataPath!); }
}

