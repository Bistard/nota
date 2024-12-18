import { ILogService, LogLevel } from "src/base/common/logger";
import { WIN_CONFIGURATION } from "src/platform/electron/browser/global";
import { DiskEnvironmentService } from "src/platform/environment/common/diskEnvironmentService";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { IWindowConfiguration } from "src/platform/window/common/window";

/**
 * @class A {@link IEnvironmentService} that used inside renderer process with
 * additional environment information that relatives to windows.
 */
export class BrowserEnvironmentService extends DiskEnvironmentService implements IBrowserEnvironmentService {

    private readonly _configuration: IWindowConfiguration;

    constructor(
        logService: ILogService,
    ) {
        super(WIN_CONFIGURATION, {
            isPackaged: WIN_CONFIGURATION.isPackaged,
            appRootPath: WIN_CONFIGURATION.appRootPath,
            tmpDirPath: WIN_CONFIGURATION.tmpDirPath,
            userDataPath: WIN_CONFIGURATION.userDataPath,
            userHomePath: WIN_CONFIGURATION.userHomePath,
        }, logService);

        this._configuration = WIN_CONFIGURATION;
        logService.debug("browserEnvironmentService", "Environment loaded",  this.inspect());

        logService.debug('BrowserEnvironmentService', 'BrowserEnvironmentService constructed.');
    }

    get machineID(): string { return this._configuration.machineID; }

    get windowID(): number { return this._configuration.windowID; }

    get configuration(): IWindowConfiguration { return this._configuration; }
}