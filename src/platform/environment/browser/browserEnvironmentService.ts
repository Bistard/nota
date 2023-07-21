import { ILogService } from "src/base/common/logger";
import { windowConfiguration } from "src/platform/electron/browser/global";
import { DiskEnvironmentService } from "src/platform/environment/common/diskEnvironmentService";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { IWindowConfiguration } from "src/platform/window/common/window";

/**
 * @class A {@link IEnvironmentService} that used inside renderer process with
 * additional environment informations that relatives to windows.
 */
export class BrowserEnvironmentService extends DiskEnvironmentService implements IBrowserEnvironmentService {

    private readonly _configuration: IWindowConfiguration;

    constructor(
        logService?: ILogService,
    ) {
        super(windowConfiguration, {
            isPackaged: windowConfiguration.isPackaged,
            appRootPath: windowConfiguration.appRootPath,
            tmpDirPath: windowConfiguration.tmpDirPath,
            userDataPath: windowConfiguration.userDataPath,
            userHomePath: windowConfiguration.userDataPath,
        }, logService);

        this._configuration = windowConfiguration;
        if (this._configuration.log === 'trace') {
            this.inspect();
        }
    }

    get machineID(): string { return this._configuration.machineID; }

    get windowID(): number { return this._configuration.windowID; }

    get configuration(): IWindowConfiguration { return this._configuration; }
}