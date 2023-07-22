import { join } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { memoize } from "src/base/common/memoization";
import { ICLIArguments } from "src/platform/environment/common/argument";
import { DiskEnvironmentService } from "src/platform/environment/common/diskEnvironmentService";
import { IEnvironmentOpts, IMainEnvironmentService } from "src/platform/environment/common/environment";

/**
 * @class A {@link IEnvironmentService} that used in main process. Storing the
 * basic and essential native enviroment related information.
 * 
 * @note The service will also take in CLI as environment parameter (eg. 
 * `process.argv`, see more from {@link ICLIArguments}).
 */
export class MainEnvironmentService extends DiskEnvironmentService implements IMainEnvironmentService {

    constructor(
        CLIArgv: ICLIArguments,
        opts: IEnvironmentOpts,
        @ILogService logService?: ILogService,
    ) {
        super(CLIArgv, opts, logService);

        if (CLIArgv.log === 'trace') {
            this.inspect();
        }
    }

    @memoize
    get mainIpcHandle(): string { return createMainIpcHandle(URI.toFsPath(this.userDataPath), 'main', '0.1.0'); }
}

/**
 * Using {@link version} so that running different versions of nota will not
 * affect each other.
 */
function createMainIpcHandle(userDir: string, type: string, version: string): string {

    // Windows: use pipe
    if (process.platform === "win32") {
        // REVIEW: should take useDir into account
        return `\\\\.\\pipe\\${version}-${type}-sock`;
    }

    // Unix / Mac: use socket file
    return join(userDir, `${version}-${type}.sock`);
}
