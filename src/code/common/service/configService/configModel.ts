import { MarkdownRenderMode } from "src/code/browser/workbench/editor/markdown/markdown";
import { AppMode } from "src/code/common/service/configService/configService";

/**
 * @readonly The type of configService.
 */
export enum IConfigType {
    USER,
    GLOBAL,
    TEST,
}

/**
 * @readonly Interface corresponds to the event `onDidChangeConfiguration` in 
 * `configServiceBase`.
 */
export interface IConfigChangeEvent {

    readonly type: IConfigType;
    readonly changes: IConfigChange;

}

export interface IConfigChange {
    sections: string[],
}

/*******************************************************************************
 * Configuration Model
 ******************************************************************************/

 export interface IConfigModel {

    /** @readonly get the inner structure of the configuration (a javascript object) */
    object: any;

    get<T>(section: string | undefined): T | undefined;

    set(section: string | undefined, value: any): void;

}

/**
 * The data structure to stores the actual configruration. Each `configServiceBase`
 * consists exact one ConfigModel.
 * 
 * The default constructor is a null javascript object.
 */
export class ConfigModel implements IConfigModel {

    constructor(
        private _object: any = {}
    ) {}

    get object(): any {
        return this._object;
    }

    protected __setObject(obj: any): void {
        this._object = obj;
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
