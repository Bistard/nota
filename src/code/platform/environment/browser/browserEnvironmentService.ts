import { ILogService } from "src/base/common/logger";
import { windowConfiguration } from "src/code/platform/electron/browser/global";
import { IBrowserEnvironmentService } from "src/code/platform/environment/common/environment";
import { MainEnvironmentService } from "src/code/platform/environment/electron/mainEnvironmentService";
import { IWindowConfiguration } from "src/code/platform/window/common/window";

/**
 * @class A {@link IEnvironmentService} that used inside renderer process with
 * additional environment informations that relatives to windows.
 */
export class BrowserEnvironmentService extends MainEnvironmentService implements IBrowserEnvironmentService {

    public readonly configuration: IWindowConfiguration;

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

        this.configuration = windowConfiguration;
    }

    get machineID(): string { return this.configuration.machineID; }

    get windowID(): number { return this.configuration.windowID; }
}