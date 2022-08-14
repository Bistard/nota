import { URI } from "src/base/common/file/uri";
import { LogLevel } from "src/base/common/logger";
import { iterPropety } from "src/base/common/util/object";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";
import { ICLIArguments } from "src/code/platform/environment/common/argument";

export const IEnvironmentService = createDecorator<IEnvironmentService>('environment-service');

/**
 * @description Returns all the data of the given environment service as an 
 * array.
 * @param service The desired {@link IEnvironmentService}.
 */
export function getAllEnvironments(service: IEnvironmentService): string[] {
    const result: string[] = [];
    let value: any;
    iterPropety(service, (propName) => {
        if (propName !== 'constructor' && typeof service[propName] !== 'function') {
            const propVal = service[propName];
            if (propVal instanceof URI) {
                value = URI.toFsPath(propVal);
            } 
            else if (propVal instanceof Object) {
                value = JSON.stringify(propVal);
            } 
            else {
                value = propVal;
            }
            result.push(`${propName}: ${value}`);
        }
    });
    return result;
}

/**
 * A basic environment that can be used in either main process or renderer 
 * process. 
 * 
 * Unlike configuration service which data are all uneffected when running on 
 * different places (environment).
 * 
 * If a different environment is required you need to extend this interface.
 */
export interface IEnvironmentService {
    
    /**
     * The application mode.
     */
    readonly mode: 'develop' | 'release';

    /**
     * The configuration directory of the application.
     * @example .../nota/.nota
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
 * The native environment works only in main process in Electron.
 */
export interface IMainEnvironmentService extends IEnvironmentService {
    
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
     * @example C:/Users/user_name/AppData/Roaming/nota
     */
    readonly userDataPath: URI;
}