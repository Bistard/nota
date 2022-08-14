import { ILogService } from "src/base/common/logger";
import { ISandboxProcess } from "src/code/platform/electron/common/electronType";
import { IBrowserEnvironmentService } from "src/code/platform/environment/common/environment";
import { MainEnvironmentService } from "src/code/platform/environment/electron/mainEnvironmentService";
import { ICreateWindowConfiguration, ProcessKey } from "src/code/platform/window/common/window";

/**
 * @class A {@link IEnvironmentService} that used inside renderer process with
 * additional environment informations that relatives to windows.
 */
export class BrowserEnvironmentService extends MainEnvironmentService implements IBrowserEnvironmentService {

    private readonly configuration: ICreateWindowConfiguration;

    constructor(
        process: ISandboxProcess,
        logService?: ILogService,
    ) {
        const winConfig: ICreateWindowConfiguration = JSON.parse(process.env[ProcessKey.configuration]!);
        super(winConfig, {
            isPackaged: winConfig.isPackaged,
            appRootPath: winConfig.appRootPath,
            tmpDirPath: winConfig.tmpDirPath,
            userDataPath: winConfig.userDataPath,
            userHomePath: winConfig.userDataPath,
        }, logService);

        this.configuration = winConfig;
    }

    get machineID(): string { return this.configuration.machineID; }

    get windowID(): number { return this.configuration.windowID; }
}