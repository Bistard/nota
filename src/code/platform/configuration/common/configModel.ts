import { URI } from "src/base/common/file/uri";
import { ConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { IFileService } from "src/code/platform/files/common/fileService";

// #region deprecate code

/**
 * @readonly The type of configService.
 * @deprecated
 */
export const enum IConfigType {
    USER,
    GLOBAL,
    TEST,
}

/**
 * @readonly Interface corresponds to the event `onDidChangeConfiguration` in 
 * `configServiceBase`.
 * @deprecated
 */
export interface IConfigChangeEvent {

    readonly type: IConfigType;
    readonly changes: IConfigChange;

}

/** @deprecated */
export interface IConfigChange {
    sections: string[],
}

/*******************************************************************************
 * Configuration Model
 ******************************************************************************/

/** @deprecated */
 export interface __IConfigModel {

    /** Get the actual structure of the configuration. */
    readonly object: Object;
    get<T>(section: string | undefined): T | undefined;
    set(section: string | undefined, value: any): void;
}

/**
 * @class The data structure to stores the actual configruration. Each 
 * `configServiceBase` consists exact one __ConfigModel.
 * @note The default constructor is a null javascript object.
 * @deprecated
 */
export class __ConfigModel implements __IConfigModel {

    // [field]

    private _object = Object.create(null);

    // [constructor]

    constructor(object?: Object) {
        this._object = object;
    }

    // [public methods]

    get object(): any {
        return this._object;
    }

    public get<T>(section: string | undefined = undefined): T | undefined {
        if (section) {
            return this.__getConfigBySection<T>(section, this._object);
        } else {
            return <T>this._object;
        }
    }

    public set(section: string | undefined, value: any): void {
        if (section) {
            return this.__setConfigBySection(section, this._object, value);
        } else {
            this._object = value;
        }
    }

    // [protected helper method]

    protected __setObject(obj: any): void {
        this._object = obj;
    }

    // [private helper methods]

    private __getConfigBySection<T>(section: string, config: any): T | undefined {

        const sections = section.split('.');
        
        let currentSection = config;
        for (const sec of sections) {
            try {
                currentSection = currentSection[sec];
            } catch (err) {
                return undefined;
            }
        }

        return currentSection;
    }

    private __setConfigBySection(section: string, config: any, value: any): void {

        const sections = section.split('.');
        const lastSection = sections.pop()!;

        let currentSection = config;
        for (const subSection of sections) {
            let curr = currentSection[subSection];
            if (typeof curr === 'undefined') {
                curr = currentSection[subSection] = Object.create(null);
            }
            currentSection = curr;
        }

        currentSection[lastSection] = value;
    }
}
// #endregion
