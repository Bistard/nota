import { join } from "src/base/common/files/path";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { memoize } from "src/base/common/memoization";
import { ICLIArguments } from "src/platform/environment/common/argument";
import { DiskEnvironmentService } from "src/platform/environment/common/diskEnvironmentService";
import { IEnvironmentOpts, IMainEnvironmentService } from "src/platform/environment/common/environment";
import { IProductService } from "src/platform/product/common/productService";

/**
 * @class A {@link IEnvironmentService} that used in main process. Storing the
 * basic and essential native environment related information.
 * 
 * @note The service will also take in CLI as environment parameter (eg. 
 * `process.argv`, see more from {@link ICLIArguments}).
 */
export class MainEnvironmentService extends DiskEnvironmentService implements IMainEnvironmentService {

    constructor(
        CLIArgv: ICLIArguments,
        opts: IEnvironmentOpts,
        @ILogService logService: ILogService,
        @IProductService private readonly productService: IProductService,
    ) {
        super(CLIArgv, opts, logService);

        if (CLIArgv.log === 'debug') {
            this.inspect();
        }

        logService.debug('MainEnvironmentService', 'MainEnvironmentService constructed.');
    }

    @memoize
    get mainIpcHandle(): string { return createMainIpcHandle(URI.toFsPath(this.userDataPath), this.productService.profile.version, 'main'); }
}

/**
 * Using {@link version} so that running different versions of programs will not
 * affect each other.
 */
function createMainIpcHandle(userDir: string, version: string, type: string): string {

    // Windows: use pipe
    if (process.platform === "win32") {
        // TODO: should take useDir into account
        return `\\\\.\\pipe\\${version}-${type}-sock`;
    }

    // Unix / Mac: use socket file
    return join(userDir, `${version}-${type}.sock`);
}
