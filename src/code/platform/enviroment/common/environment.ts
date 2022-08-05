import { URI } from "src/base/common/file/uri";
import { iterPropety } from "src/base/common/util/iterable";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const IEnvironmentService = createDecorator<IEnvironmentService>('environment-service');

/**
 * @description Returns all the data of the given environment service as an 
 * array.
 * @param service The desired {@link IEnvironmentService}.
 */
export function getAllEnvironmentInformation(service: IEnvironmentService): any[] {
    const result: any[] = [];
    iterPropety(service, (propName) => {
        if (propName !== 'constructor' && typeof service[propName] !== 'function') {
            result.push(service[propName]);
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
    
    // production
    readonly mode: 'develop' | 'release';

}

/**
 * The native environment works only in main process in Electron.
 */
export interface IMainEnvironmentService extends IEnvironmentService {

    // logging
    readonly logPath: URI;

    // data path
    readonly userHomePath: URI; 
    readonly tmpDirPath: URI;
    readonly appRootPath: URI;
}