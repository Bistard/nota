import { URI } from "src/base/common/files/uri";
import { LogLevel } from "src/base/common/logger";
import { iterProp } from "src/base/common/utilities/object";
import { IService, createService, refineDecorator } from "src/platform/instantiation/common/decorator";
import { ICLIArguments } from "src/platform/environment/common/argument";
import { IWindowConfiguration } from "src/platform/window/common/window";
import { Dictionary, isObject } from "src/base/common/utilities/type";
import { Strings } from "src/base/common/utilities/string";

export const IEnvironmentService = createService<IEnvironmentService>('environment-service');
export const IBrowserEnvironmentService = refineDecorator<IEnvironmentService, IBrowserEnvironmentService>(IEnvironmentService);

/**
 * @description Returns all the data of the given environment service as an 
 * array.
 * @param service The desired {@link IEnvironmentService}.
 */
export function getAllEnvironments(service: IEnvironmentService): Record<string, string> {
    const result = {};

    let value: any;
    iterProp(service, (propName) => {
        if (propName !== 'constructor' && typeof service[propName] !== 'function') {
            const propVal = service[propName];
            if (propVal instanceof URI) {
                value = URI.toFsPath(propVal);
            }
            else if (isObject(propVal)) {
                value = Strings.stringifySafe(propVal);
            }
            else {
                value = propVal;
            }

            result[propName] = value;
        }
    }, -1);
    return result;
}

export interface IEnvironmentOpts {
    readonly isPackaged: boolean;
    readonly userHomePath: string | URI;
    readonly tmpDirPath: string | URI;
    readonly appRootPath: string | URI;
    readonly userDataPath: string | URI;
}

export const enum ApplicationMode {

    /**
     * Represents the development mode. It is usually used during software 
     * development and testing.
     */
    DEVELOP,

    /**
     * Represents the release or production mode. It is used when the 
     * application is ready for end users.
     */
    RELEASE,
}

/**
 * A shared environment interface that can be used in any places.
 * 
 * Unlike configuration service that might be changed during runtime, instead,
 * data remain constants when running on different places (environment).
 * 
 * @note If a different specific environment is required you need to extend this
 * interface as a base interface.
 */
export interface IEnvironmentService extends IService {

    /**
     * The application mode.
     */
    readonly mode: ApplicationMode;

    /**
     * If the application is packaged.
     */
    readonly isPackaged: boolean;

    /**
     * The configuration directory of the application.
     * @example ./root/.config
     */
    readonly appConfigurationPath: URI;

    /**
     * The logging output directory.
     */
    readonly logPath: URI;

    /**
     * The logging level.
     */
    readonly logLevel: LogLevel;
}

/**
 * A base environment interface for the renderer process or the main process of 
 * Electron.
 */
export interface IDiskEnvironmentService extends IEnvironmentService {

    /**
     * The arguments from command line interface.
     */
    readonly CLIArguments: ICLIArguments;

    /**
     * The user home directory.
     * @example Windows - C:/Users/user_name
     */
    readonly userHomePath: URI;

    /**
     * The temporary directory.
     * @example Windows - C:/Users/user_name/AppData/Local/Temp
     */
    readonly tmpDirPath: URI;

    /**
     * The root directory of the application.
     */
    readonly appRootPath: URI;

    /**
     * The user data directory.
     * @example C:/Users/user_name/AppData/Roaming/user_data
     */
    readonly userDataPath: URI;

    /**
     * The product profile path for 'product.json'.
     */
    readonly productProfilePath: URI;

    /**
     * Construct a dictionary that represent the entire environment. 
     * Useful for logging.
     */
    inspect(): Dictionary<string, string>;
}

/**
 * The native environment works only in the main process of Electron.
 */
export interface IMainEnvironmentService extends IDiskEnvironmentService {

    /**
     * The handle used for main process to ensure there is only one running 
     * application.
     */
    readonly mainIpcHandle: string;
}

/**
 * Environment used in the renderer process of Electron.
 */
export interface IBrowserEnvironmentService extends IDiskEnvironmentService {

    /**
     * The unique ID for the current running application.
     */
    readonly machineID: string;

    /**
     * The window ID where browser is running on.
     */
    readonly windowID: number;

    /**
     * Window configuration for current renderer process.
     * // REVIEW: some memory should be released once it is used.
     */
    readonly configuration: IWindowConfiguration;
}