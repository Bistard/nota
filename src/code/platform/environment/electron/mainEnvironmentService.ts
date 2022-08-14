import { getCurrTimeStamp } from "src/base/common/date";
import { join } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { ILogService, LogLevel, parseToLogLevel } from "src/base/common/logger";
import { memoize } from "src/base/common/memoization";
import { MapTypes } from "src/base/common/util/type";
import { NOTA_DIR_NAME } from "src/code/platform/configuration/electron/configService";
import { ICLIArguments } from "src/code/platform/environment/common/argument";
import { getAllEnvironments, IEnvironmentOpts, IMainEnvironmentService } from "src/code/platform/environment/common/environment";

/**
 * @class A {@link IEnvironmentService} that used in main process. Storing the
 * basic and essential native enviroment related information.
 * 
 * @note The service will also take in CLI as environment parameter (eg. 
 * `process.argv`, see more from {@link ICLIArguments}).
 */
export class MainEnvironmentService implements IMainEnvironmentService {

    private readonly opts: MapTypes<IEnvironmentOpts, { from: string | URI, to: string }>;

    constructor(
        private readonly CLIArgv: ICLIArguments,
        opts: IEnvironmentOpts,
        @ILogService logService: ILogService,
    ) {
        this.opts = {
            isPackaged: opts.isPackaged,
            appRootPath: (typeof opts.appRootPath === 'string') ? opts.appRootPath : URI.toFsPath(opts.appRootPath),
            userDataPath: (typeof opts.userDataPath === 'string') ? opts.userDataPath : URI.toFsPath(opts.userDataPath),
            userHomePath: (typeof opts.userHomePath === 'string') ? opts.userHomePath : URI.toFsPath(opts.userHomePath),
            tmpDirPath: (typeof opts.tmpDirPath === 'string') ? opts.tmpDirPath : URI.toFsPath(opts.tmpDirPath),
        };

        if (this.CLIArgv.log === 'trace') {
            logService.trace(`Environment loaded:\n${getAllEnvironments(this).map(enviro => `\t${enviro}`).join('\n')}`);
        }
    }

    get CLIArguments(): ICLIArguments { return this.CLIArgv; }

    get isPackaged(): boolean { return this.opts.isPackaged; }

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

